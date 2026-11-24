import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Load Firebase projectId for ID token verification
let firebaseProjectId = '';
try {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    firebaseProjectId = typeof cfg.projectId === 'string' ? cfg.projectId : '';
  }
} catch {
  firebaseProjectId = '';
}

// Cache Google x509 public certs for Firebase Auth ID token verification
let cachedCerts: Record<string, string> = {};
let certsExpireAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  if (Date.now() < certsExpireAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error('Unable to fetch authentication certificates');
  }
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await resp.json()) as Record<string, string>;
  certsExpireAt = Date.now() + maxAgeSec * 1000;
  return cachedCerts;
}

interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseUser> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8')) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
  };

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported token algorithm');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('Token expired');
  }
  if (!payload.sub || payload.sub.length > 128) {
    throw new Error('Invalid subject');
  }
  if (firebaseProjectId) {
    if (payload.aud !== firebaseProjectId) {
      throw new Error('Invalid audience');
    }
    if (payload.iss !== `https://securetoken.google.com/${firebaseProjectId}`) {
      throw new Error('Invalid issuer');
    }
  }

  const certs = await getFirebasePublicCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Unknown signing key');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(signatureB64, 'base64url');
  if (!verifier.verify(cert, signature)) {
    throw new Error('Invalid token signature');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
  };
}

async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Missing authentication token.' });
    return;
  }
  try {
    const user = await verifyFirebaseIdToken(token);
    (req as express.Request & { user?: VerifiedFirebaseUser }).user = user;
    next();
  } catch (err) {
    res.status(401).json({
      error: err instanceof Error ? err.message : 'Invalid or expired session token.',
    });
  }
}

// Gemini client helper (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const GEMINI_MODEL = 'gemini-4-hydrogen';

// Safe uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || '.bin';
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, PDF.'));
    }
  },
});

