import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type {
  UserRecord,
  UserRole,
  BrandProfile,
  CreatorProfile,
  SocialAccount,
  PortfolioItem,
  Campaign,
  CampaignStatus,
  Contact,
  CollaborationRequest,
  Collaboration,
  CollaborationStatus,
  Deliverable,
  Conversation,
  ChatMessage,
  NotificationItem,
  NotificationType,
  ReportItem,
  ReportStatus,
  AdminActionItem,
} from '../types';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function clampStr(value: string | undefined | null, maxLen: number): string {
  return (value ?? '').trim().slice(0, maxLen);
}

function clampList(values: string[] | undefined, maxItems: number, maxItemLen = 160): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => v.trim().slice(0, maxItemLen))
    .filter((v) => v.length > 0)
    .slice(0, maxItems);
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? ts : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    const d = (ts as { toDate: () => Date }).toDate();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return 'Just now';
}

export function timestampToMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

// =============================================================================
// USERS
// =============================================================================

export async function getUserRecord(uid: string): Promise<UserRecord | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserRecord(params: {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
}): Promise<UserRecord> {
  const path = `users/${params.uid}`;
  const payload = {
    uid: clampStr(params.uid, 128),
    name: clampStr(params.name, 120) || 'CREOVATE Member',
    email: clampStr(params.email, 254),
    role: params.role,
    status: 'active' as const,
    onboardingComplete: params.role === 'admin',
    photoUrl: clampStr(params.photoUrl, 500),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'users', params.uid), payload);
    return { ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRecord(
  uid: string,
  updates: Partial<Pick<UserRecord, 'name' | 'onboardingComplete' | 'photoUrl'>>
): Promise<void> {
  const path = `users/${uid}`;
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.name !== undefined) clean.name = clampStr(updates.name, 120);
  if (updates.onboardingComplete !== undefined) clean.onboardingComplete = Boolean(updates.onboardingComplete);
  if (updates.photoUrl !== undefined) clean.photoUrl = clampStr(updates.photoUrl, 500);
  try {
    await updateDoc(doc(db, 'users', uid), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminUpdateUser(
  uid: string,
  updates: Partial<Pick<UserRecord, 'status' | 'role'>>
): Promise<void> {
  const path = `users/${uid}`;
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.status !== undefined) clean.status = updates.status;
  if (updates.role !== undefined) clean.role = updates.role;
  try {
    await updateDoc(doc(db, 'users', uid), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =============================================================================
// BRAND & CREATOR PROFILES
// =============================================================================

export async function saveBrandProfile(
  uid: string,
  input: {
    brandName: string;
    description: string;
    industry: string;
    website?: string;
    logoUrl?: string;
    location: string;
    contactName?: string;
  },
  isUpdate: boolean
): Promise<void> {
  const path = `brandProfiles/${uid}`;
  try {
    if (isUpdate) {
      await updateDoc(doc(db, 'brandProfiles', uid), {
        brandName: clampStr(input.brandName, 120) || 'Brand Workspace',
        description: clampStr(input.description, 2000),
        industry: clampStr(input.industry, 80),
        website: clampStr(input.website, 300),
        logoUrl: clampStr(input.logoUrl, 500),
        location: clampStr(input.location, 120),
        contactName: clampStr(input.contactName, 120),
        visibility: 'public',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'brandProfiles', uid), {
        ownerId: uid,
        brandName: clampStr(input.brandName, 120) || 'Brand Workspace',
        description: clampStr(input.description, 2000),
        industry: clampStr(input.industry, 80),
        website: clampStr(input.website, 300),
        logoUrl: clampStr(input.logoUrl, 500),
        location: clampStr(input.location, 120),
        contactName: clampStr(input.contactName, 120),
        verified: false,
        visibility: 'public',
        isDemo: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function saveCreatorProfile(
  uid: string,
  input: {
    fullName: string;
    username: string;
    photoUrl?: string;
    bio: string;
    location: string;
    niche: string;
    skills: string[];
    platforms: string[];
    followersCount: number;
    engagementRate: number;
    collaborationRate: number;
    preferences?: string;
  },
  isUpdate: boolean
): Promise<void> {
  const path = `creatorProfiles/${uid}`;
  const cleanUsername = clampStr(input.username, 50).replace(/[^a-zA-Z0-9_.-]/g, '') || `creator_${uid.slice(0, 6)}`;
  try {
    if (isUpdate) {
      await updateDoc(doc(db, 'creatorProfiles', uid), {
        fullName: clampStr(input.fullName, 120) || 'Creator',
        username: cleanUsername.length >= 2 ? cleanUsername : `cr_${cleanUsername}`,
        photoUrl: clampStr(input.photoUrl, 500),
        bio: clampStr(input.bio, 1500),
        location: clampStr(input.location, 120),
        niche: clampStr(input.niche, 80),
        skills: clampList(input.skills, 10),
        platforms: clampList(input.platforms, 8),
        followersCount: Math.max(0, Math.min(500000000, Number(input.followersCount) || 0)),
        engagementRate: Math.max(0, Math.min(100, Number(input.engagementRate) || 0)),
        collaborationRate: Math.max(0, Math.min(10000000, Number(input.collaborationRate) || 0)),
        preferences: clampStr(input.preferences, 500),
        visibility: 'public',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'creatorProfiles', uid), {
        ownerId: uid,
        fullName: clampStr(input.fullName, 120) || 'Creator',
        username: cleanUsername.length >= 2 ? cleanUsername : `cr_${cleanUsername}`,
        photoUrl: clampStr(input.photoUrl, 500),
        bio: clampStr(input.bio, 1500),
        location: clampStr(input.location, 120),
        niche: clampStr(input.niche, 80),
        skills: clampList(input.skills, 10),
        platforms: clampList(input.platforms, 8),
        followersCount: Math.max(0, Math.min(500000000, Number(input.followersCount) || 0)),
        engagementRate: Math.max(0, Math.min(100, Number(input.engagementRate) || 0)),
        collaborationRate: Math.max(0, Math.min(10000000, Number(input.collaborationRate) || 0)),
        preferences: clampStr(input.preferences, 500),
        verified: false,
        visibility: 'public',
        isDemo: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export function subscribePublicCreators(onData: (creators: CreatorProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'creatorProfiles'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CreatorProfile, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.updatedAt) - timestampToMillis(a.updatedAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'creatorProfiles')
  );
}

export function subscribePublicBrands(onData: (brands: BrandProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'brandProfiles'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BrandProfile, 'id'>) }));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'brandProfiles')
  );
}

// =============================================================================
// SOCIAL ACCOUNTS & PORTFOLIOS
// =============================================================================

export async function addSocialAccount(
  uid: string,
  input: { platform: string; handle: string; url: string; followers: number; engagementRate: number }
): Promise<string> {
  const id = makeSafeId('soc');
  const path = `socialAccounts/${id}`;
  try {
    await setDoc(doc(db, 'socialAccounts', id), {
      ownerId: uid,
      creatorId: uid,
      platform: clampStr(input.platform, 40) || 'Instagram',
      handle: clampStr(input.handle, 80) || '@creator',
      url: clampStr(input.url, 400) || 'https://instagram.com',
      followers: Math.max(0, Number(input.followers) || 0),
      engagementRate: Math.max(0, Math.min(100, Number(input.engagementRate) || 0)),
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSocialAccount(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'socialAccounts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `socialAccounts/${id}`);
  }
}

export function subscribePublicSocialAccounts(onData: (items: SocialAccount[]) => void): Unsubscribe {
  const q = query(collection(db, 'socialAccounts'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SocialAccount, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'socialAccounts')
  );
}

export async function createPortfolioItem(
  uid: string,
  input: { title: string; description: string; mediaType: 'image' | 'video'; mediaUrl: string; category: string }
): Promise<string> {
  const id = makeSafeId('port');
  const path = `portfolios/${id}`;
  try {
    await setDoc(doc(db, 'portfolios', id), {
      ownerId: uid,
      creatorId: uid,
      title: clampStr(input.title, 140),
      description: clampStr(input.description, 1200),
      mediaType: input.mediaType,
      mediaUrl: clampStr(input.mediaUrl, 600),
      category: clampStr(input.category, 60) || 'Campaign',
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePortfolioItem(
  id: string,
  input: { title: string; description: string; mediaType: 'image' | 'video'; mediaUrl: string; category: string }
): Promise<void> {
  const path = `portfolios/${id}`;
  try {
    await updateDoc(doc(db, 'portfolios', id), {
      title: clampStr(input.title, 140),
      description: clampStr(input.description, 1200),
      mediaType: input.mediaType,
      mediaUrl: clampStr(input.mediaUrl, 600),
      category: clampStr(input.category, 60) || 'Campaign',
      visibility: 'public',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePortfolioItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'portfolios', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `portfolios/${id}`);
  }
}

export function subscribePublicPortfolios(onData: (items: PortfolioItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'portfolios'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PortfolioItem, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'portfolios')
  );
}

// =============================================================================
// CAMPAIGNS
// =============================================================================

export async function createCampaign(
  brandId: string,
  brandName: string,
  brandLogoUrl: string | undefined,
  input: {
    title: string;
    description: string;
    objectives: string;
    targetAudience: string;
    niche: string;
    platforms: string[];
    budget: number;
    startDate: string;
    endDate: string;
    deliverables: string[];
    instructions: string;
    coverImageUrl?: string;
    status: CampaignStatus;
    allowApplications: boolean;
  }
): Promise<string> {
  const id = makeSafeId('camp');
  const path = `campaigns/${id}`;
  try {
    await setDoc(doc(db, 'campaigns', id), {
      brandId,
      brandName: clampStr(brandName, 120) || 'Brand',
      brandLogoUrl: clampStr(brandLogoUrl, 500),
      title: clampStr(input.title, 160),
      description: clampStr(input.description, 3000),
      objectives: clampStr(input.objectives, 1500),
      targetAudience: clampStr(input.targetAudience, 500),
      niche: clampStr(input.niche, 80) || 'Lifestyle',
      platforms: clampList(input.platforms, 8),
      budget: Math.max(0, Number(input.budget) || 0),
      startDate: clampStr(input.startDate, 30),
      endDate: clampStr(input.endDate, 30),
      deliverables: clampList(input.deliverables, 15),
      instructions: clampStr(input.instructions, 2500),
      coverImageUrl: clampStr(input.coverImageUrl, 500),
      status: input.status,
      allowApplications: Boolean(input.allowApplications),
      progress: input.status === 'active' ? 25 : input.status === 'completed' ? 100 : 10,
      visibility: input.status === 'draft' ? 'private' : 'public',
      isDemo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCampaign(
  campaignId: string,
  updates: Partial<{
    title: string;
    description: string;
    objectives: string;
    targetAudience: string;
    niche: string;
    platforms: string[];
    budget: number;
    startDate: string;
    endDate: string;
    deliverables: string[];
    instructions: string;
    coverImageUrl: string;
    status: CampaignStatus;
    allowApplications: boolean;
    progress: number;
    visibility: 'public' | 'private';
  }>
): Promise<void> {
  const path = `campaigns/${campaignId}`;
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.title !== undefined) clean.title = clampStr(updates.title, 160);
  if (updates.description !== undefined) clean.description = clampStr(updates.description, 3000);
  if (updates.objectives !== undefined) clean.objectives = clampStr(updates.objectives, 1500);
  if (updates.targetAudience !== undefined) clean.targetAudience = clampStr(updates.targetAudience, 500);
  if (updates.niche !== undefined) clean.niche = clampStr(updates.niche, 80);
  if (updates.platforms !== undefined) clean.platforms = clampList(updates.platforms, 8);
  if (updates.budget !== undefined) clean.budget = Math.max(0, Number(updates.budget) || 0);
  if (updates.startDate !== undefined) clean.startDate = clampStr(updates.startDate, 30);
  if (updates.endDate !== undefined) clean.endDate = clampStr(updates.endDate, 30);
  if (updates.deliverables !== undefined) clean.deliverables = clampList(updates.deliverables, 15);
  if (updates.instructions !== undefined) clean.instructions = clampStr(updates.instructions, 2500);
  if (updates.coverImageUrl !== undefined) clean.coverImageUrl = clampStr(updates.coverImageUrl, 500);
  if (updates.status !== undefined) {
    clean.status = updates.status;
    if (updates.visibility === undefined) {
      clean.visibility = updates.status === 'draft' ? 'private' : 'public';
    }
  }
  if (updates.allowApplications !== undefined) clean.allowApplications = Boolean(updates.allowApplications);
  if (updates.progress !== undefined) clean.progress = Math.max(0, Math.min(100, Number(updates.progress) || 0));
  if (updates.visibility !== undefined) clean.visibility = updates.visibility;

  try {
    await updateDoc(doc(db, 'campaigns', campaignId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'campaigns', campaignId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `campaigns/${campaignId}`);
  }
}

export function subscribePublicCampaigns(onData: (campaigns: Campaign[]) => void): Unsubscribe {
  const q = query(collection(db, 'campaigns'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'campaigns')
  );
}

export function subscribeBrandCampaigns(brandId: string, onData: (campaigns: Campaign[]) => void): Unsubscribe {
  const q = query(collection(db, 'campaigns'), where('brandId', '==', brandId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'campaigns')
  );
}

// =============================================================================
// CONTACTS
// =============================================================================

export async function saveContact(
  brandId: string,
  creator: { id: string; fullName: string; username: string; niche: string; photoUrl?: string },
  folder = 'Shortlist',
  notes = ''
): Promise<void> {
  const contactId = `${brandId}_${creator.id}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 190);
  const path = `contacts/${contactId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'contacts', contactId));
    if (existingSnap.exists()) {
      await updateDoc(doc(db, 'contacts', contactId), {
        creatorName: clampStr(creator.fullName, 120),
        creatorUsername: clampStr(creator.username, 60),
        creatorNiche: clampStr(creator.niche, 80),
        creatorPhotoUrl: clampStr(creator.photoUrl, 500),
        folder: clampStr(folder, 60) || 'Shortlist',
        notes: clampStr(notes, 1000),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'contacts', contactId), {
        brandId,
        creatorId: creator.id,
        creatorName: clampStr(creator.fullName, 120),
        creatorUsername: clampStr(creator.username, 60),
        creatorNiche: clampStr(creator.niche, 80),
        creatorPhotoUrl: clampStr(creator.photoUrl, 500),
        folder: clampStr(folder, 60) || 'Shortlist',
        notes: clampStr(notes, 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeContact(contactId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'contacts', contactId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `contacts/${contactId}`);
  }
}

export function subscribeBrandContacts(brandId: string, onData: (contacts: Contact[]) => void): Unsubscribe {
  const q = query(collection(db, 'contacts'), where('brandId', '==', brandId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Contact, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.updatedAt) - timestampToMillis(a.updatedAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'contacts')
  );
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export async function createNotification(input: {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkTab?: string;
  referenceId?: string;
}): Promise<void> {
  const id = makeSafeId('notif');
  const path = `notifications/${id}`;
  try {
    await setDoc(doc(db, 'notifications', id), {
      recipientId: clampStr(input.recipientId, 128),
      senderId: clampStr(input.senderId, 128),
      type: input.type,
      title: clampStr(input.title, 160),
      body: clampStr(input.body, 500),
      linkTab: clampStr(input.linkTab, 60),
      referenceId: clampStr(input.referenceId, 128),
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsRead(notifications: NotificationItem[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.slice(0, 400).forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

export function subscribeUserNotifications(uid: string, onData: (items: NotificationItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
  );
}

// =============================================================================
// COLLABORATION REQUESTS & COLLABORATIONS (ATOMIC WORKFLOW)
// =============================================================================

export async function sendCollaborationRequest(input: {
  campaignId: string;
  campaignTitle: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  initiatorRole: 'brand' | 'creator';
  proposedBudget: number;
  message: string;
}): Promise<string> {
  // Deterministic ID prevents duplicate invitations/applications for the same campaign + creator
  const requestId = `${input.campaignId}_${input.creatorId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 190);
  const path = `collaborationRequests/${requestId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'collaborationRequests', requestId));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as CollaborationRequest;
      throw new Error(
        `A collaboration request for this campaign and creator already exists (status: ${existingData.status}).`
      );
    }

    await setDoc(doc(db, 'collaborationRequests', requestId), {
      campaignId: clampStr(input.campaignId, 128),
      campaignTitle: clampStr(input.campaignTitle, 160),
      brandId: clampStr(input.brandId, 128),
      brandName: clampStr(input.brandName, 120),
      creatorId: clampStr(input.creatorId, 128),
      creatorName: clampStr(input.creatorName, 120),
      initiatorRole: input.initiatorRole,
      proposedBudget: Math.max(0, Number(input.proposedBudget) || 0),
      message: clampStr(input.message, 1500),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Notify recipient
    const recipientId = input.initiatorRole === 'brand' ? input.creatorId : input.brandId;
    const senderId = input.initiatorRole === 'brand' ? input.brandId : input.creatorId;
    await createNotification({
      recipientId,
      senderId,
      type: 'invitation',
      title:
        input.initiatorRole === 'brand'
          ? `New campaign invitation from ${input.brandName}`
          : `New campaign application from ${input.creatorName}`,
      body: `${input.campaignTitle} — Budget $${input.proposedBudget.toLocaleString()}`,
      linkTab: input.initiatorRole === 'brand' ? 'requests' : 'collaborations',
      referenceId: requestId.slice(0, 128),
    });

    return requestId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToCollaborationRequest(
  reqItem: CollaborationRequest,
  decision: 'accepted' | 'rejected' | 'withdrawn',
  actorUid: string,
  deadline = '2026-12-31',
  deliverablesSummary = 'Campaign deliverables per brief'
): Promise<string | null> {
  const reqPath = `collaborationRequests/${reqItem.id}`;
  try {
    if (decision === 'accepted') {
      // Atomic batch: update request to accepted + create Collaboration (satisfies Pillar 7 getAfter invariant)
      const collabId = makeSafeId('col');
      const batch = writeBatch(db);
      batch.update(doc(db, 'collaborationRequests', reqItem.id), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'collaborations', collabId), {
        requestId: reqItem.id,
        campaignId: reqItem.campaignId,
        campaignTitle: clampStr(reqItem.campaignTitle, 160),
        brandId: reqItem.brandId,
        brandName: clampStr(reqItem.brandName, 120),
        creatorId: reqItem.creatorId,
        creatorName: clampStr(reqItem.creatorName, 120),
        budget: reqItem.proposedBudget,
        deadline: clampStr(deadline, 30),
        deliverablesSummary: clampStr(deliverablesSummary, 1000),
        progress: 15,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      const recipientId = actorUid === reqItem.brandId ? reqItem.creatorId : reqItem.brandId;
      await createNotification({
        recipientId,
        senderId: actorUid,
        type: 'invitation_accepted',
        title: `Collaboration accepted: ${reqItem.campaignTitle}`,
        body: `Your collaboration workspace is now active.`,
        linkTab: 'collaborations',
        referenceId: collabId,
      });
      return collabId;
    }

    await updateDoc(doc(db, 'collaborationRequests', reqItem.id), {
      status: decision,
      updatedAt: serverTimestamp(),
    });

    if (decision === 'rejected') {
      const recipientId = actorUid === reqItem.brandId ? reqItem.creatorId : reqItem.brandId;
      await createNotification({
        recipientId,
        senderId: actorUid,
        type: 'invitation_rejected',
        title: `Request declined: ${reqItem.campaignTitle}`,
        body: `The collaboration request was declined.`,
        linkTab: 'collaborations',
        referenceId: reqItem.id.slice(0, 128),
      });
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reqPath);
  }
}

export function subscribeRequestsForBrand(brandId: string, onData: (items: CollaborationRequest[]) => void): Unsubscribe {
  const q = query(collection(db, 'collaborationRequests'), where('brandId', '==', brandId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CollaborationRequest, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'collaborationRequests')
  );
}

export function subscribeRequestsForCreator(creatorId: string, onData: (items: CollaborationRequest[]) => void): Unsubscribe {
  const q = query(collection(db, 'collaborationRequests'), where('creatorId', '==', creatorId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CollaborationRequest, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'collaborationRequests')
  );
}

export function subscribeCollaborationsByField(
  field: 'brandId' | 'creatorId',
  uid: string,
  onData: (items: Collaboration[]) => void
): Unsubscribe {
  const q = query(collection(db, 'collaborations'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Collaboration, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.updatedAt) - timestampToMillis(a.updatedAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'collaborations')
  );
}

export async function updateCollaborationStatus(
  collabId: string,
  updates: { status?: CollaborationStatus; progress?: number }
): Promise<void> {
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.status !== undefined) clean.status = updates.status;
  if (updates.progress !== undefined) clean.progress = Math.max(0, Math.min(100, Number(updates.progress) || 0));
  try {
    await updateDoc(doc(db, 'collaborations', collabId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `collaborations/${collabId}`);
  }
}

// =============================================================================
// DELIVERABLES
// =============================================================================

export async function submitDeliverable(input: {
  collaborationId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  title: string;
  description: string;
  fileUrl?: string;
  linkUrl?: string;
}): Promise<string> {
  const id = makeSafeId('deliv');
  const path = `deliverables/${id}`;
  try {
    await setDoc(doc(db, 'deliverables', id), {
      collaborationId: input.collaborationId,
      campaignId: input.campaignId,
      brandId: input.brandId,
      creatorId: input.creatorId,
      title: clampStr(input.title, 160),
      description: clampStr(input.description, 1500),
      fileUrl: clampStr(input.fileUrl, 600),
      linkUrl: clampStr(input.linkUrl, 600),
      status: 'submitted',
      feedback: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'collaborations', input.collaborationId), {
      status: 'in_review',
      progress: 75,
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      recipientId: input.brandId,
      senderId: input.creatorId,
      type: 'deliverable_submitted',
      title: `Deliverable submitted: ${input.title}`,
      body: `A creator submitted content for your review.`,
      linkTab: 'collaborations',
      referenceId: id,
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function reviewDeliverable(
  deliverable: Deliverable,
  decision: 'approved' | 'revision_requested',
  feedback: string,
  actorUid: string
): Promise<void> {
  const path = `deliverables/${deliverable.id}`;
  try {
    await updateDoc(doc(db, 'deliverables', deliverable.id), {
      status: decision,
      feedback: clampStr(feedback, 1000),
      updatedAt: serverTimestamp(),
    });

    if (decision === 'approved') {
      await updateDoc(doc(db, 'collaborations', deliverable.collaborationId), {
        progress: 100,
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'collaborations', deliverable.collaborationId), {
        progress: 55,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    }

    await createNotification({
      recipientId: deliverable.creatorId,
      senderId: actorUid,
      type: 'campaign_updated',
      title:
        decision === 'approved'
          ? `Deliverable approved: ${deliverable.title}`
          : `Revision requested: ${deliverable.title}`,
      body: feedback || (decision === 'approved' ? 'Collaboration marked complete.' : 'Please review brand notes.'),
      linkTab: 'collaborations',
      referenceId: deliverable.id,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeDeliverablesByField(
  field: 'brandId' | 'creatorId',
  uid: string,
  onData: (items: Deliverable[]) => void
): Unsubscribe {
  const q = query(collection(db, 'deliverables'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Deliverable, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'deliverables')
  );
}

// =============================================================================
// CONVERSATIONS & MESSAGES
// =============================================================================

export async function getOrCreateConversation(input: {
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  campaignId?: string;
  campaignTitle?: string;
}): Promise<string> {
  const convId = `${input.brandId}_${input.creatorId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 190);
  const path = `conversations/${convId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'conversations', convId));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'conversations', convId), {
        brandId: input.brandId,
        brandName: clampStr(input.brandName, 120) || 'Brand',
        creatorId: input.creatorId,
        creatorName: clampStr(input.creatorName, 120) || 'Creator',
        campaignId: clampStr(input.campaignId, 128),
        campaignTitle: clampStr(input.campaignTitle, 160),
        lastMessage: 'Conversation started',
        lastSenderId: '',
        unreadByBrand: 0,
        unreadByCreator: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return convId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function sendMessage(
  conversation: Conversation,
  senderId: string,
  senderName: string,
  body: string
): Promise<void> {
  const msgId = makeSafeId('msg');
  const trimmed = clampStr(body, 2000);
  if (!trimmed) return;
  const msgPath = `conversations/${conversation.id}/messages/${msgId}`;
  try {
    const isBrandSender = senderId === conversation.brandId;
    await setDoc(doc(db, 'conversations', conversation.id, 'messages', msgId), {
      conversationId: conversation.id,
      brandId: conversation.brandId,
      creatorId: conversation.creatorId,
      senderId,
      senderName: clampStr(senderName, 120),
      body: trimmed,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'conversations', conversation.id), {
      lastMessage: trimmed.slice(0, 500),
      lastSenderId: senderId,
      unreadByBrand: isBrandSender ? 0 : (conversation.unreadByBrand || 0) + 1,
      unreadByCreator: isBrandSender ? (conversation.unreadByCreator || 0) + 1 : 0,
      updatedAt: serverTimestamp(),
    });

    const recipientId = isBrandSender ? conversation.creatorId : conversation.brandId;
    if (recipientId !== senderId) {
      await createNotification({
        recipientId,
        senderId,
        type: 'message',
        title: `New message from ${senderName}`,
        body: trimmed.slice(0, 140),
        linkTab: 'messages',
        referenceId: conversation.id.slice(0, 128),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }
}

export async function markConversationRead(conversation: Conversation, readerUid: string): Promise<void> {
  const isBrand = readerUid === conversation.brandId;
  if (isBrand && conversation.unreadByBrand === 0) return;
  if (!isBrand && conversation.unreadByCreator === 0) return;
  try {
    await updateDoc(doc(db, 'conversations', conversation.id), {
      unreadByBrand: isBrand ? 0 : conversation.unreadByBrand,
      unreadByCreator: isBrand ? conversation.unreadByCreator : 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversation.id}`);
  }
}

export function subscribeConversationsByField(
  field: 'brandId' | 'creatorId',
  uid: string,
  onData: (items: Conversation[]) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) }));
      list.sort((a, b) => timestampToMillis(b.updatedAt) - timestampToMillis(a.updatedAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'conversations')
  );
}

export function subscribeConversationMessages(
  conversationId: string,
  field: 'brandId' | 'creatorId',
  uid: string,
  onData: (items: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    where(field, '==', uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
      list.sort((a, b) => timestampToMillis(a.createdAt) - timestampToMillis(b.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`)
  );
}

// =============================================================================
// REPORTS & ADMIN CONTROL CENTER
// =============================================================================

export async function submitReport(input: {
  reporterId: string;
  targetType: 'user' | 'campaign';
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
}): Promise<string> {
  const id = makeSafeId('rep');
  try {
    await setDoc(doc(db, 'reports', id), {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: clampStr(input.targetId, 128),
      targetName: clampStr(input.targetName, 160),
      reason: clampStr(input.reason, 120),
      description: clampStr(input.description, 1500),
      status: 'pending',
      resolutionNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${id}`);
  }
}

export async function adminResolveReport(
  reportId: string,
  status: ReportStatus,
  resolutionNote: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      resolutionNote: clampStr(resolutionNote, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function logAdminAction(input: {
  adminId: string;
  adminEmail: string;
  actionType: string;
  targetType: 'user' | 'campaign' | 'report' | 'system';
  targetId: string;
  details: string;
}): Promise<void> {
  const id = makeSafeId('act');
  try {
    await setDoc(doc(db, 'adminActions', id), {
      adminId: input.adminId,
      adminEmail: clampStr(input.adminEmail, 254),
      actionType: clampStr(input.actionType, 80),
      targetType: input.targetType,
      targetId: clampStr(input.targetId, 128),
      details: clampStr(input.details, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `adminActions/${id}`);
  }
}

export async function fetchAdminOverviewData(): Promise<{
  users: UserRecord[];
  campaigns: Campaign[];
  collaborations: Collaboration[];
  reports: ReportItem[];
  adminActions: AdminActionItem[];
}> {
  try {
    const [usersSnap, campSnap, collabSnap, repSnap, actSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'campaigns')),
      getDocs(collection(db, 'collaborations')),
      getDocs(collection(db, 'reports')),
      getDocs(collection(db, 'adminActions')),
    ]);

    return {
      users: usersSnap.docs.map((d) => d.data() as UserRecord),
      campaigns: campSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, 'id'>) })),
      collaborations: collabSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Collaboration, 'id'>) })),
      reports: repSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportItem, 'id'>) })),
      adminActions: actSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<AdminActionItem, 'id'>) }))
        .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_overview');
  }
}
