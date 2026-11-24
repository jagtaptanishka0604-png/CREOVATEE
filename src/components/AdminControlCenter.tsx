import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Flag,
  BarChart3,
  LogOut,
  Search,
  RefreshCw,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  XCircle,
  Menu,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type {
  AdminActionItem,
  AdminTab,
  Campaign,
  Collaboration,
  ReportItem,
  UserRecord,
} from '../types';
import { formatCurrency } from '../data/demoData';
import {
  adminResolveReport,
  adminUpdateUser,
  deleteCampaign,
  fetchAdminOverviewData,
  formatTimestamp,
  logAdminAction,
  updateCampaign,
} from '../lib/firestoreService';
import {
  AnimatedCounter,
  ConfirmDialog,
  CreovateLogo,
  EmptyState,
  SkeletonRows,
  StatusText,
  ThemeToggle,
} from './UIPrimitives';

interface AdminControlCenterProps {
  dark: boolean;
  onToggleTheme: () => void;
  user: UserRecord;
  onSwitchWorkspace: (target: 'brand' | 'creator' | 'admin' | 'landing') => void;
  onLogout: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

const PIE_COLORS = ['#6D28D9', '#3B82F6', '#A78BFA'];

export function AdminControlCenter({
  dark,
  onToggleTheme,
  user,
  onSwitchWorkspace,
  onLogout,
  onToast,
}: AdminControlCenterProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [adminActions, setAdminActions] = useState<AdminActionItem[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'brand' | 'creator' | 'admin'>('all');
  const [campSearch, setCampSearch] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOverviewData();
      setUsers(data.users);
      setCampaigns(data.campaigns);
      setCollaborations(data.collaborations);
      setReports(data.reports);
      setAdminActions(data.adminActions);
    } catch (err) {
      onToast('error', 'Failed to load admin data', err instanceof Error ? err.message : 'Check admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (q && !`${u.name} ${u.email} ${u.uid}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, userSearch, roleFilter]);

  const filteredCampaigns = useMemo(() => {
    const q = campSearch.trim().toLowerCase();
    return campaigns.filter((c) => !q || `${c.title} ${c.brandName} ${c.niche}`.toLowerCase().includes(q));
  }, [campaigns, campSearch]);

  const roleDistribution = useMemo(() => {
    const brandCount = users.filter((u) => u.role === 'brand').length;
    const creatorCount = users.filter((u) => u.role === 'creator').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    return [
      { name: 'Brands', value: brandCount },
      { name: 'Creators', value: creatorCount },
      { name: 'Admins', value: adminCount },
    ];
  }, [users]);

  const campaignStatusData = useMemo(() => {
    const statuses = ['draft', 'open', 'active', 'completed', 'cancelled'] as const;
    return statuses.map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: campaigns.filter((c) => c.status === s).length,
    }));
  }, [campaigns]);

