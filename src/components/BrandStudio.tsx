import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Megaphone,
  Handshake,
  Sparkles,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  Grid,
  List,
  Plus,
  BadgeCheck,
  MapPin,
  Trash2,
  Edit3,
  Send,
  X,
  CheckCircle2,
  Flag,
  Upload,
  ExternalLink,
  Menu,
  Shield,
  Users,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type {
  BrandProfile,
  BrandTab,
  Campaign,
  CampaignStatus,
  Collaboration,
  CollaborationRequest,
  Contact,
  Conversation,
  CreatorProfile,
  Deliverable,
  NotificationItem,
  PortfolioItem,
  SocialAccount,
  UserRecord,
} from '../types';
import { ASSETS, NICHES, PLATFORMS, formatCurrency, formatNumberCompact } from '../data/demoData';
import {
  createCampaign,
  deleteCampaign,
  formatTimestamp,
  getOrCreateConversation,
  removeContact,
  respondToCollaborationRequest,
  reviewDeliverable,
  saveBrandProfile,
  saveContact,
  sendCollaborationRequest,
  updateCampaign,
  updateCollaborationStatus,
} from '../lib/firestoreService';
import { aiGenerateCampaignBrief, aiGenerateCampaignDescription, isSafeUrl, uploadFile } from '../lib/api';
import {
  AnimatedCounter,
  ConfirmDialog,
  CreovateLogo,
  EmptyState,
  SafeImage,
  StatusText,
  ThemeToggle,
} from './UIPrimitives';
import { MessagingCenter } from './MessagingCenter';
import { NotificationCenter } from './NotificationCenter';
import { CreovateIntelligence } from './CreovateIntelligence';
import { ReportModal } from './ReportModal';

