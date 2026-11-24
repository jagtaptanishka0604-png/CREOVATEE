import { auth } from './firebase';

export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/src/assets/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to perform this action.');
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadFile(file: File): Promise<{
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'File upload failed.');
  }
  return data;
}

export async function checkAiStatus(): Promise<{ available: boolean; model: string }> {
  try {
    const resp = await fetch('/api/ai/status');
    if (!resp.ok) return { available: false, model: 'gemini-4-hydrogen' };
    return (await resp.json()) as { available: boolean; model: string };
  } catch {
    return { available: false, model: 'gemini-4-hydrogen' };
  }
}

async function postAi<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'CREOVATE Intelligence request failed.');
  }
  return data as T;
}

export interface CreatorMatchResult {
  aiGenerated: boolean;
  summary: string;
  recommendations: {
    creatorId: string;
    creatorName: string;
    fitSummary: string;
    suggestedAngle: string;
    budgetAlignment: string;
  }[];
}

export function aiMatchCreators(payload: {
  niche: string;
  budget: number;
  platforms: string[];
  objectives: string;
  creators: {
    id: string;
    fullName: string;
    niche: string;
    platforms: string[];
    followersCount: number;
    engagementRate: number;
    collaborationRate: number;
    bio: string;
  }[];
}): Promise<CreatorMatchResult> {
  return postAi<CreatorMatchResult>('/api/ai/match-creators', payload);
}

export interface CampaignDescriptionResult {
  aiGenerated: boolean;
  description: string;
  messagingAngles: string[];
  callToAction: string;
}

export function aiGenerateCampaignDescription(payload: {
  brandName: string;
  title: string;
  niche: string;
  objectives: string;
  targetAudience: string;
}): Promise<CampaignDescriptionResult> {
  return postAi<CampaignDescriptionResult>('/api/ai/campaign-description', payload);
}

export interface CampaignBriefResult {
  aiGenerated: boolean;
  deliverables: string[];
  instructions: string;
  creativeDos: string[];
  creativeDonts: string[];
}

export function aiGenerateCampaignBrief(payload: {
  title: string;
  niche: string;
  objectives: string;
  platforms: string[];
  budget: number;
}): Promise<CampaignBriefResult> {
  return postAi<CampaignBriefResult>('/api/ai/campaign-brief', payload);
}

export interface CreatorProfileAssistResult {
  aiGenerated: boolean;
  improvedBio: string;
  portfolioTip: string;
  suggestedPitchLine: string;
  profileChecklist: string[];
}

export function aiAssistCreatorProfile(payload: {
  fullName: string;
  niche: string;
  bio: string;
  skills: string[];
  portfolioSummary: string;
}): Promise<CreatorProfileAssistResult> {
  return postAi<CreatorProfileAssistResult>('/api/ai/creator-profile', payload);
}

export interface CollabSuggestionsResult {
  aiGenerated: boolean;
  suggestions: {
    title: string;
    partnerFocus: string;
    concept: string;
    deliverableIdea: string;
  }[];
}

export function aiCollabSuggestions(payload: {
  role: string;
  contextSummary: string;
}): Promise<CollabSuggestionsResult> {
  return postAi<CollabSuggestionsResult>('/api/ai/collab-suggestions', payload);
}