  const handleToggleUserStatus = async (target: UserRecord) => {
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    try {
      await adminUpdateUser(target.uid, { status: nextStatus });
      await logAdminAction({
        adminId: user.uid,
        adminEmail: user.email,
        actionType: nextStatus === 'suspended' ? 'deactivate_user' : 'activate_user',
        targetType: 'user',
        targetId: target.uid,
        details: `Changed ${target.email} status to ${nextStatus}`,
      });
      onToast('success', `User ${nextStatus}`, `${target.name} is now ${nextStatus}.`);
      void loadData();
    } catch (err) {
      onToast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  const handleRemoveCampaign = async (camp: Campaign) => {
    try {
      await deleteCampaign(camp.id);
      await logAdminAction({
        adminId: user.uid,
        adminEmail: user.email,
        actionType: 'remove_campaign',
        targetType: 'campaign',
        targetId: camp.id,
        details: `Removed campaign "${camp.title}" by ${camp.brandName}`,
      });
      onToast('info', 'Campaign removed', camp.title);
      void loadData();
    } catch (err) {
      onToast('error', 'Failed to remove campaign', err instanceof Error ? err.message : '');
    }
  };

  const handleResolveReport = async (rep: ReportItem, status: 'resolved' | 'dismissed') => {
    const note = resolutionNotes[rep.id]?.trim() || (status === 'resolved' ? 'Action taken by moderation team.' : 'Reviewed — no policy violation found.');
    try {
      await adminResolveReport(rep.id, status, note);
      await logAdminAction({
        adminId: user.uid,
        adminEmail: user.email,
        actionType: `report_${status}`,
        targetType: 'report',
        targetId: rep.id,
        details: `Marked report on ${rep.targetName} as ${status}: ${note}`,
      });
      onToast('success', `Report ${status}`);
      void loadData();
    } catch (err) {
      onToast('error', 'Could not update report', err instanceof Error ? err.message : '');
    }
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users, badge: users.length || undefined },
    { id: 'campaigns', label: 'Campaign Management', icon: Megaphone, badge: campaigns.length || undefined },
    { id: 'reports', label: 'Reports & Moderation', icon: Flag, badge: pendingReportsCount || undefined },
    { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
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
          <button type="button" onClick={() => onSwitchWorkspace('landing')}>
            <CreovateLogo />
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="px-3 py-2.5 rounded-xl bg-[#150D2E] text-white">
            <p className="text-[11px] font-semibold text-[#C4B5FD] inline-flex items-center gap-1">
              <Shield className="w-3 h-3" />
              CONTROL CENTER
            </p>
            <p className="text-xs font-mono truncate mt-0.5 text-white/80">{user.email}</p>
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
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
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
          <div className="grid grid-cols-2 gap-1.5 pb-1.5">
            <button
              type="button"
              onClick={() => onSwitchWorkspace('brand')}
              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-[11px] font-semibold hover:border-[#6D28D9]"
            >
              <Briefcase className="w-3 h-3" />
              <span>Brand Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchWorkspace('creator')}
              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-[11px] font-semibold hover:border-[#6D28D9]"
            >
              <Users className="w-3 h-3" />
              <span>Creator Hub</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#58506E] dark:text-[#A89EC4] hover:text-rose-600"
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
              <span>Control Center</span>
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
              onClick={() => void loadData()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold hover:border-[#6D28D9]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {loading ? (
            <SkeletonRows rows={5} />
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Total Users', value: users.length },
                      { label: 'Total Brands', value: users.filter((u) => u.role === 'brand').length },
                      { label: 'Total Creators', value: users.filter((u) => u.role === 'creator').length },
                      { label: 'Total Campaigns', value: campaigns.length },
                      { label: 'Active Collabs', value: collaborations.filter((c) => c.status === 'active' || c.status === 'in_review').length },
                      { label: 'Pending Reports', value: pendingReportsCount },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="p-5 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]"
                      >
                        <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-1.5">{s.label}</p>
                        <p className="text-2xl font-extrabold">
                          <AnimatedCounter value={s.value} />
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                    <h2 className="text-base font-bold mb-4">Recent Administrative Audit Log</h2>
                    {adminActions.length === 0 ? (
                      <p className="text-sm text-[#645C7E] dark:text-[#A89EC4]">
                        No administrative moderation actions recorded yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                        {adminActions.slice(0, 8).map((act) => (
                          <div key={act.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD]">{act.actionType}</span>
                              <span className="mx-2 text-[#786E91]">·</span>
                              <span>{act.details}</span>
                            </div>
                            <span className="font-mono text-[#786E91]">{formatTimestamp(act.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* USER MANAGEMENT */}
              {tab === 'users' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users by name, email, or UID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-white dark:bg-[#130E24] text-sm"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-white dark:bg-[#130E24] text-xs font-semibold"
                    >
                      <option value="all">All Roles</option>
                      <option value="brand">Brands</option>
                      <option value="creator">Creators</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#EFEBF7] dark:border-[#211938] text-[11px] font-semibold text-[#645C7E] dark:text-[#A89EC4]">
                          <th className="py-3.5 px-5">User</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Onboarding</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEBF7] dark:divide-[#211938] text-xs">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-[#FAF9FC] dark:hover:bg-[#18112D]">
                            <td className="py-3.5 px-5">
                              <p className="font-bold text-sm">{u.name}</p>
                              <p className="font-mono text-[#6E658A]">{u.email}</p>
                            </td>
                            <td className="py-3.5 px-4 capitalize font-semibold">{u.role}</td>
                            <td className="py-3.5 px-4">
                              <StatusText status={u.status} />
                            </td>
                            <td className="py-3.5 px-4">{u.onboardingComplete ? 'Complete' : 'Pending'}</td>
                            <td className="py-3.5 px-5 text-right">
                              {u.uid !== user.uid && (
                                <button
                                  type="button"
                                  onClick={() => void handleToggleUserStatus(u)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                                    u.status === 'active'
                                      ? 'border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                                      : 'border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {u.status === 'active' ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Activate</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CAMPAIGN MANAGEMENT */}
              {tab === 'campaigns' && (
                <div className="space-y-5">
                  <div className="relative max-w-md">
                    <Search className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={campSearch}
                      onChange={(e) => setCampSearch(e.target.value)}
                      placeholder="Search platform campaigns..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-white dark:bg-[#130E24] text-sm"
                    />
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <EmptyState
                      title="No campaigns created in Firestore yet"
                      description="User-created brand campaigns will appear here for status monitoring and policy moderation."
                    />
                  ) : (
                    <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                      {filteredCampaigns.map((c) => (
                        <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-sm font-bold">{c.title}</h3>
                              <StatusText status={c.status} />
                            </div>
                            <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                              {c.brandName} · {c.niche} · <span className="font-mono">{formatCurrency(c.budget)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() =>
                                  void updateCampaign(c.id, { status: 'cancelled', visibility: 'private' }).then(async () => {
                                    await logAdminAction({
                                      adminId: user.uid,
                                      adminEmail: user.email,
                                      actionType: 'cancel_campaign',
                                      targetType: 'campaign',
                                      targetId: c.id,
                                      details: `Cancelled campaign "${c.title}"`,
                                    });
                                    onToast('info', 'Campaign cancelled');
                                    void loadData();
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  title: 'Remove violating campaign?',
                                  message: `Permanently delete "${c.title}" and log this moderation action?`,
                                  confirmLabel: 'Remove Campaign',
                                  destructive: true,
                                  onConfirm: () => {
                                    setConfirmState((s) => ({ ...s, open: false }));
                                    void handleRemoveCampaign(c);
                                  },
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REPORTS & MODERATION */}
              {tab === 'reports' && (
                reports.length === 0 ? (
                  <EmptyState
                    title="No moderation reports submitted"
                    description="Reports filed against creators, brands, or campaigns will appear here with full audit tracking."
                  />
                ) : (
                  <div className="space-y-4">
                    {reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono uppercase text-[#6D28D9] dark:text-[#C4B5FD]">
                              Reported {rep.targetType}
                            </span>
                            <h3 className="text-base font-bold">{rep.targetName}</h3>
                          </div>
                          <StatusText status={rep.status} />
                        </div>
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Reason: {rep.reason}</p>
                        <p className="text-sm text-[#504766] dark:text-[#B5ABD0]">{rep.description}</p>
                        {rep.resolutionNote && (
                          <p className="text-xs font-mono text-[#645C7E] dark:text-[#A89EC4]">
                            Resolution Note: {rep.resolutionNote}
                          </p>
                        )}
                        {rep.status === 'pending' && (
                          <div className="pt-3 border-t border-[#EFEBF7] dark:border-[#211938] flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={resolutionNotes[rep.id] || ''}
                              onChange={(e) => setResolutionNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                              placeholder="Enter moderator resolution notes..."
                              className="flex-1 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void handleResolveReport(rep, 'dismissed')}
                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Dismiss</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleResolveReport(rep, 'resolved')}
                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ANALYTICS */}
              {tab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                    <h3 className="text-base font-bold mb-1">Brand-to-Creator Distribution</h3>
                    <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-6">
                      Live user role breakdown across registered CREOVATE accounts
                    </p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                            {roleDistribution.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
                    <h3 className="text-base font-bold mb-1">Campaign Lifecycle Breakdown</h3>
                    <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-6">
                      Distribution of campaigns by operational status
                    </p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignStatusData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#241C3B' : '#EFEBF7'} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark ? '#A89EC4' : '#645C7E' }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: dark ? '#A89EC4' : '#645C7E' }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