function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'creovate-api' });
  });

  // Serve uploaded files safely (confinement verified)
  app.get('/uploads/:filename', (req, res) => {
    const rawName = req.params.filename;
    if (!/^[a-zA-Z0-9_\-]+\.(jpg|png|webp|gif|mp4|webm|pdf)$/.test(rawName)) {
      res.status(400).json({ error: 'Invalid filename' });
      return;
    }
    const resolved = path.resolve(uploadsDir, rawName);
    if (!resolved.startsWith(uploadsDir + path.sep)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(resolved);
  });

  // Authenticated file upload endpoint
  app.post('/api/upload', requireAuth, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }
      res.json({
        url: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname.slice(0, 140),
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    });
  });

  // CREOVATE INTELLIGENCE status
  app.get('/api/ai/status', (_req, res) => {
    const ai = getGeminiClient();
    res.json({ available: ai !== null, model: GEMINI_MODEL });
  });

  // 1. Smart Creator Matching
  app.post('/api/ai/match-creators', requireAuth, async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'CREOVATE Intelligence is currently unavailable because GEMINI_API_KEY is not configured. Core platform workflows remain fully active.',
      });
      return;
    }
    try {
      const niche = sanitizeText(req.body?.niche, 100);
      const budget = Number(req.body?.budget) || 0;
      const platforms = Array.isArray(req.body?.platforms)
        ? req.body.platforms.slice(0, 8).map((p: unknown) => sanitizeText(p, 40))
        : [];
      const objectives = sanitizeText(req.body?.objectives, 800);
      const creators = Array.isArray(req.body?.creators)
        ? req.body.creators.slice(0, 20).map((c: Record<string, unknown>) => ({
            id: sanitizeText(c.id, 128),
            name: sanitizeText(c.fullName, 120),
            niche: sanitizeText(c.niche, 80),
            platforms: Array.isArray(c.platforms) ? c.platforms.slice(0, 6) : [],
            followersCount: Number(c.followersCount) || 0,
            engagementRate: Number(c.engagementRate) || 0,
            collaborationRate: Number(c.collaborationRate) || 0,
            bio: sanitizeText(c.bio, 300),
          }))
        : [];

      if (creators.length === 0) {
        res.status(400).json({ error: 'No creators supplied for matching.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Recommend the top 3 creators from the candidate list for this campaign.
Campaign Niche: ${niche || 'General'}
Budget: $${budget}
Target Platforms: ${platforms.join(', ') || 'Any'}
Campaign Objectives: ${objectives || 'Brand awareness and high-engagement content'}

Candidates:
${JSON.stringify(creators)}

Return concise, actionable recommendations strictly referencing candidate IDs from the list above.`,
        config: {
          systemInstruction:
            'You are CREOVATE Intelligence, a creator partnership strategist. Always ground match reasons in the provided candidate attributes without inventing metrics.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    creatorId: { type: Type.STRING },
                    creatorName: { type: Type.STRING },
                    fitSummary: { type: Type.STRING },
                    suggestedAngle: { type: Type.STRING },
                    budgetAlignment: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ aiGenerated: true, ...parsed });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to generate creator matches right now.',
      });
    }
  });

  // 2. Campaign Description Generator
  app.post('/api/ai/campaign-description', requireAuth, async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'CREOVATE Intelligence is currently unavailable. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    try {
      const brandName = sanitizeText(req.body?.brandName, 120);
      const title = sanitizeText(req.body?.title, 160);
      const niche = sanitizeText(req.body?.niche, 80);
      const objectives = sanitizeText(req.body?.objectives, 800);
      const targetAudience = sanitizeText(req.body?.targetAudience, 400);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Write a compelling, clear campaign description for a creator collaboration brief.
Brand: ${brandName || 'Brand'}
Campaign Title: ${title || 'New Campaign'}
Niche: ${niche || 'Lifestyle'}
Objectives: ${objectives || 'Drive product awareness and conversions'}
Target Audience: ${targetAudience || 'Digital-first consumers'}`,
        config: {
          systemInstruction:
            'You are CREOVATE Intelligence. Write sharp, concrete, commercially realistic creator marketing copy without buzzword fluff.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              messagingAngles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              callToAction: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ aiGenerated: true, ...parsed });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to generate campaign description.',
      });
    }
  });

  // 3. Campaign Brief Assistant
  app.post('/api/ai/campaign-brief', requireAuth, async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'CREOVATE Intelligence is currently unavailable. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    try {
      const title = sanitizeText(req.body?.title, 160);
      const niche = sanitizeText(req.body?.niche, 80);
      const objectives = sanitizeText(req.body?.objectives, 800);
      const platforms = Array.isArray(req.body?.platforms)
        ? req.body.platforms.slice(0, 8).map((p: unknown) => sanitizeText(p, 40))
        : [];
      const budget = Number(req.body?.budget) || 0;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Structure a complete, actionable creator campaign brief.
Title: ${title}
Niche: ${niche}
Platforms: ${platforms.join(', ') || 'Instagram, YouTube, TikTok'}
Budget: $${budget}
Objectives: ${objectives}`,
        config: {
          systemInstruction:
            'You are CREOVATE Intelligence. Produce structured, realistic deliverables and clear creative instructions for brand-creator contracts.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deliverables: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              instructions: { type: Type.STRING },
              creativeDos: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              creativeDonts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ aiGenerated: true, ...parsed });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to generate campaign brief.',
      });
    }
  });

  // 4. Creator Profile Assistant
  app.post('/api/ai/creator-profile', requireAuth, async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'CREOVATE Intelligence is currently unavailable. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    try {
      const fullName = sanitizeText(req.body?.fullName, 120);
      const niche = sanitizeText(req.body?.niche, 80);
      const currentBio = sanitizeText(req.body?.bio, 1000);
      const skills = Array.isArray(req.body?.skills)
        ? req.body.skills.slice(0, 10).map((s: unknown) => sanitizeText(s, 50))
        : [];
      const portfolioSummary = sanitizeText(req.body?.portfolioSummary, 600);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Improve this creator's brand-facing profile biography and portfolio positioning.
Creator: ${fullName}
Niche: ${niche}
Skills: ${skills.join(', ')}
Current Bio: ${currentBio}
Portfolio Context: ${portfolioSummary}`,
        config: {
          systemInstruction:
            'You are CREOVATE Intelligence. Write confident, authentic creator positioning that helps brands immediately understand format, style, and partnership value.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedBio: { type: Type.STRING },
              portfolioTip: { type: Type.STRING },
              suggestedPitchLine: { type: Type.STRING },
              profileChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ aiGenerated: true, ...parsed });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to generate profile suggestions.',
      });
    }
  });

  // 5. Collaboration Suggestions
  app.post('/api/ai/collab-suggestions', requireAuth, async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'CREOVATE Intelligence is currently unavailable. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    try {
      const role = sanitizeText(req.body?.role, 20);
      const contextSummary = sanitizeText(req.body?.contextSummary, 1600);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Generate 3 concrete brand-creator collaboration concepts tailored for a ${role || 'brand'} user based on this platform context:
${contextSummary}`,
        config: {
          systemInstruction:
            'You are CREOVATE Intelligence. Suggest practical, measurable collaboration formats with clear deliverable ideas and target audience fit.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    partnerFocus: { type: Type.STRING },
                    concept: { type: Type.STRING },
                    deliverableIdea: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ aiGenerated: true, ...parsed });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to generate collaboration suggestions.',
      });
    }
  });

  // Vite dev middleware or production static build
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CREOVATE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CREOVATE server:', err);
  process.exit(1);
});
