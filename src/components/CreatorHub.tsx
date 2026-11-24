import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  Compass,
  Mail,
  Handshake,
  Sparkles,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Plus,
  Upload,
  Trash2,
  Edit3,
  Search,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  X,
  Menu,
  Briefcase,
  Shield,
  Flag,
  Video,
  Send,
} from 'lucide-react';
import type {
  Campaign,
  Collaboration,
  CollaborationRequest,
  Conversation,
  CreatorProfile,
  CreatorTab,
  Deliverable,
  NotificationItem,
  PortfolioItem,
  SocialAccount,
  UserRecord,
} from '../types';
import { NICHES, PLATFORMS, formatCurrency, formatNumberCompact } from '../data/demoData';
import {
  addSocialAccount,
  createPortfolioItem,
  deletePortfolioItem,
  deleteSocialAccount,
  formatTimestamp,
  getOrCreateConversation,
  respondToCollaborationRequest,
  saveCreatorProfile,
  sendCollaborationRequest,
  submitDeliverable,
  updatePortfolioItem,
} from '../lib/firestoreService';
import { isSafeUrl, uploadFile } from '../lib/api';
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

interface CreatorHubProps {
  dark: boolean;
  onToggleTheme: () => void;
  user: UserRecord;
  isAdminUser: boolean;
  creatorProfile: CreatorProfile | null;
  allCreators: CreatorProfile[];
  mySocialAccounts: SocialAccount[];
  myPortfolios: PortfolioItem[];
  campaigns: Campaign[];
  requests: CollaborationRequest[];
  collaborations: Collaboration[];
  deliverables: Deliverable[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  onSwitchWorkspace?: (target: 'brand' | 'creator' | 'admin' | 'landing') => void;
  onLogout: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export function CreatorHub({
  dark,
  onToggleTheme,
  user,
  isAdminUser,
  creatorProfile,
  allCreators,
  mySocialAccounts,
  myPortfolios,
  campaigns,
  requests,
  collaborations,
  deliverables,
  conversations,
  notifications,
  onSwitchWorkspace,
  onLogout,
  onToast,
}: CreatorHubProps) {
  const [tab, setTab] = useState<CreatorTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile editor state
  const [fullName, setFullName] = useState(creatorProfile?.fullName || user.name || '');
  const [username, setUsername] = useState(
    creatorProfile?.username || (user.name || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)
  );
  const [photoUrl, setPhotoUrl] = useState(creatorProfile?.photoUrl || user.photoUrl || '');
  const [bio, setBio] = useState(creatorProfile?.bio || '');
  const [location, setLocation] = useState(creatorProfile?.location || '');
  const [niche, setNiche] = useState(creatorProfile?.niche || NICHES[0]);
  const [skillsText, setSkillsText] = useState((creatorProfile?.skills || ['Video Production', 'Storytelling']).join(', '));
  const [platforms, setPlatforms] = useState<string[]>(creatorProfile?.platforms || ['Instagram', 'YouTube']);
  const [followersCount, setFollowersCount] = useState(String(creatorProfile?.followersCount || 0));
  const [engagementRate, setEngagementRate] = useState(String(creatorProfile?.engagementRate || 0));
  const [collaborationRate, setCollaborationRate] = useState(String(creatorProfile?.collaborationRate || 1500));
  const [preferences, setPreferences] = useState(creatorProfile?.preferences || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!creatorProfile) return;
    setFullName(creatorProfile.fullName || user.name || '');
    setUsername(creatorProfile.username || '');
    setPhotoUrl(creatorProfile.photoUrl || user.photoUrl || '');
    setBio(creatorProfile.bio || '');
    setLocation(creatorProfile.location || '');
    setNiche(creatorProfile.niche || NICHES[0]);
    setSkillsText((creatorProfile.skills || []).join(', '));
    setPlatforms(creatorProfile.platforms || ['Instagram']);
    setFollowersCount(String(creatorProfile.followersCount ?? 0));
    setEngagementRate(String(creatorProfile.engagementRate ?? 0));
    setCollaborationRate(String(creatorProfile.collaborationRate ?? 1500));
    setPreferences(creatorProfile.preferences || '');
  }, [creatorProfile, user.name, user.photoUrl]);