interface BrandStudioProps {
  dark: boolean;
  onToggleTheme: () => void;
  user: UserRecord;
  isAdminUser: boolean;
  brandProfile: BrandProfile | null;
  creators: CreatorProfile[];
  socialAccounts: SocialAccount[];
  portfolios: PortfolioItem[];
  campaigns: Campaign[];
  contacts: Contact[];
  requests: CollaborationRequest[];
  collaborations: Collaboration[];
  deliverables: Deliverable[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  onSwitchWorkspace?: (target: 'brand' | 'creator' | 'admin' | 'landing') => void;
  onLogout: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

const CONTACT_FOLDERS = ['All', 'Shortlist', 'Priority', 'Past Partners', 'Tech', 'Beauty'];

export function BrandStudio({
  dark,
  onToggleTheme,
  user,
  isAdminUser,
  brandProfile,
  creators,
  socialAccounts,
  portfolios,
  campaigns,
  contacts,
  requests,
  collaborations,
  deliverables,
  conversations,
  notifications,
  onSwitchWorkspace,
  onLogout,
  onToast,
}: BrandStudioProps) {
  const [tab, setTab] = useState<BrandTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Discovery Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [minFollowers, setMinFollowers] = useState('0');
  const [minEngagement, setMinEngagement] = useState('0');
  const [maxBudget, setMaxBudget] = useState('50000');
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'rate_asc'>('followers');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modals & Selections
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [inviteTargetCreator, setInviteTargetCreator] = useState<CreatorProfile | null>(null);
  const [inviteCampaignId, setInviteCampaignId] = useState('');
  const [inviteBudget, setInviteBudget] = useState('3500');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  // Contact Filters
  const [contactSearch, setContactSearch] = useState('');
  const [contactFolder, setContactFolder] = useState('All');

  // Campaign Builder Modal
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [builderStep, setBuilderStep] = useState(1);
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campObjectives, setCampObjectives] = useState('');
  const [campAudience, setCampAudience] = useState('');
  const [campNiche, setCampNiche] = useState(NICHES[0]);
  const [campPlatforms, setCampPlatforms] = useState<string[]>(['Instagram', 'YouTube']);
  const [campBudget, setCampBudget] = useState('5000');
  const [campStart, setCampStart] = useState('2026-12-01');
  const [campEnd, setCampEnd] = useState('2027-01-15');
  const [campDeliverablesText, setCampDeliverablesText] = useState('1x YouTube Integration\n2x Instagram Reels');
  const [campInstructions, setCampInstructions] = useState('');
  const [campCoverUrl, setCampCoverUrl] = useState(ASSETS.campaignTech);
  const [campStatus, setCampStatus] = useState<CampaignStatus>('open');
  const [campAllowApps, setCampAllowApps] = useState(true);
  const [savingCamp, setSavingCamp] = useState(false);
  const [aiWriting, setAiWriting] = useState(false);
  const [campStatusFilter, setCampStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [inspectCampaign, setInspectCampaign] = useState<Campaign | null>(null);

  // Collaborations & Deliverable Review
  const [collabFilter, setCollabFilter] = useState<'active' | 'requests' | 'deliverables' | 'completed'>('active');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  // Messaging
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Confirm Dialog & Report
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  // Brand Settings Form
  const [setBrandName, setSetBrandName] = useState(brandProfile?.brandName || user.name);
  const [setIndustry, setSetIndustry] = useState(brandProfile?.industry || NICHES[0]);
  const [setDesc, setSetDesc] = useState(brandProfile?.description || '');
  const [setWebsite, setSetWebsite] = useState(brandProfile?.website || '');
  const [setLocation, setSetLocation] = useState(brandProfile?.location || '');
  const [setContactName, setSetContactName] = useState(brandProfile?.contactName || user.name);
  const [setLogoUrl, setSetLogoUrl] = useState(brandProfile?.logoUrl || '');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!brandProfile) return;
    setSetBrandName(brandProfile.brandName || user.name);
    setSetIndustry(brandProfile.industry || NICHES[0]);
    setSetDesc(brandProfile.description || '');
    setSetWebsite(brandProfile.website || '');
    setSetLocation(brandProfile.location || '');
    setSetContactName(brandProfile.contactName || user.name);
    setSetLogoUrl(brandProfile.logoUrl || '');
  }, [brandProfile, user.name]);

  const brandDisplayName = brandProfile?.brandName || user.name || 'Brand Studio';
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadByBrand || 0), 0);
  const savedCreatorIds = useMemo(() => new Set(contacts.map((c) => c.creatorId)), [contacts]);

  // Filtered Creators
  const filteredCreators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();
    const minF = Number(minFollowers) || 0;
    const minE = Number(minEngagement) || 0;
    const maxB = Number(maxBudget) || 1000000;

    return creators
      .filter((c) => {
        if (q && !`${c.fullName} ${c.username} ${c.niche} ${c.bio} ${c.skills.join(' ')}`.toLowerCase().includes(q)) {
          return false;
        }
        if (nicheFilter !== 'All' && c.niche !== nicheFilter) return false;
        if (loc && !c.location.toLowerCase().includes(loc)) return false;
        if (platformFilter !== 'All' && !c.platforms.includes(platformFilter)) return false;
        if (c.followersCount < minF) return false;
        if (c.engagementRate < minE) return false;
        if (c.collaborationRate > maxB) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'engagement') return b.engagementRate - a.engagementRate;
        if (sortBy === 'rate_asc') return a.collaborationRate - b.collaborationRate;
        return b.followersCount - a.followersCount;
      });
  }, [creators, searchQuery, nicheFilter, locationFilter, platformFilter, minFollowers, minEngagement, maxBudget, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCreators.length / pageSize));
  const paginatedCreators = filteredCreators.slice((page - 1) * pageSize, page * pageSize);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return creators
      .filter((c) => c.fullName.toLowerCase().includes(q) || c.niche.toLowerCase().includes(q))
      .slice(0, 4);
  }, [creators, searchQuery]);

  // Chart data for Overview
  const chartData = useMemo(() => {
    if (campaigns.length === 0) {
      return [
        { name: 'Week 1', budget: 4500, progress: 20 },
        { name: 'Week 2', budget: 9200, progress: 42 },
        { name: 'Week 3', budget: 14800, progress: 68 },
        { name: 'Week 4', budget: 18500, progress: 85 },
      ];
    }
    return campaigns.slice(0, 6).map((c) => ({
      name: c.title.slice(0, 14) + (c.title.length > 14 ? '…' : ''),
      budget: c.budget,
      progress: c.progress,
    }));
  }, [campaigns]);

  // Handlers
  const handleToggleSaveCreator = async (creator: CreatorProfile) => {
    const existing = contacts.find((c) => c.creatorId === creator.id);
    try {
      if (existing) {
        await removeContact(existing.id);
        onToast('info', 'Removed from contacts', `${creator.fullName} removed from your saved list.`);
      } else {
        await saveContact(user.uid, creator, 'Shortlist', `Discovered in ${creator.niche}`);
        onToast('success', 'Creator saved', `${creator.fullName} added to My Contacts.`);
      }
    } catch (err) {
      onToast('error', 'Action failed', err instanceof Error ? err.message : 'Unable to update contacts.');
    }
  };

  const handleOpenContact = async (creator: CreatorProfile, campaign?: Campaign) => {
    try {
      const convId = await getOrCreateConversation({
        brandId: user.uid,
        brandName: brandDisplayName,
        creatorId: creator.id,
        creatorName: creator.fullName,
        campaignId: campaign?.id,
        campaignTitle: campaign?.title,
      });
      setActiveConvId(convId);
      setTab('messages');
    } catch (err) {
      onToast('error', 'Could not open thread', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const openInviteModal = (creator: CreatorProfile) => {
    setInviteTargetCreator(creator);
    const defaultCamp = campaigns.find((c) => c.status === 'open' || c.status === 'active') || campaigns[0];
    setInviteCampaignId(defaultCamp?.id || '');
    setInviteBudget(String(creator.collaborationRate || defaultCamp?.budget || 3000));
    setInviteMessage(
      `Hi ${creator.fullName.split(' ')[0]}, we love your ${creator.niche} work and would be thrilled to collaborate on our upcoming campaign.`
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTargetCreator) return;
    const chosenCamp = campaigns.find((c) => c.id === inviteCampaignId);
    if (!chosenCamp) {
      onToast('error', 'Select a campaign first', 'Create at least one campaign in Campaign Studio to send an invitation.');
      return;
    }
    setInviting(true);
    try {
      await sendCollaborationRequest({
        campaignId: chosenCamp.id,
        campaignTitle: chosenCamp.title,
        brandId: user.uid,
        brandName: brandDisplayName,
        creatorId: inviteTargetCreator.id,
        creatorName: inviteTargetCreator.fullName,
        initiatorRole: 'brand',
        proposedBudget: Number(inviteBudget) || chosenCamp.budget,
        message: inviteMessage.trim(),
      });
      onToast('success', 'Invitation dispatched', `${inviteTargetCreator.fullName} has been invited to ${chosenCamp.title}.`);
      setInviteTargetCreator(null);
    } catch (err) {
      onToast('error', 'Invitation could not be sent', err instanceof Error ? err.message : 'Duplicate or invalid request.');
    } finally {
      setInviting(false);
    }
  };

  const openCampaignBuilder = (existing?: Campaign) => {
    setBuilderStep(1);
    if (existing) {
      setEditingCampaign(existing);
      setCampTitle(existing.title);
      setCampDesc(existing.description);
      setCampObjectives(existing.objectives);
      setCampAudience(existing.targetAudience);
      setCampNiche(existing.niche);
      setCampPlatforms(existing.platforms);
      setCampBudget(String(existing.budget));
      setCampStart(existing.startDate);
      setCampEnd(existing.endDate);
      setCampDeliverablesText(existing.deliverables.join('\n'));
      setCampInstructions(existing.instructions);
      setCampCoverUrl(existing.coverImageUrl || ASSETS.campaignTech);
      setCampStatus(existing.status);
      setCampAllowApps(existing.allowApplications);
    } else {
      setEditingCampaign(null);
      setCampTitle('');
      setCampDesc('');
      setCampObjectives('');
      setCampAudience('');
      setCampNiche(NICHES[0]);
      setCampPlatforms(['Instagram', 'YouTube']);
      setCampBudget('6000');
      setCampStart('2026-12-01');
      setCampEnd('2027-01-15');
      setCampDeliverablesText('1x 60s Product Spotlight Video\n2x Story Frames with UTM Link');
      setCampInstructions('');
      setCampCoverUrl(ASSETS.campaignTech);
      setCampStatus('open');
      setCampAllowApps(true);
    }
    setBuilderOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (campTitle.trim().length < 2) {
      onToast('error', 'Campaign title required', 'Enter at least 2 characters for the campaign title.');
      return;
    }
    setSavingCamp(true);
    const deliverablesArr = campDeliverablesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, {
          title: campTitle.trim(),
          description: campDesc.trim(),
          objectives: campObjectives.trim(),
          targetAudience: campAudience.trim(),
          niche: campNiche,
          platforms: campPlatforms.length > 0 ? campPlatforms : ['Instagram'],
          budget: Number(campBudget) || 0,
          startDate: campStart,
          endDate: campEnd,
          deliverables: deliverablesArr.length > 0 ? deliverablesArr : ['Campaign Deliverable'],
          instructions: campInstructions.trim(),
          coverImageUrl: campCoverUrl,
          status: campStatus,
          allowApplications: campAllowApps,
        });
        onToast('success', 'Campaign updated', campTitle.trim());
      } else {
        await createCampaign(user.uid, brandDisplayName, brandProfile?.logoUrl, {
          title: campTitle.trim(),
          description: campDesc.trim() || 'Creator collaboration campaign.',
          objectives: campObjectives.trim() || 'Brand awareness and product engagement.',
          targetAudience: campAudience.trim() || 'General digital audience',
          niche: campNiche,
          platforms: campPlatforms.length > 0 ? campPlatforms : ['Instagram'],
          budget: Number(campBudget) || 0,
          startDate: campStart,
          endDate: campEnd,
          deliverables: deliverablesArr.length > 0 ? deliverablesArr : ['Campaign Deliverable'],
          instructions: campInstructions.trim(),
          coverImageUrl: campCoverUrl,
          status: campStatus,
          allowApplications: campAllowApps,
        });
        onToast('success', 'Campaign created', `${campTitle.trim()} is now ${campStatus}.`);
      }
      setBuilderOpen(false);
    } catch (err) {
      onToast('error', 'Failed to save campaign', err instanceof Error ? err.message : 'Please check all fields.');
    } finally {
      setSavingCamp(false);
    }
  };

  const handleAiFillDescription = async () => {
    setAiWriting(true);
    try {
      const res = await aiGenerateCampaignDescription({
        brandName: brandDisplayName,
        title: campTitle || 'Product Campaign',
        niche: campNiche,
        objectives: campObjectives || 'Increase awareness and conversions',
        targetAudience: campAudience || 'Target consumers',
      });
      setCampDesc(res.description);
      onToast('success', 'AI description drafted', 'Review and tailor before publishing.');
    } catch (err) {
      onToast('error', 'AI assistant unavailable', err instanceof Error ? err.message : 'Write description manually.');
    } finally {
      setAiWriting(false);
    }
  };

  const handleAiFillBrief = async () => {
    setAiWriting(true);
    try {
      const res = await aiGenerateCampaignBrief({
        title: campTitle || 'Product Campaign',
        niche: campNiche,
        objectives: campObjectives || 'Engage target audience',
        platforms: campPlatforms,
        budget: Number(campBudget) || 5000,
      });
      if (res.deliverables?.length) setCampDeliverablesText(res.deliverables.join('\n'));
      if (res.instructions) setCampInstructions(res.instructions);
      onToast('success', 'AI brief structured', 'Deliverables and instructions populated.');
    } catch (err) {
      onToast('error', 'AI assistant unavailable', err instanceof Error ? err.message : 'Fill deliverables manually.');
    } finally {
      setAiWriting(false);
    }
  };

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveBrandProfile(
        user.uid,
        {
          brandName: setBrandName.trim() || user.name,
          industry: setIndustry,
          description: setDesc.trim(),
          website: setWebsite.trim(),
          location: setLocation.trim() || 'Remote',
          contactName: setContactName.trim() || user.name,
          logoUrl: setLogoUrl.trim(),
        },
        Boolean(brandProfile)
      );
      onToast('success', 'Brand settings saved');
    } catch (err) {
      onToast('error', 'Could not save settings', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const navItems: { id: BrandTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Creators', icon: Compass },
    { id: 'contacts', label: 'My Contacts', icon: Bookmark, badge: contacts.length || undefined },
    { id: 'campaigns', label: 'Campaign Studio', icon: Megaphone, badge: campaigns.length || undefined },
    { id: 'collaborations', label: 'Collaborations', icon: Handshake, badge: requests.filter((r) => r.status === 'pending').length || undefined },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkles },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages || undefined },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs || undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active' || c.status === 'open').length;
  const completedCampaignsCount = campaigns.filter((c) => c.status === 'completed').length;
  const pendingInvitesCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen flex bg-[#FAF9FC] dark:bg-[#0B0814] text-[#110D1F] dark:text-[#F4F2FA]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-[#110C21] border-r border-[#E6E1F2] dark:border-[#211938] flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#EFEBF7] dark:border-[#211938]">
          <button type="button" onClick={() => onSwitchWorkspace?.('landing')}>
            <CreovateLogo />
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="px-3 py-2.5 rounded-xl bg-[#F4F1FA] dark:bg-[#1A1331]">
            <p className="text-[11px] font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">BRAND STUDIO</p>
            <p className="text-sm font-bold truncate mt-0.5">{brandDisplayName}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#6D28D9] text-white font-semibold'
                    : 'text-[#4E4663] dark:text-[#B5ABD0] hover:bg-[#F4F1FA] dark:hover:bg-[#1A1331]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      active ? 'text-white/90' : 'text-[#6D28D9] dark:text-[#C4B5FD]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#EFEBF7] dark:border-[#211938] space-y-1.5">
          {isAdminUser && onSwitchWorkspace && (
            <div className="grid grid-cols-2 gap-1.5 pb-1.5">
              <button
                type="button"
                onClick={() => onSwitchWorkspace('creator')}
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-[11px] font-semibold hover:border-[#6D28D9]"
              >
                <Users className="w-3 h-3" />
                <span>Creator Hub</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchWorkspace('admin')}
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-[11px] font-semibold hover:border-[#6D28D9]"
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#58506E] dark:text-[#A89EC4] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 bg-[#FAF9FC]/90 dark:bg-[#0B0814]/90 backdrop-blur-md border-b border-[#E6E1F2] dark:border-[#211938] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-[#645C7E] dark:text-[#A89EC4] truncate">
              <span>Brand Studio</span>
              <span className="mx-2">/</span>
              <span className="font-bold text-[#110D1F] dark:text-[#F4F2FA]">
                {navItems.find((n) => n.id === tab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={() => openCampaignBuilder()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Creators', value: creators.length },
                  { label: 'Active Campaigns', value: activeCampaignsCount },
                  { label: 'Pending Invitations', value: pendingInvitesCount },
                  { label: 'Completed Campaigns', value: completedCampaignsCount },
                  { label: 'Total Collaborations', value: collaborations.length },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]"
                  >
                    <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-2">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-[#110D1F] dark:text-[#F4F2FA]">
                      <AnimatedCounter value={stat.value} />
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Performance Chart */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-bold">Campaign Budget & Execution Overview</h2>
                      <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                        Active budget allocation across your campaign portfolio (USD)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('campaigns')}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      Manage Campaigns
                    </button>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="creovateViolet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#241C3B' : '#EFEBF7'} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark ? '#A89EC4' : '#645C7E' }} />
                        <YAxis tick={{ fontSize: 11, fill: dark ? '#A89EC4' : '#645C7E' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: dark ? '#18122E' : '#FFFFFF',
                            borderColor: dark ? '#2E244D' : '#E6E1F2',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="budget"
                          stroke="#7C3AED"
                          strokeWidth={2.5}
                          fill="url(#creovateViolet)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] flex flex-col">
                  <h2 className="text-base font-bold mb-4">Upcoming Campaign Deadlines</h2>
                  {campaigns.length === 0 ? (
                    <div className="my-auto text-center py-6">
                      <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-3">
                        Create your first campaign to track launch milestones and creator deliverables.
                      </p>
                      <button
                        type="button"
                        onClick={() => openCampaignBuilder()}
                        className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
                      >
                        Create Campaign
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {campaigns.slice(0, 4).map((c) => (
                        <div key={c.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold truncate">{c.title}</p>
                            <StatusText status={c.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#645C7E] dark:text-[#A89EC4] font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {c.endDate || 'TBD'}
                            </span>
                            <span>{c.progress}% complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Requests & Recent Activity */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Recent Requests & Collaborations</h2>
                    <button
                      type="button"
                      onClick={() => setTab('collaborations')}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      View Workspace
                    </button>
                  </div>
                  {requests.length === 0 ? (
                    <p className="text-sm text-[#645C7E] dark:text-[#A89EC4] py-4">
                      No invitations or creator applications yet. Head to Discover Creators to send your first invite.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {requests.slice(0, 4).map((req) => (
                        <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{req.creatorName}</p>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">
                              {req.campaignTitle} · {req.initiatorRole === 'creator' ? 'Applied' : 'Invited'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <StatusText status={req.status} />
                            <p className="text-xs font-mono tabular-nums text-[#6E658A] mt-0.5">
                              {formatCurrency(req.proposedBudget)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Discovered Creators */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Recommended Creators to Explore</h2>
                    <button
                      type="button"
                      onClick={() => setTab('discover')}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      Discover All
                    </button>
                  </div>
                  <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                    {creators.slice(0, 4).map((c) => (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <SafeImage src={c.photoUrl} alt={c.fullName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{c.fullName}</p>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">
                              {c.niche} · {formatNumberCompact(c.followersCount)} · {c.engagementRate}% eng.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCreator(c)}
                          className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline shrink-0"
                        >
                          Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* A. DISCOVER CREATORS */}
          {tab === 'discover' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by creator name, niche, skill, or bio..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
                    />
                    {searchSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl bg-white dark:bg-[#18122E] border border-[#E6E1F2] dark:border-[#2E244D] shadow-lg overflow-hidden">
                        {searchSuggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSearchQuery(s.fullName)}
                            className="w-full px-4 py-2 text-left text-xs hover:bg-[#F4F1FA] dark:hover:bg-[#231942] flex items-center justify-between"
                          >
                            <span className="font-semibold">{s.fullName}</span>
                            <span className="text-[#786E91]">{s.niche}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'followers' | 'engagement' | 'rate_asc')}
                      className="px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-semibold"
                    >
                      <option value="followers">Sort: Highest Reach</option>
                      <option value="engagement">Sort: Top Engagement</option>
                      <option value="rate_asc">Sort: Lowest Rate</option>
                    </select>
                    <div className="flex p-1 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433]">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        aria-label="Grid view"
                        className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-[#130E24] shadow-sm' : 'text-[#6E658A]'}`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        aria-label="List view"
                        className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-[#130E24] shadow-sm' : 'text-[#6E658A]'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <select
                    value={nicheFilter}
                    onChange={(e) => {
                      setNicheFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  >
                    <option value="All">All Niches</option>
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <select
                    value={platformFilter}
                    onChange={(e) => {
                      setPlatformFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  >
                    <option value="All">All Platforms</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => {
                      setLocationFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Location (e.g., Austin)"
                    className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  />
                  <select
                    value={minFollowers}
                    onChange={(e) => {
                      setMinFollowers(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  >
                    <option value="0">Any Audience</option>
                    <option value="50000">50K+ Followers</option>
                    <option value="200000">200K+ Followers</option>
                    <option value="500000">500K+ Followers</option>
                  </select>
                  <select
                    value={maxBudget}
                    onChange={(e) => {
                      setMaxBudget(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  >
                    <option value="50000">Any Rate</option>
                    <option value="3000">Up to $3,000</option>
                    <option value="5000">Up to $5,000</option>
                    <option value="10000">Up to $10,000</option>
                  </select>
                </div>

                {/* Active Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[#645C7E] dark:text-[#A89EC4] font-mono tabular-nums">
                    Showing {filteredCreators.length} creator{filteredCreators.length === 1 ? '' : 's'}
                  </span>
                  {(searchQuery || nicheFilter !== 'All' || platformFilter !== 'All' || locationFilter || minFollowers !== '0' || minEngagement !== '0' || maxBudget !== '50000') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setNicheFilter('All');
                        setPlatformFilter('All');
                        setLocationFilter('');
                        setMinFollowers('0');
                        setMinEngagement('0');
                        setMaxBudget('50000');
                        setPage(1);
                      }}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </div>

              {paginatedCreators.length === 0 ? (
                <EmptyState
                  title="No creators match your current filters"
                  description="Broaden your audience range, niche, or budget filter to explore more vetted creators."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setNicheFilter('All');
                    setPlatformFilter('All');
                    setLocationFilter('');
                    setMinFollowers('0');
                    setMaxBudget('50000');
                  }}
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCreators.map((creator) => {
                    const isSaved = savedCreatorIds.has(creator.id);
                    return (
                      <article
                        key={creator.id}
                        className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden flex flex-col hover:border-[#C4B5FD] dark:hover:border-[#4C1D95] transition-colors"
                      >
                        <div className="aspect-[16/10] bg-[#EFEAF9] dark:bg-[#1B1433] overflow-hidden">
                          <SafeImage
                            src={creator.photoUrl}
                            alt={creator.fullName}
                            fallbackTitle={creator.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 text-xs text-[#645C7E] dark:text-[#A89EC4] mb-1">
                            <span>{creator.niche}</span>
                            {creator.isDemo && <span className="font-mono text-[10px]">Sample</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold truncate">{creator.fullName}</h3>
                            {creator.verified && <BadgeCheck className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />}
                          </div>
                          <p className="text-xs font-mono text-[#6E658A] dark:text-[#988EB8] mb-2">
                            @{creator.username} · {creator.location}
                          </p>
                          <p className="text-xs text-[#504766] dark:text-[#B5ABD0] line-clamp-2 mb-4 leading-relaxed">
                            {creator.bio}
                          </p>

                          <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#EFEBF7] dark:border-[#211938] text-center font-mono tabular-nums mb-4">
                            <div>
                              <span className="block text-xs font-bold">{formatNumberCompact(creator.followersCount)}</span>
                              <span className="text-[10px] font-sans text-[#786E91]">Followers</span>
                            </div>
                            <div>
                              <span className="block text-xs font-bold">{creator.engagementRate}%</span>
                              <span className="text-[10px] font-sans text-[#786E91]">Eng. Rate</span>
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                                {formatCurrency(creator.collaborationRate)}
                              </span>
                              <span className="text-[10px] font-sans text-[#786E91]">Rate</span>
                            </div>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCreator(creator)}
                              className="py-2 px-3 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold hover:border-[#6D28D9]"
                            >
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => openInviteModal(creator)}
                              className="py-2 px-3 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold"
                            >
                              Invite
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleSaveCreator(creator)}
                              className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                                isSaved
                                  ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                  : 'border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                              }`}
                            >
                              {isSaved ? 'Saved' : 'Save Creator'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleOpenContact(creator)}
                              className="py-2 px-3 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold text-[#58506E] dark:text-[#A89EC4] hover:border-[#6D28D9]"
                            >
                              Contact
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                  {paginatedCreators.map((creator) => {
                    const isSaved = savedCreatorIds.has(creator.id);
                    return (
                      <div key={creator.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <SafeImage src={creator.photoUrl} alt={creator.fullName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold truncate">{creator.fullName}</h3>
                              {creator.verified && <BadgeCheck className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />}
                              <span className="text-xs font-mono text-[#786E91]">@{creator.username}</span>
                            </div>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mt-0.5">
                              {creator.niche} · {creator.location} · {creator.platforms.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 shrink-0">
                          <div className="text-xs font-mono tabular-nums">
                            <strong>{formatNumberCompact(creator.followersCount)}</strong> · {creator.engagementRate}% ·{' '}
                            <span className="text-[#6D28D9] dark:text-[#C4B5FD] font-bold">
                              {formatCurrency(creator.collaborationRate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCreator(creator)}
                              className="px-3 py-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleSaveCreator(creator)}
                              className="px-3 py-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                            >
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openInviteModal(creator)}
                              className="px-3 py-1.5 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold"
                            >
                              Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono text-[#645C7E] dark:text-[#A89EC4]">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C. MY CONTACTS */}
          {tab === 'contacts' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {CONTACT_FOLDERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setContactFolder(f)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        contactFolder === f
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#786E91] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search saved contacts..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-white dark:bg-[#130E24] text-xs"
                  />
                </div>
              </div>

              {contacts.length === 0 ? (
                <EmptyState
                  title="No saved creator contacts yet"
                  description="Save creators from Discover Creators to organize shortlists, notes, and collaboration history."
                  actionLabel="Discover Creators"
                  onAction={() => setTab('discover')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts
                    .filter((c) => contactFolder === 'All' || c.folder === contactFolder)
                    .filter(
                      (c) =>
                        !contactSearch.trim() ||
                        `${c.creatorName} ${c.creatorNiche} ${c.notes}`
                          .toLowerCase()
                          .includes(contactSearch.trim().toLowerCase())
                    )
                    .map((contact) => {
                      const fullCreator = creators.find((cr) => cr.id === contact.creatorId);
                      const collabCount = collaborations.filter((col) => col.creatorId === contact.creatorId).length;
                      return (
                        <div
                          key={contact.id}
                          className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <SafeImage
                                src={contact.creatorPhotoUrl}
                                alt={contact.creatorName}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold truncate">{contact.creatorName}</h3>
                                <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">
                                  @{contact.creatorUsername} · {contact.creatorNiche}
                                </p>
                              </div>
                            </div>
                            <select
                              value={contact.folder}
                              onChange={(e) =>
                                void saveContact(
                                  user.uid,
                                  {
                                    id: contact.creatorId,
                                    fullName: contact.creatorName,
                                    username: contact.creatorUsername,
                                    niche: contact.creatorNiche,
                                    photoUrl: contact.creatorPhotoUrl,
                                  },
                                  e.target.value,
                                  contact.notes
                                )
                              }
                              className="px-2.5 py-1 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-[11px] font-semibold"
                            >
                              {CONTACT_FOLDERS.filter((f) => f !== 'All').map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </div>

                          <p className="text-xs text-[#504766] dark:text-[#B5ABD0]">
                            {contact.notes || 'No private notes yet.'} · {collabCount} collaboration
                            {collabCount === 1 ? '' : 's'}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-[#EFEBF7] dark:border-[#211938]">
                            <div className="flex items-center gap-2">
                              {fullCreator && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openInviteModal(fullCreator)}
                                    className="px-3 py-1.5 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold"
                                  >
                                    Invite
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenContact(fullCreator)}
                                    className="px-3 py-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                                  >
                                    Message
                                  </button>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  title: 'Remove saved contact?',
                                  message: `Remove ${contact.creatorName} from your saved contacts list?`,
                                  confirmLabel: 'Remove',
                                  destructive: true,
                                  onConfirm: () => {
                                    setConfirmState((s) => ({ ...s, open: false }));
                                    void removeContact(contact.id).then(() =>
                                      onToast('info', 'Contact removed')
                                    );
                                  },
                                })
                              }
                              className="p-1.5 rounded-lg text-[#786E91] hover:text-rose-600"
                              aria-label="Remove contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* D. CAMPAIGN STUDIO */}
          {tab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'draft', 'open', 'active', 'completed', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCampStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        campStatusFilter === st
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => openCampaignBuilder()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </div>

              {campaigns.filter((c) => campStatusFilter === 'all' || c.status === campStatusFilter).length === 0 ? (
                <EmptyState
                  title="No campaigns in this view"
                  description="Use the multi-step Campaign Builder to launch briefs, define deliverables, and invite creators."
                  actionLabel="Launch First Campaign"
                  onAction={() => openCampaignBuilder()}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaigns
                    .filter((c) => campStatusFilter === 'all' || c.status === campStatusFilter)
                    .map((camp) => (
                      <div
                        key={camp.id}
                        className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden flex flex-col"
                      >
                        <div className="aspect-[16/7] bg-[#EFEAF9] dark:bg-[#1B1433] overflow-hidden">
                          <SafeImage src={camp.coverImageUrl} alt={camp.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                              {camp.niche} · {camp.platforms.join(', ')}
                            </span>
                            <StatusText status={camp.status} />
                          </div>
                          <h3 className="text-lg font-bold mb-1.5">{camp.title}</h3>
                          <p className="text-xs text-[#504766] dark:text-[#B5ABD0] line-clamp-2 mb-4 leading-relaxed">
                            {camp.description}
                          </p>

                          {/* Progress bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#645C7E] dark:text-[#A89EC4]">Execution Progress</span>
                              <span className="font-mono font-bold tabular-nums">{camp.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#EFEAF9] dark:bg-[#1F1738] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6D28D9] to-[#3B82F6]"
                                style={{ width: `${camp.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-[#EFEBF7] dark:border-[#211938] flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-mono tabular-nums">
                              <strong className="text-[#6D28D9] dark:text-[#C4B5FD]">{formatCurrency(camp.budget)}</strong>
                              <span className="text-[#786E91]"> · Due {camp.endDate || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {camp.status === 'draft' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCampaign(camp.id, { status: 'open', visibility: 'public', progress: 20 }).then(() =>
                                      onToast('success', 'Campaign published', `${camp.title} is now live for creators.`)
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setInspectCampaign(camp)}
                                className="px-3 py-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                              >
                                Details
                              </button>
                              {!(camp.status === 'completed' || camp.status === 'cancelled') && (
                                <button
                                  type="button"
                                  onClick={() => openCampaignBuilder(camp)}
                                  aria-label="Edit campaign"
                                  className="p-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] hover:border-[#6D28D9]"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    title: 'Delete campaign?',
                                    message: `Permanently delete "${camp.title}"?`,
                                    confirmLabel: 'Delete',
                                    destructive: true,
                                    onConfirm: () => {
                                      setConfirmState((s) => ({ ...s, open: false }));
                                      void deleteCampaign(camp.id).then(() => onToast('info', 'Campaign deleted'));
                                    },
                                  })
                                }
                                aria-label="Delete campaign"
                                className="p-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* E. COLLABORATIONS & DELIVERABLE REVIEW */}
          {tab === 'collaborations' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433] w-fit">
                {[
                  { id: 'active', label: `Active (${collaborations.filter((c) => c.status === 'active' || c.status === 'in_review').length})` },
                  { id: 'requests', label: `Invitations & Applications (${requests.length})` },
                  { id: 'deliverables', label: `Deliverables Review (${deliverables.length})` },
                  { id: 'completed', label: `Completed (${collaborations.filter((c) => c.status === 'completed').length})` },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setCollabFilter(sub.id as typeof collabFilter)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      collabFilter === sub.id
                        ? 'bg-white dark:bg-[#130E24] text-[#110D1F] dark:text-white shadow-sm'
                        : 'text-[#5E5678] dark:text-[#A89EC4]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {collabFilter === 'requests' && (
                requests.length === 0 ? (
                  <EmptyState
                    title="No invitations or applications yet"
                    description="Invite creators from Discover Creators or wait for creators to apply to your open campaigns."
                    actionLabel="Discover Creators"
                    onAction={() => setTab('discover')}
                  />
                ) : (
                  <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                    {requests.map((req) => (
                      <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold">{req.creatorName}</h4>
                            <span className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                              · {req.initiatorRole === 'creator' ? 'Creator Application' : 'Brand Invitation'}
                            </span>
                            <StatusText status={req.status} />
                          </div>
                          <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">
                            {req.campaignTitle} · {formatCurrency(req.proposedBudget)}
                          </p>
                          <p className="text-xs text-[#504766] dark:text-[#B5ABD0] max-w-2xl">{req.message}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' && req.initiatorRole === 'creator' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void respondToCollaborationRequest(req, 'accepted', user.uid).then(() =>
                                    onToast('success', 'Application accepted', 'Active collaboration workspace created.')
                                  )
                                }
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void respondToCollaborationRequest(req, 'rejected', user.uid).then(() =>
                                    onToast('info', 'Application declined')
                                  )
                                }
                                className="px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {req.status === 'pending' && req.initiatorRole === 'brand' && (
                            <button
                              type="button"
                              onClick={() =>
                                void respondToCollaborationRequest(req, 'withdrawn', user.uid).then(() =>
                                  onToast('info', 'Invitation withdrawn')
                                )
                              }
                              className="px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {(collabFilter === 'active' || collabFilter === 'completed') && (
                (() => {
                  const list = collaborations.filter((c) =>
                    collabFilter === 'active' ? c.status === 'active' || c.status === 'in_review' : c.status === 'completed'
                  );
                  if (list.length === 0) {
                    return (
                      <EmptyState
                        title={collabFilter === 'active' ? 'No active collaborations' : 'No completed collaborations yet'}
                        description="Accepted invitations and applications automatically create tracked collaborations here."
                      />
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {list.map((col) => (
                        <div
                          key={col.id}
                          className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-base font-bold">{col.campaignTitle}</h3>
                                <StatusText status={col.status} />
                              </div>
                              <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                                Creator: <strong>{col.creatorName}</strong> · Budget:{' '}
                                <span className="font-mono">{formatCurrency(col.budget)}</span> · Deadline: {col.deadline}
                              </p>
                            </div>
                            {col.status !== 'completed' && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCollaborationStatus(col.id, {
                                      progress: Math.min(100, col.progress + 25),
                                    }).then(() => onToast('success', 'Progress updated'))
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                                >
                                  Advance +25%
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCollaborationStatus(col.id, {
                                      status: 'completed',
                                      progress: 100,
                                    }).then(() => onToast('success', 'Collaboration completed'))
                                  }
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                >
                                  Mark Complete
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-[#645C7E] dark:text-[#A89EC4]">Timeline Progress</span>
                              <span className="font-mono font-bold tabular-nums">{col.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#EFEAF9] dark:bg-[#1F1738] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6D28D9] to-[#3B82F6] transition-all"
                                style={{ width: `${col.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              {collabFilter === 'deliverables' && (
                deliverables.length === 0 ? (
                  <EmptyState
                    title="No deliverables submitted yet"
                    description="When creators upload content files or campaign links for your active collaborations, they will appear here for review."
                  />
                ) : (
                  <div className="space-y-4">
                    {deliverables.map((del) => (
                      <div
                        key={del.id}
                        className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-bold">{del.title}</h4>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                              Submitted {formatTimestamp(del.createdAt)}
                            </p>
                          </div>
                          <StatusText status={del.status} />
                        </div>
                        <p className="text-sm text-[#504766] dark:text-[#B5ABD0]">{del.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {del.fileUrl && isSafeUrl(del.fileUrl) && (
                            <a
                              href={del.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspect Uploaded File</span>
                            </a>
                          )}
                          {del.linkUrl && isSafeUrl(del.linkUrl) && (
                            <a
                              href={del.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Deliverable Link</span>
                            </a>
                          )}
                        </div>
                        {del.status !== 'approved' && (
                          <div className="pt-3 border-t border-[#EFEBF7] dark:border-[#211938] flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={feedbackMap[del.id] || ''}
                              onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [del.id]: e.target.value }))}
                              placeholder="Add review notes or revision instructions..."
                              className="flex-1 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void reviewDeliverable(
                                    del,
                                    'revision_requested',
                                    feedbackMap[del.id] || 'Please refine per campaign instructions.',
                                    user.uid
                                  ).then(() => onToast('info', 'Revision requested'))
                                }
                                className="px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                              >
                                Request Revision
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void reviewDeliverable(
                                    del,
                                    'approved',
                                    feedbackMap[del.id] || 'Approved! Great work.',
                                    user.uid
                                  ).then(() => onToast('success', 'Deliverable approved', 'Collaboration completed.'))
                                }
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* CREOVATE INTELLIGENCE */}
          {tab === 'intelligence' && (
            <CreovateIntelligence
              role="brand"
              brandName={brandDisplayName}
              creators={creators}
              campaigns={campaigns}
              onInviteCreator={(c) => openInviteModal(c)}
              onToast={onToast}
            />
          )}

          {/* MESSAGES */}
          {tab === 'messages' && (
            <MessagingCenter
              currentUser={user}
              perspective="brand"
              conversations={conversations}
              activeConversationId={activeConvId}
              onSelectConversation={(id) => setActiveConvId(id)}
              onToast={onToast}
            />
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              onNavigateTab={(t) => setTab(t as BrandTab)}
              onToast={onToast}
            />
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <form
              onSubmit={handleSaveBrandSettings}
              className="max-w-2xl p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold">Brand Studio Profile Settings</h2>
                <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                  Updates are persisted immediately to your public brand directory profile.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SafeImage src={setLogoUrl} alt="Brand logo" className="w-16 h-16 rounded-xl object-cover border border-[#E6E1F2] dark:border-[#241C3B]" />
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const res = await uploadFile(f);
                        setSetLogoUrl(res.url);
                        onToast('success', 'Logo uploaded');
                      } catch (err) {
                        onToast('error', 'Upload failed', err instanceof Error ? err.message : '');
                      }
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={setBrandName}
                    onChange={(e) => setSetBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Industry</label>
                  <select
                    value={setIndustry}
                    onChange={(e) => setSetIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  >
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Location</label>
                  <input
                    type="text"
                    value={setLocation}
                    onChange={(e) => setSetLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Contact Lead</label>
                  <input
                    type="text"
                    value={setContactName}
                    onChange={(e) => setSetContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Website</label>
                <input
                  type="url"
                  value={setWebsite}
                  onChange={(e) => setSetWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Company Description</label>
                <textarea
                  rows={4}
                  value={setDesc}
                  onChange={(e) => setSetDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </main>
      </div>

      {/* B. DETAILED CREATOR PROFILE MODAL */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="p-6 flex items-start justify-between gap-4 border-b border-[#EFEBF7] dark:border-[#211938]">
              <div className="flex items-center gap-4">
                <SafeImage src={selectedCreator.photoUrl} alt={selectedCreator.fullName} className="w-16 h-16 rounded-2xl object-cover" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold">{selectedCreator.fullName}</h2>
                    {selectedCreator.verified && <BadgeCheck className="w-5 h-5 text-[#6D28D9] dark:text-[#A78BFA]" />}
                  </div>
                  <p className="text-xs font-mono text-[#645C7E] dark:text-[#A89EC4]">
                    @{selectedCreator.username} · {selectedCreator.niche} · {selectedCreator.location}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCreator(null)} aria-label="Close" className="p-2 rounded-lg hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD] mb-1.5">About</h3>
                <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{selectedCreator.bio}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1433] border border-[#EFEBF7] dark:border-[#241C3B] font-mono tabular-nums">
                <div>
                  <span className="block text-lg font-extrabold">{formatNumberCompact(selectedCreator.followersCount)}</span>
                  <span className="text-[11px] font-sans text-[#6E658A]">Total Audience</span>
                </div>
                <div>
                  <span className="block text-lg font-extrabold">{selectedCreator.engagementRate}%</span>
                  <span className="text-[11px] font-sans text-[#6E658A]">Avg Engagement</span>
                </div>
                <div>
                  <span className="block text-lg font-extrabold text-[#6D28D9] dark:text-[#C4B5FD]">
                    {formatCurrency(selectedCreator.collaborationRate)}
                  </span>
                  <span className="text-[11px] font-sans text-[#6E658A]">Collaboration Rate</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold mb-1">Skills & Categories</p>
                  <p className="text-[#504766] dark:text-[#B5ABD0]">{selectedCreator.skills.join(' · ')}</p>
                </div>
                <div>
                  <p className="font-bold mb-1">Collaboration Preferences</p>
                  <p className="text-[#504766] dark:text-[#B5ABD0]">
                    {selectedCreator.preferences || 'Open to sponsored posts, launches, and long-term series.'}
                  </p>
                </div>
              </div>

              {/* Connected Social Channels */}
              <div>
                <h3 className="text-xs font-bold mb-2">Social Channels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {socialAccounts
                    .filter((s) => s.creatorId === selectedCreator.id)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold">{s.platform}</p>
                          <p className="font-mono text-[#6E658A]">{s.handle}</p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <p className="font-bold">{formatNumberCompact(s.followers)}</p>
                          <p className="text-[#6D28D9] dark:text-[#C4B5FD]">{s.engagementRate}% eng.</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Portfolio Gallery */}
              <div>
                <h3 className="text-xs font-bold mb-2">Portfolio Gallery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolios
                    .filter((p) => p.creatorId === selectedCreator.id)
                    .map((p) => (
                      <div key={p.id} className="rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden">
                        <div className="aspect-[16/10] bg-[#EFEAF9] dark:bg-[#1B1433]">
                          <SafeImage src={p.mediaUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold">{p.title}</p>
                          <p className="text-[11px] text-[#645C7E] dark:text-[#A89EC4] mt-0.5">{p.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#EFEBF7] dark:border-[#211938] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setReportTarget({ id: selectedCreator.id, name: selectedCreator.fullName });
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Profile</span>
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    void handleToggleSaveCreator(selectedCreator);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                >
                  {savedCreatorIds.has(selectedCreator.id) ? 'Saved in Contacts' : 'Save Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cr = selectedCreator;
                    setSelectedCreator(null);
                    void handleOpenContact(cr);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cr = selectedCreator;
                    setSelectedCreator(null);
                    openInviteModal(cr);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold"
                >
                  Invite to Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVITE TO CAMPAIGN MODAL */}
      {inviteTargetCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Invite {inviteTargetCreator.fullName}</h3>
              <button type="button" onClick={() => setInviteTargetCreator(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-[#58506E] dark:text-[#A89EC4]">
                  You need at least one campaign before sending creator invitations.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInviteTargetCreator(null);
                    openCampaignBuilder();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#6D28D9] text-white text-sm font-semibold"
                >
                  Create a Campaign Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Select Campaign</label>
                  <select
                    required
                    value={inviteCampaignId}
                    onChange={(e) => setInviteCampaignId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({formatCurrency(c.budget)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Proposed Compensation (USD)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={inviteBudget}
                    onChange={(e) => setInviteBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Personal Note</label>
                  <textarea
                    rows={3}
                    required
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteTargetCreator(null)}
                    className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{inviting ? 'Sending...' : 'Send Invitation'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MULTI-STEP CAMPAIGN BUILDER MODAL */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 sm:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{editingCampaign ? 'Edit Campaign' : 'Multi-Step Campaign Builder'}</h3>
                <p className="text-xs font-mono text-[#6D28D9] dark:text-[#C4B5FD]">Step {builderStep} of 3</p>
              </div>
              <button type="button" onClick={() => setBuilderOpen(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-1.5 w-full rounded-full bg-[#EFEAF9] dark:bg-[#1F1738] mb-6 overflow-hidden">
              <div
                className="h-full bg-[#6D28D9] transition-all"
                style={{ width: `${Math.round((builderStep / 3) * 100)}%` }}
              />
            </div>

            {builderStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Campaign Title *</label>
                  <input
                    type="text"
                    value={campTitle}
                    onChange={(e) => setCampTitle(e.target.value)}
                    placeholder="e.g., Spring Acoustic Studio Launch"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Required Niche</label>
                    <select
                      value={campNiche}
                      onChange={(e) => setCampNiche(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                    >
                      {NICHES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Campaign Status</label>
                    <select
                      value={campStatus}
                      onChange={(e) => setCampStatus(e.target.value as CampaignStatus)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="open">Open for Creators</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold">Campaign Description</label>
                    <button
                      type="button"
                      disabled={aiWriting}
                      onClick={() => void handleAiFillDescription()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiWriting ? 'Drafting...' : 'AI Draft Description'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={campDesc}
                    onChange={(e) => setCampDesc(e.target.value)}
                    placeholder="Outline your product story, campaign theme, and why creators will love working on this brief..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <SafeImage src={campCoverUrl} alt="Cover" className="w-16 h-11 rounded-lg object-cover" />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Cover Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const res = await uploadFile(f);
                          setCampCoverUrl(res.url);
                          onToast('success', 'Cover uploaded');
                        } catch (err) {
                          onToast('error', 'Upload failed', err instanceof Error ? err.message : '');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {builderStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Marketing Objectives</label>
                  <textarea
                    rows={3}
                    value={campObjectives}
                    onChange={(e) => setCampObjectives(e.target.value)}
                    placeholder="e.g., Drive 250K organic launch views and trackable pre-order conversions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Target Audience</label>
                  <input
                    type="text"
                    value={campAudience}
                    onChange={(e) => setCampAudience(e.target.value)}
                    placeholder="e.g., Creative professionals & tech enthusiasts aged 24-40"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Social Media Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setCampPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          campPlatforms.includes(p)
                            ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                            : 'border-[#E6E1F2] dark:border-[#241C3B]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Budget (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={campBudget}
                      onChange={(e) => setCampBudget(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={campStart}
                      onChange={(e) => setCampStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={campEnd}
                      onChange={(e) => setCampEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {builderStep === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold">Deliverables (one per line)</label>
                    <button
                      type="button"
                      disabled={aiWriting}
                      onClick={() => void handleAiFillBrief()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiWriting ? 'Structuring...' : 'AI Brief Assistant'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={campDeliverablesText}
                    onChange={(e) => setCampDeliverablesText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Campaign Instructions</label>
                  <textarea
                    rows={3}
                    value={campInstructions}
                    onChange={(e) => setCampInstructions(e.target.value)}
                    placeholder="Creative direction, talking points, disclosure rules, and UTM tracking instructions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campAllowApps}
                    onChange={(e) => setCampAllowApps(e.target.checked)}
                    className="rounded border-[#D4CBEB] text-[#6D28D9]"
                  />
                  <span>Allow verified creators to apply directly from Discover Campaigns</span>
                </label>
              </div>
            )}

            <div className="mt-7 pt-4 border-t border-[#EFEBF7] dark:border-[#211938] flex items-center justify-between">
              <button
                type="button"
                disabled={builderStep === 1}
                onClick={() => setBuilderStep((s) => Math.max(1, s - 1))}
                className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold disabled:opacity-40"
              >
                Back
              </button>
              {builderStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setBuilderStep((s) => Math.min(3, s + 1))}
                  className="px-5 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={savingCamp}
                  onClick={() => void handleSaveCampaign()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingCamp ? 'Saving...' : editingCampaign ? 'Save Campaign' : 'Create Campaign'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAILS MODAL */}
      {inspectCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4">
          <div className="max-w-xl w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <StatusText status={inspectCampaign.status} />
                <h3 className="text-lg font-bold mt-1">{inspectCampaign.title}</h3>
                <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                  {inspectCampaign.niche} · {inspectCampaign.platforms.join(', ')} · {formatCurrency(inspectCampaign.budget)}
                </p>
              </div>
              <button type="button" onClick={() => setInspectCampaign(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{inspectCampaign.description}</p>
            <div className="text-xs space-y-1">
              <p className="font-bold">Objectives</p>
              <p className="text-[#504766] dark:text-[#B5ABD0]">{inspectCampaign.objectives}</p>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold">Deliverables</p>
              <ul className="list-disc pl-5 text-[#504766] dark:text-[#B5ABD0] space-y-0.5">
                {inspectCampaign.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFEBF7] dark:border-[#211938]">
              <button
                type="button"
                onClick={() => {
                  setInspectCampaign(null);
                  setTab('discover');
                }}
                className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
              >
                Invite Creators
              </button>
              <button
                type="button"
                onClick={() => setInspectCampaign(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />

      {reportTarget && (
        <ReportModal
          open={Boolean(reportTarget)}
          reporterId={user.uid}
          targetType="user"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          onClose={() => setReportTarget(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
