export type UserRole = 'brand' | 'creator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserRecord {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  onboardingComplete: boolean;
  photoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BrandProfile {
  id: string;
  ownerId: string;
  brandName: string;
  description: string;
  industry: string;
  website?: string;
  logoUrl?: string;
  location: string;
  contactName?: string;
  verified: boolean;
  visibility: 'public' | 'private';
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreatorProfile {
  id: string;
  ownerId: string;
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
  verified: boolean;
  visibility: 'public' | 'private';
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SocialAccount {
  id: string;
  ownerId: string;
  creatorId: string;
  platform: string;
  handle: string;
  url: string;
  followers: number;
  engagementRate: number;
  visibility: 'public' | 'private';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PortfolioItem {
  id: string;
  ownerId: string;
  creatorId: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  category: string;
  visibility: 'public' | 'private';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CampaignStatus = 'draft' | 'open' | 'active' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  brandId: string;
  brandName: string;
  brandLogoUrl?: string;
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
  progress: number;
  visibility: 'public' | 'private';
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Contact {
  id: string;
  brandId: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorNiche: string;
  creatorPhotoUrl?: string;
  folder: string;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface CollaborationRequest {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  initiatorRole: 'brand' | 'creator';
  proposedBudget: number;
  message: string;
  status: RequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CollaborationStatus = 'active' | 'in_review' | 'completed' | 'cancelled';

export interface Collaboration {
  id: string;
  requestId: string;
  campaignId: string;
  campaignTitle: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  budget: number;
  deadline: string;
  deliverablesSummary: string;
  progress: number;
  status: CollaborationStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested';

export interface Deliverable {
  id: string;
  collaborationId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  title: string;
  description: string;
  fileUrl?: string;
  linkUrl?: string;
  status: DeliverableStatus;
  feedback: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Conversation {
  id: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  campaignId?: string;
  campaignTitle?: string;
  lastMessage: string;
  lastSenderId: string;
  unreadByBrand: number;
  unreadByCreator: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  brandId: string;
  creatorId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt?: unknown;
}

export type NotificationType =
  | 'invitation'
  | 'invitation_accepted'
  | 'invitation_rejected'
  | 'message'
  | 'campaign_published'
  | 'campaign_updated'
  | 'deliverable_submitted'
  | 'deadline'
  | 'announcement';

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkTab?: string;
  referenceId?: string;
  read: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'user' | 'campaign';
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  status: ReportStatus;
  resolutionNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminActionItem {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: string;
  targetType: 'user' | 'campaign' | 'report' | 'system';
  targetId: string;
  details: string;
  createdAt?: unknown;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export type BrandTab =
  | 'overview'
  | 'discover'
  | 'contacts'
  | 'campaigns'
  | 'collaborations'
  | 'intelligence'
  | 'messages'
  | 'notifications'
  | 'settings';

export type CreatorTab =
  | 'overview'
  | 'profile'
  | 'portfolio'
  | 'campaigns'
  | 'requests'
  | 'collaborations'
  | 'intelligence'
  | 'messages'
  | 'notifications'
  | 'settings';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'campaigns'
  | 'reports'
  | 'analytics';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'jagtaptanishka0604@gmail.com';