  // Add social account state
  const [socPlatform, setSocPlatform] = useState('Instagram');
  const [socHandle, setSocHandle] = useState('');
  const [socUrl, setSocUrl] = useState('');
  const [socFollowers, setSocFollowers] = useState('25000');
  const [socEng, setSocEng] = useState('5.5');

  // Portfolio Studio modal
  const [portModalOpen, setPortModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<PortfolioItem | null>(null);
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portType, setPortType] = useState<'image' | 'video'>('image');
  const [portUrl, setPortUrl] = useState('');
  const [portCategory, setPortCategory] = useState('Brand Film');
  const [savingPort, setSavingPort] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Campaign Discovery state
  const [campSearch, setCampSearch] = useState('');
  const [campNiche, setCampNiche] = useState('All');
  const [campPlatform, setCampPlatform] = useState('All');
  const [savedCampaignIds, setSavedCampaignIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [applyTarget, setApplyTarget] = useState<Campaign | null>(null);
  const [applyRate, setApplyRate] = useState('');
  const [applyPitch, setApplyPitch] = useState('');
  const [applying, setApplying] = useState(false);

  // Deliverable Submission modal
  const [submitTargetCollab, setSubmitTargetCollab] = useState<Collaboration | null>(null);
  const [delTitle, setDelTitle] = useState('');
  const [delDesc, setDelDesc] = useState('');
  const [delFileUrl, setDelFileUrl] = useState('');
  const [delLinkUrl, setDelLinkUrl] = useState('');
  const [submittingDel, setSubmittingDel] = useState(false);

  // Messaging & Modals
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [reportCamp, setReportCamp] = useState<{ id: string; name: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(fullName.trim()),
      Boolean(photoUrl.trim()),
      bio.trim().length >= 20,
      Boolean(location.trim()),
      skillsText.trim().length > 0,
      platforms.length > 0,
      mySocialAccounts.length > 0,
      myPortfolios.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fullName, photoUrl, bio, location, skillsText, platforms, mySocialAccounts.length, myPortfolios.length]);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadByCreator || 0), 0);
  const receivedInvites = requests.filter((r) => r.initiatorRole === 'brand' && r.status === 'pending');

  const filteredCampaigns = useMemo(() => {
    const q = campSearch.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (c.status === 'draft' || c.status === 'cancelled') return false;
      if (showSavedOnly && !savedCampaignIds.includes(c.id)) return false;
      if (q && !`${c.title} ${c.brandName} ${c.description} ${c.niche}`.toLowerCase().includes(q)) return false;
      if (campNiche !== 'All' && c.niche !== campNiche) return false;
      if (campPlatform !== 'All' && !c.platforms.includes(campPlatform)) return false;
      return true;
    });
  }, [campaigns, campSearch, campNiche, campPlatform, showSavedOnly, savedCampaignIds]);

  // Handlers
  const handleSaveProfile = async (e?: React.FormEvent, bioOverride?: string) => {
    e?.preventDefault();
    setSavingProfile(true);
    try {
      const cleanSkills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      await saveCreatorProfile(
        user.uid,
        {
          fullName: fullName.trim() || user.name,
          username: username.trim().replace(/[^a-zA-Z0-9_.-]/g, '') || `creator_${user.uid.slice(0, 6)}`,
          photoUrl: photoUrl.trim(),
          bio: (bioOverride !== undefined ? bioOverride : bio).trim(),
          location: location.trim() || 'Global',
          niche,
          skills: cleanSkills.length > 0 ? cleanSkills : ['Content Creation'],
          platforms: platforms.length > 0 ? platforms : ['Instagram'],
          followersCount: Number(followersCount) || 0,
          engagementRate: Number(engagementRate) || 0,
          collaborationRate: Number(collaborationRate) || 0,
          preferences: preferences.trim(),
        },
        Boolean(creatorProfile)
      );
      if (bioOverride !== undefined) setBio(bioOverride);
      onToast('success', 'Creator profile updated');
    } catch (err) {
      onToast('error', 'Failed to save profile', err instanceof Error ? err.message : 'Please check your inputs.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socHandle.trim() || !socUrl.trim()) return;
    try {
      await addSocialAccount(user.uid, {
        platform: socPlatform,
        handle: socHandle.trim(),
        url: socUrl.trim(),
        followers: Number(socFollowers) || 0,
        engagementRate: Number(socEng) || 0,
      });
      setSocHandle('');
      setSocUrl('');
      onToast('success', 'Social channel linked');
    } catch (err) {
      onToast('error', 'Could not add social account', err instanceof Error ? err.message : '');
    }
  };

  const openPortfolioModal = (item?: PortfolioItem) => {
    if (item) {
      setEditingPort(item);
      setPortTitle(item.title);
      setPortDesc(item.description);
      setPortType(item.mediaType);
      setPortUrl(item.mediaUrl);
      setPortCategory(item.category);
    } else {
      setEditingPort(null);
      setPortTitle('');
      setPortDesc('');
      setPortType('image');
      setPortUrl('');
      setPortCategory('Brand Film');
    }
    setPortModalOpen(true);
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle.trim() || !portUrl.trim()) {
      onToast('error', 'Title and media required', 'Upload a file or paste a valid media URL.');
      return;
    }
    setSavingPort(true);
    try {
      if (editingPort) {
        await updatePortfolioItem(editingPort.id, {
          title: portTitle.trim(),
          description: portDesc.trim(),
          mediaType: portType,
          mediaUrl: portUrl.trim(),
          category: portCategory.trim() || 'Campaign',
        });
        onToast('success', 'Portfolio item updated');
      } else {
        await createPortfolioItem(user.uid, {
          title: portTitle.trim(),
          description: portDesc.trim(),
          mediaType: portType,
          mediaUrl: portUrl.trim(),
          category: portCategory.trim() || 'Campaign',
        });
        onToast('success', 'Added to Portfolio Studio');
      }
      setPortModalOpen(false);
    } catch (err) {
      onToast('error', 'Could not save portfolio item', err instanceof Error ? err.message : '');
    } finally {
      setSavingPort(false);
    }
  };

  const handleApplyCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyTarget) return;
    setApplying(true);
    try {
      await sendCollaborationRequest({
        campaignId: applyTarget.id,
        campaignTitle: applyTarget.title,
        brandId: applyTarget.brandId,
        brandName: applyTarget.brandName,
        creatorId: user.uid,
        creatorName: fullName || user.name,
        initiatorRole: 'creator',
        proposedBudget: Number(applyRate) || applyTarget.budget,
        message: applyPitch.trim(),
      });
      onToast('success', 'Application submitted', `${applyTarget.brandName} has received your pitch.`);
      setApplyTarget(null);
    } catch (err) {
      onToast('error', 'Could not apply', err instanceof Error ? err.message : 'Already applied to this campaign.');
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTargetCollab || !delTitle.trim()) return;
    if (!delFileUrl.trim() && !delLinkUrl.trim()) {
      onToast('error', 'Attach a file or link', 'Upload a deliverable file or provide a review URL.');
      return;
    }
    setSubmittingDel(true);
    try {
      await submitDeliverable({
        collaborationId: submitTargetCollab.id,
        campaignId: submitTargetCollab.campaignId,
        brandId: submitTargetCollab.brandId,
        creatorId: user.uid,
        title: delTitle.trim(),
        description: delDesc.trim(),
        fileUrl: delFileUrl.trim(),
        linkUrl: delLinkUrl.trim(),
      });
      onToast('success', 'Deliverable submitted', `${submitTargetCollab.brandName} has been notified to review.`);
      setSubmitTargetCollab(null);
      setDelTitle('');
      setDelDesc('');
      setDelFileUrl('');
      setDelLinkUrl('');
    } catch (err) {
      onToast('error', 'Submission failed', err instanceof Error ? err.message : '');
    } finally {
      setSubmittingDel(false);
    }
  };

  const openMessageBrand = async (brandId: string, brandName: string, campaignId?: string, campaignTitle?: string) => {
    try {
      const convId = await getOrCreateConversation({
        brandId,
        brandName,
        creatorId: user.uid,
        creatorName: fullName || user.name,
        campaignId,
        campaignTitle,
      });
      setActiveConvId(convId);
      setTab('messages');
    } catch (err) {
      onToast('error', 'Could not open thread', err instanceof Error ? err.message : '');
    }
  };

  const navItems: { id: CreatorTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'portfolio', label: 'My Portfolio', icon: ImageIcon, badge: myPortfolios.length || undefined },
    { id: 'campaigns', label: 'Discover Campaigns', icon: Compass },
    { id: 'requests', label: 'Requests', icon: Mail, badge: receivedInvites.length || undefined },
    { id: 'collaborations', label: 'My Collaborations', icon: Handshake, badge: collaborations.filter((c) => c.status !== 'completed').length || undefined },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkles },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages || undefined },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs || undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
            <p className="text-[11px] font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">CREATOR HUB</p>
            <p className="text-sm font-bold truncate mt-0.5">{fullName || user.name}</p>
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
                  <span className={`text-[11px] font-mono font-bold ${active ? 'text-white/90' : 'text-[#6D28D9] dark:text-[#C4B5FD]'}`}>
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
                onClick={() => onSwitchWorkspace('brand')}
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-[11px] font-semibold hover:border-[#6D28D9]"
              >
                <Briefcase className="w-3 h-3" />
                <span>Brand</span>
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
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 bg-[#FAF9FC]/90 dark:bg-[#0B0814]/90 backdrop-blur-md border-b border-[#E6E1F2] dark:border-[#211938] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="lg:hidden p-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B]">
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-[#645C7E] dark:text-[#A89EC4] truncate">
              <span>Creator Hub</span>
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
              onClick={() => openPortfolioModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Work</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="p-6 sm:p-8 rounded-2xl bg-[#150D2E] text-white border border-[#2C1E59] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#C4B5FD] mb-2">Welcome back, {fullName || user.name}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Your creativity deserves the right opportunities.
                  </h1>
                  <p className="text-sm text-[#D5CCE8] mt-1.5 max-w-xl">
                    Keep your portfolio current, respond to incoming brand invitations, and submit deliverables cleanly.
                  </p>
                </div>
                <div className="min-w-[220px] p-4 rounded-xl bg-white/8 border border-white/15">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[#DDD6FE]">Profile Completion</span>
                    <span className="font-mono font-bold tabular-nums">{profileCompletion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15 overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('profile')}
                    className="text-xs font-semibold text-white hover:underline"
                  >
                    {profileCompletion < 100 ? 'Complete Profile →' : 'Edit Creator Profile →'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Collaboration Invitations', value: receivedInvites.length },
                  { label: 'Pending Requests', value: requests.filter((r) => r.status === 'pending').length },
                  { label: 'Active Collaborations', value: collaborations.filter((c) => c.status === 'active' || c.status === 'in_review').length },
                  { label: 'Completed Projects', value: collaborations.filter((c) => c.status === 'completed').length },
                  { label: 'Unread Messages', value: unreadMessages },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]"
                  >
                    <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-2">{stat.label}</p>
                    <p className="text-2xl font-extrabold">
                      <AnimatedCounter value={stat.value} />
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Incoming Invitations</h2>
                    <button
                      type="button"
                      onClick={() => setTab('requests')}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {receivedInvites.length === 0 ? (
                    <p className="text-sm text-[#645C7E] dark:text-[#A89EC4] py-4">
                      No pending invitations right now. Browse open campaigns in Discover Campaigns to pitch brands directly.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {receivedInvites.slice(0, 4).map((inv) => (
                        <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{inv.campaignTitle}</p>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                              {inv.brandName} · {formatCurrency(inv.proposedBudget)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTab('requests')}
                            className="px-3 py-1.5 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold shrink-0"
                          >
                            Review
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Recent Messages</h2>
                    <button
                      type="button"
                      onClick={() => setTab('messages')}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      Open Inbox
                    </button>
                  </div>
                  {conversations.length === 0 ? (
                    <p className="text-sm text-[#645C7E] dark:text-[#A89EC4] py-4">
                      Direct messages with brands will appear here once a campaign conversation starts.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {conversations.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setActiveConvId(c.id);
                            setTab('messages');
                          }}
                          className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{c.brandName}</p>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">{c.lastMessage}</p>
                          </div>
                          <span className="text-[11px] font-mono text-[#786E91] shrink-0">
                            {formatTimestamp(c.updatedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* A. MY PROFILE */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={(e) => void handleSaveProfile(e)}
                className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-4"
              >
                <h2 className="text-base font-bold">Creator Profile Identity</h2>
                <div className="flex items-center gap-4">
                  <SafeImage src={photoUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border border-[#E6E1F2] dark:border-[#241C3B]" />
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const res = await uploadFile(f);
                          setPhotoUrl(res.url);
                          onToast('success', 'Photo uploaded');
                        } catch (err) {
                          onToast('error', 'Upload failed', err instanceof Error ? err.message : '');
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Primary Niche</label>
                    <select
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                    >
                      {NICHES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Biography</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          platforms.includes(p)
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
                    <label className="block text-xs font-semibold mb-1">Followers</label>
                    <input
                      type="number"
                      min={0}
                      value={followersCount}
                      onChange={(e) => setFollowersCount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Engagement %</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={engagementRate}
                      onChange={(e) => setEngagementRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Base Rate ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={collaborationRate}
                      onChange={(e) => setCollaborationRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Collaboration Preferences</label>
                  <textarea
                    rows={2}
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Creator Profile'}
                </button>
              </form>

              {/* Connected Social Accounts */}
              <div className="lg:col-span-5 space-y-5">
                <form
                  onSubmit={handleAddSocial}
                  className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-3.5"
                >
                  <h3 className="text-base font-bold">Connect Social Media Link</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={socPlatform}
                      onChange={(e) => setSocPlatform(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={socHandle}
                      onChange={(e) => setSocHandle(e.target.value)}
                      placeholder="@handle"
                      className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-mono"
                    />
                  </div>
                  <input
                    type="url"
                    required
                    value={socUrl}
                    onChange={(e) => setSocUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={0}
                      value={socFollowers}
                      onChange={(e) => setSocFollowers(e.target.value)}
                      placeholder="Followers"
                      className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={socEng}
                      onChange={(e) => setSocEng(e.target.value)}
                      placeholder="Engagement %"
                      className="px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
                  >
                    Add Social Account
                  </button>
                </form>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-3">
                  <h3 className="text-sm font-bold">Linked Channels ({mySocialAccounts.length})</h3>
                  {mySocialAccounts.length === 0 ? (
                    <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">No linked accounts yet.</p>
                  ) : (
                    <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {mySocialAccounts.map((acc) => (
                        <div key={acc.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-bold">
                              {acc.platform} · <span className="font-mono font-normal">{acc.handle}</span>
                            </p>
                            <p className="font-mono text-[#6E658A]">
                              {formatNumberCompact(acc.followers)} · {acc.engagementRate}% eng.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteSocialAccount(acc.id).then(() => onToast('info', 'Channel removed'))}
                            className="p-1.5 text-[#786E91] hover:text-rose-600"
                            aria-label="Remove channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* B. PORTFOLIO STUDIO (Masonry Gallery) */}
          {tab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Portfolio Studio</h2>
                  <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                    Showcase your strongest campaign photography, reels, and brand films in a responsive gallery.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openPortfolioModal()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Portfolio Item</span>
                </button>
              </div>

              {myPortfolios.length === 0 ? (
                <EmptyState
                  title="Your Portfolio Studio is ready"
                  description="Upload images or add video project links so brands can evaluate your visual aesthetic before inviting you."
                  actionLabel="Upload First Project"
                  onAction={() => openPortfolioModal()}
                />
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                  {myPortfolios.map((item) => (
                    <article
                      key={item.id}
                      className="break-inside-avoid rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden"
                    >
                      {item.mediaType === 'image' ? (
                        <SafeImage src={item.mediaUrl} alt={item.title} className="w-full object-cover max-h-72" />
                      ) : (
                        <div className="aspect-video bg-[#150D2E] text-white flex flex-col items-center justify-center p-6 text-center">
                          <Video className="w-8 h-8 text-[#A78BFA] mb-2" />
                          {isSafeUrl(item.mediaUrl) && (
                            <a
                              href={item.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-[#C4B5FD] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Watch Video Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                      <div className="p-5 space-y-2">
                        <p className="text-[11px] font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">{item.category}</p>
                        <h3 className="text-sm font-bold">{item.title}</h3>
                        <p className="text-xs text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{item.description}</p>
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEBF7] dark:border-[#211938]">
                          <button
                            type="button"
                            onClick={() => openPortfolioModal(item)}
                            className="p-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] hover:border-[#6D28D9]"
                            aria-label="Edit item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                title: 'Delete portfolio item?',
                                message: `Remove "${item.title}" from your Portfolio Studio?`,
                                confirmLabel: 'Delete',
                                onConfirm: () => {
                                  setConfirmState((s) => ({ ...s, open: false }));
                                  void deletePortfolioItem(item.id).then(() => onToast('info', 'Portfolio item deleted'));
                                },
                              })
                            }
                            className="p-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] hover:text-rose-600"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. DISCOVER CAMPAIGNS */}
          {tab === 'campaigns' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={campSearch}
                    onChange={(e) => setCampSearch(e.target.value)}
                    placeholder="Search campaigns by brand, title, or niche..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                  />
                </div>
                <select
                  value={campNiche}
                  onChange={(e) => setCampNiche(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-semibold"
                >
                  <option value="All">All Niches</option>
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <select
                  value={campPlatform}
                  onChange={(e) => setCampPlatform(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-semibold"
                >
                  <option value="All">All Platforms</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowSavedOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap ${
                    showSavedOnly
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'border-[#E6E1F2] dark:border-[#241C3B]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved ({savedCampaignIds.length})</span>
                </button>
              </div>

              {filteredCampaigns.length === 0 ? (
                <EmptyState
                  title="No campaigns match your filters"
                  description="Try clearing your search or switching niches to view more open opportunities."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCampaigns.map((camp) => {
                    const isSaved = savedCampaignIds.includes(camp.id);
                    const alreadyApplied = requests.some((r) => r.campaignId === camp.id);
                    return (
                      <article
                        key={camp.id}
                        className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden flex flex-col"
                      >
                        <div className="aspect-[16/9] bg-[#EFEAF9] dark:bg-[#1B1433] overflow-hidden">
                          <SafeImage src={camp.coverImageUrl} alt={camp.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                            <span className="font-bold text-[#6D28D9] dark:text-[#C4B5FD]">{camp.brandName}</span>
                            <StatusText status={camp.status} />
                          </div>
                          <h3 className="text-base font-bold mb-1.5">{camp.title}</h3>
                          <p className="text-xs text-[#504766] dark:text-[#B5ABD0] line-clamp-2 mb-3 leading-relaxed">
                            {camp.description}
                          </p>
                          <p className="text-[11px] text-[#6E658A] dark:text-[#988EB8] mb-3">
                            {camp.niche} · {camp.platforms.join(', ')} · {camp.deliverables.length} deliverables
                          </p>
                          <div className="mt-auto pt-3 border-t border-[#EFEBF7] dark:border-[#211938] space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                              <strong className="text-sm text-[#6D28D9] dark:text-[#C4B5FD]">
                                {formatCurrency(camp.budget)}
                              </strong>
                              <span className="text-[#786E91]">Due {camp.endDate || 'Flexible'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {camp.allowApplications && !alreadyApplied ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApplyTarget(camp);
                                    setApplyRate(String(creatorProfile?.collaborationRate || camp.budget));
                                    setApplyPitch(
                                      `Hi ${camp.brandName}, I specialize in ${niche} content and would love to produce the deliverables for "${camp.title}".`
                                    );
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold"
                                >
                                  Apply Now
                                </button>
                              ) : (
                                <span className="flex-1 text-center py-2 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433] text-xs font-semibold text-[#645C7E]">
                                  {alreadyApplied ? 'Applied' : 'Invite Only'}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setSavedCampaignIds((prev) =>
                                    prev.includes(camp.id) ? prev.filter((x) => x !== camp.id) : [...prev, camp.id]
                                  )
                                }
                                aria-label="Save campaign"
                                className={`p-2 rounded-xl border ${
                                  isSaved
                                    ? 'border-[#6D28D9] text-[#6D28D9] dark:text-[#C4B5FD]'
                                    : 'border-[#E6E1F2] dark:border-[#241C3B]'
                                }`}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReportCamp({ id: camp.id, name: camp.title })}
                                aria-label="Report campaign"
                                className="p-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-[#786E91] hover:text-rose-600"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* D. COLLABORATION REQUESTS */}
          {tab === 'requests' && (
            requests.length === 0 ? (
              <EmptyState
                title="No invitations or applications yet"
                description="When brands invite you to campaigns or you apply from Discover Campaigns, you can review terms and accept or decline here."
                actionLabel="Discover Campaigns"
                onAction={() => setTab('campaigns')}
              />
            ) : (
              <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                {requests.map((req) => (
                  <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold">{req.campaignTitle}</h3>
                        <StatusText status={req.status} />
                      </div>
                      <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                        Brand: <strong>{req.brandName}</strong> ·{' '}
                        {req.initiatorRole === 'brand' ? 'Received Invitation' : 'Your Application'} · Compensation:{' '}
                        <span className="font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                          {formatCurrency(req.proposedBudget)}
                        </span>
                      </p>
                      <p className="text-sm text-[#504766] dark:text-[#B5ABD0] max-w-2xl">{req.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' && req.initiatorRole === 'brand' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void respondToCollaborationRequest(req, 'accepted', user.uid).then(() =>
                                onToast('success', 'Invitation accepted', 'Your active collaboration is ready in My Collaborations.')
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void respondToCollaborationRequest(req, 'rejected', user.uid).then(() =>
                                onToast('info', 'Invitation declined')
                              )
                            }
                            className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === 'pending' && req.initiatorRole === 'creator' && (
                        <button
                          type="button"
                          onClick={() =>
                            void respondToCollaborationRequest(req, 'withdrawn', user.uid).then(() =>
                              onToast('info', 'Application withdrawn')
                            )
                          }
                          className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                        >
                          Withdraw
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void openMessageBrand(req.brandId, req.brandName, req.campaignId, req.campaignTitle)}
                        className="px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                      >
                        Message Brand
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* E. MY COLLABORATIONS */}
          {tab === 'collaborations' && (
            collaborations.length === 0 ? (
              <EmptyState
                title="No active collaborations yet"
                description="Once you accept a brand invitation or your campaign application is approved, your deliverables and milestones appear here."
                actionLabel="Explore Campaigns"
                onAction={() => setTab('campaigns')}
              />
            ) : (
              <div className="space-y-5">
                {collaborations.map((col) => {
                  const colDeliverables = deliverables.filter((d) => d.collaborationId === col.id);
                  return (
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
                            Brand: <strong>{col.brandName}</strong> · Budget:{' '}
                            <span className="font-mono font-semibold">{formatCurrency(col.budget)}</span> · Deadline:{' '}
                            {col.deadline}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openMessageBrand(col.brandId, col.brandName, col.campaignId, col.campaignTitle)}
                            className="px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                          >
                            Message
                          </button>
                          {col.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => setSubmitTargetCollab(col)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Submit Deliverable</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#645C7E] dark:text-[#A89EC4]">Collaboration Progress</span>
                          <span className="font-mono font-bold tabular-nums">{col.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EFEAF9] dark:bg-[#1F1738] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#6D28D9] to-[#3B82F6]"
                            style={{ width: `${col.progress}%` }}
                          />
                        </div>
                      </div>

                      {colDeliverables.length > 0 && (
                        <div className="pt-3 border-t border-[#EFEBF7] dark:border-[#211938] space-y-2.5">
                          <p className="text-xs font-bold">Submitted Deliverables ({colDeliverables.length})</p>
                          {colDeliverables.map((d) => (
                            <div
                              key={d.id}
                              className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1433] flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-bold">{d.title}</p>
                                {d.feedback && (
                                  <p className="text-[#6D28D9] dark:text-[#C4B5FD] mt-0.5">Brand note: {d.feedback}</p>
                                )}
                              </div>
                              <StatusText status={d.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* CREOVATE INTELLIGENCE */}
          {tab === 'intelligence' && (
            <CreovateIntelligence
              role="creator"
              creators={allCreators}
              campaigns={campaigns}
              creatorProfile={creatorProfile}
              portfolioItems={myPortfolios}
              onApplyBio={(newBio) => void handleSaveProfile(undefined, newBio)}
              onToast={onToast}
            />
          )}

          {/* MESSAGES */}
          {tab === 'messages' && (
            <MessagingCenter
              currentUser={user}
              perspective="creator"
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
              onNavigateTab={(t) => setTab(t as CreatorTab)}
              onToast={onToast}
            />
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="max-w-xl p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-4">
              <h2 className="text-lg font-bold">Account & Preferences</h2>
              <div className="text-sm space-y-2 text-[#504766] dark:text-[#B5ABD0]">
                <p>
                  <strong>Account Email:</strong> <span className="font-mono">{user.email}</span>
                </p>
                <p>
                  <strong>Role:</strong> <span className="capitalize">{user.role}</span>
                </p>
                <p>
                  <strong>Profile Visibility:</strong> Public in Brand Studio discovery
                </p>
              </div>
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
                >
                  Edit Creator Profile
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PORTFOLIO ITEM MODAL */}
      {portModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{editingPort ? 'Edit Portfolio Work' : 'Add Portfolio Work'}</h3>
              <button type="button" onClick={() => setPortModalOpen(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePortfolio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g., Summer Editorial Reel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Media Type</label>
                  <select
                    value={portType}
                    onChange={(e) => setPortType(e.target.value as 'image' | 'video')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={portCategory}
                    onChange={(e) => setPortCategory(e.target.value)}
                    placeholder="Brand Film"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Upload File or Paste Media URL *</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingMedia ? 'Uploading...' : 'Upload Media'}</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setUploadingMedia(true);
                        try {
                          const res = await uploadFile(f);
                          setPortUrl(res.url);
                          setPortType(res.mimeType.startsWith('video/') ? 'video' : 'image');
                          onToast('success', 'Media uploaded');
                        } catch (err) {
                          onToast('error', 'Upload failed', err instanceof Error ? err.message : '');
                        } finally {
                          setUploadingMedia(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={portUrl}
                  onChange={(e) => setPortUrl(e.target.value)}
                  placeholder="/uploads/... or https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Project Description</label>
                <textarea
                  rows={3}
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPortModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPort}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingPort ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY TO CAMPAIGN MODAL */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">{applyTarget.brandName}</p>
                <h3 className="text-base font-bold">{applyTarget.title}</h3>
              </div>
              <button type="button" onClick={() => setApplyTarget(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleApplyCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Proposed Fee (USD)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={applyRate}
                  onChange={(e) => setApplyRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Pitch Message</label>
                <textarea
                  rows={4}
                  required
                  value={applyPitch}
                  onChange={(e) => setApplyPitch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{applying ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT DELIVERABLE MODAL */}
      {submitTargetCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Submit Deliverable</h3>
              <button type="button" onClick={() => setSubmitTargetCollab(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-4">
              Campaign: <strong>{submitTargetCollab.campaignTitle}</strong> ({submitTargetCollab.brandName})
            </p>
            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={delTitle}
                  onChange={(e) => setDelTitle(e.target.value)}
                  placeholder="e.g., Final Cut 4K Review Reel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Upload File (Image, Video, or PDF)</label>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{delFileUrl ? 'File Attached — Replace' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const res = await uploadFile(f);
                        setDelFileUrl(res.url);
                        onToast('success', 'Deliverable file uploaded', res.originalName);
                      } catch (err) {
                        onToast('error', 'Upload failed', err instanceof Error ? err.message : '');
                      }
                    }}
                  />
                </label>
                {delFileUrl && <p className="text-[11px] font-mono text-emerald-600 mt-1 truncate">{delFileUrl}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Or External Content Link</label>
                <input
                  type="url"
                  value={delLinkUrl}
                  onChange={(e) => setDelLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://youtube.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Notes for Brand</label>
                <textarea
                  rows={3}
                  value={delDesc}
                  onChange={(e) => setDelDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitTargetCollab(null)}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submittingDel ? 'Submitting...' : 'Submit for Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />

      {reportCamp && (
        <ReportModal
          open={Boolean(reportCamp)}
          reporterId={user.uid}
          targetType="campaign"
          targetId={reportCamp.id}
          targetName={reportCamp.name}
          onClose={() => setReportCamp(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
