/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut, type User as FirebaseUser } from 'firebase/auth';
import { Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import { auth } from './lib/firebase';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  type BrandProfile,
  type Campaign,
  type Collaboration,
  type CollaborationRequest,
  type Contact,
  type Conversation,
  type CreatorProfile,
  type Deliverable,
  type NotificationItem,
  type PortfolioItem,
  type SocialAccount,
  type ToastMessage,
  type UserRecord,
  type UserRole,
} from './types';
import {
  DEMO_CAMPAIGNS,
  DEMO_CREATORS,
  DEMO_PORTFOLIOS,
  DEMO_SOCIAL_ACCOUNTS,
} from './data/demoData';
import {
  createUserRecord,
  getUserRecord,
  subscribeBrandCampaigns,
  subscribeBrandContacts,
  subscribeCollaborationsByField,
  subscribeConversationsByField,
  subscribeDeliverablesByField,
  subscribePublicBrands,
  subscribePublicCampaigns,
  subscribePublicCreators,
  subscribePublicPortfolios,
  subscribePublicSocialAccounts,
  subscribeRequestsForBrand,
  subscribeRequestsForCreator,
  subscribeUserNotifications,
} from './lib/firestoreService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { BrandStudio } from './components/BrandStudio';
import { CreatorHub } from './components/CreatorHub';
import { AdminControlCenter } from './components/AdminControlCenter';
import { CreovateLogo, ToastContainer } from './components/UIPrimitives';

type ActiveView = 'landing' | 'onboarding' | 'brand' | 'creator' | 'admin';

function CreovateApp() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('creovate-theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [authReady, setAuthReady] = useState(false);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [view, setView] = useState<ActiveView>('landing');

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authModalRole, setAuthModalRole] = useState<'brand' | 'creator'>('brand');

  // Real-time Firestore collections
  const [liveCreators, setLiveCreators] = useState<CreatorProfile[]>([]);
  const [liveBrands, setLiveBrands] = useState<BrandProfile[]>([]);
  const [liveSocials, setLiveSocials] = useState<SocialAccount[]>([]);
  const [livePortfolios, setLivePortfolios] = useState<PortfolioItem[]>([]);
  const [livePublicCampaigns, setLivePublicCampaigns] = useState<Campaign[]>([]);

  // Scoped user workspace collections
  const [brandCampaigns, setBrandCampaigns] = useState<Campaign[]>([]);
  const [brandContacts, setBrandContacts] = useState<Contact[]>([]);
  const [brandRequests, setBrandRequests] = useState<CollaborationRequest[]>([]);
  const [creatorRequests, setCreatorRequests] = useState<CollaborationRequest[]>([]);
  const [brandCollabs, setBrandCollabs] = useState<Collaboration[]>([]);
  const [creatorCollabs, setCreatorCollabs] = useState<Collaboration[]>([]);
  const [brandDeliverables, setBrandDeliverables] = useState<Deliverable[]>([]);
  const [creatorDeliverables, setCreatorDeliverables] = useState<Deliverable[]>([]);
  const [brandConversations, setBrandConversations] = useState<Conversation[]>([]);
  const [creatorConversations, setCreatorConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      window.localStorage.setItem('creovate-theme', dark ? 'dark' : 'light');
    } catch {
      // ignore storage failure
    }
  }, [dark]);

  // Public directory subscriptions (real Firestore + cleanly separated demo showcase fallback)
  useEffect(() => {
    const unsubs = [
      subscribePublicCreators(setLiveCreators),
      subscribePublicBrands(setLiveBrands),
      subscribePublicSocialAccounts(setLiveSocials),
      subscribePublicPortfolios(setLivePortfolios),
      subscribePublicCampaigns(setLivePublicCampaigns),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Load user record helper
  const syncUserRecord = useCallback(async (firebaseUser: FirebaseUser, fallbackRole: UserRole = 'brand') => {
    if (!firebaseUser.emailVerified) {
      setUserRecord(null);
      return;
    }
    try {
      let rec = await getUserRecord(firebaseUser.uid);
      if (!rec) {
        const isBootAdmin = (firebaseUser.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        rec = await createUserRecord({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'CREOVATE Member',
          email: firebaseUser.email || '',
          role: isBootAdmin ? 'admin' : fallbackRole,
          photoUrl: firebaseUser.photoURL || '',
        });
      }
      setUserRecord(rec);
    } catch (err) {
      console.error('Failed to sync user record:', err);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      if (u && u.emailVerified) {
        await syncUserRecord(u);
      } else {
        setUserRecord(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [syncUserRecord]);

  // Scoped user Firestore subscriptions (only when authenticated & verified)
  useEffect(() => {
    if (!authReady || !fbUser || !fbUser.emailVerified || !userRecord) {
      setBrandCampaigns([]);
      setBrandContacts([]);
      setBrandRequests([]);
      setCreatorRequests([]);
      setBrandCollabs([]);
      setCreatorCollabs([]);
      setBrandDeliverables([]);
      setCreatorDeliverables([]);
      setBrandConversations([]);
      setCreatorConversations([]);
      setNotifications([]);
      return;
    }

    const uid = userRecord.uid;
    const unsubs = [
      subscribeBrandCampaigns(uid, setBrandCampaigns),
      subscribeBrandContacts(uid, setBrandContacts),
      subscribeRequestsForBrand(uid, setBrandRequests),
      subscribeRequestsForCreator(uid, setCreatorRequests),
      subscribeCollaborationsByField('brandId', uid, setBrandCollabs),
      subscribeCollaborationsByField('creatorId', uid, setCreatorCollabs),
      subscribeDeliverablesByField('brandId', uid, setBrandDeliverables),
      subscribeDeliverablesByField('creatorId', uid, setCreatorDeliverables),
      subscribeConversationsByField('brandId', uid, setBrandConversations),
      subscribeConversationsByField('creatorId', uid, setCreatorConversations),
      subscribeUserNotifications(uid, setNotifications),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authReady, fbUser, userRecord]);

  // Merge live Firestore public records with clearly flagged demo showcase records (no ID collisions)
  const allCreators = useMemo(() => {
    const liveIds = new Set(liveCreators.map((c) => c.id));
    return [...liveCreators, ...DEMO_CREATORS.filter((d) => !liveIds.has(d.id))];
  }, [liveCreators]);

  const allSocials = useMemo(() => {
    const liveIds = new Set(liveSocials.map((s) => s.id));
    return [...liveSocials, ...DEMO_SOCIAL_ACCOUNTS.filter((d) => !liveIds.has(d.id))];
  }, [liveSocials]);

  const allPortfolios = useMemo(() => {
    const liveIds = new Set(livePortfolios.map((p) => p.id));
    return [...livePortfolios, ...DEMO_PORTFOLIOS.filter((d) => !liveIds.has(d.id))];
  }, [livePortfolios]);

  const allPublicCampaigns = useMemo(() => {
    const liveIds = new Set(livePublicCampaigns.map((c) => c.id));
    return [...livePublicCampaigns, ...DEMO_CAMPAIGNS.filter((d) => !liveIds.has(d.id))];
  }, [livePublicCampaigns]);

  const isAdminUser =
    Boolean(userRecord?.role === 'admin') ||
    Boolean(fbUser?.emailVerified && fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());

  const myBrandProfile = useMemo(
    () => (userRecord ? liveBrands.find((b) => b.ownerId === userRecord.uid) || null : null),
    [liveBrands, userRecord]
  );

  const myCreatorProfile = useMemo(
    () => (userRecord ? liveCreators.find((c) => c.ownerId === userRecord.uid) || null : null),
    [liveCreators, userRecord]
  );

  const enterRoleWorkspace = useCallback(
    (rec: UserRecord | null, overrideRole?: UserRole) => {
      if (!rec) return;
      if (!rec.onboardingComplete && rec.role !== 'admin') {
        setView('onboarding');
        return;
      }
      const target = overrideRole || rec.role;
      if (target === 'admin') setView('admin');
      else if (target === 'creator') setView('creator');
      else setView('brand');
    },
    []
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRecord(null);
      setView('landing');
      pushToast('info', 'Signed out', 'You have been securely logged out of CREOVATE.');
    } catch (err) {
      pushToast('error', 'Logout failed', err instanceof Error ? err.message : '');
    }
  };

  // Suspended account lockout
  if (userRecord && userRecord.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FC] dark:bg-[#0B0814] p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Account Suspended</h1>
          <p className="text-sm text-[#58506E] dark:text-[#A89EC4]">
            Your CREOVATE account is currently deactivated by an administrator. Contact platform support if you believe this is in error.
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-5 py-2.5 rounded-xl bg-[#6D28D9] text-white text-sm font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Unverified email gate (for Email/Password registrations)
  if (authReady && fbUser && !fbUser.emailVerified && view !== 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FC] dark:bg-[#0B0814] p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-5">
          <CreovateLogo />
          <div className="w-11 h-11 rounded-xl bg-[#EFEAF9] dark:bg-[#1B1433] text-[#6D28D9] dark:text-[#C4B5FD] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-1.5">Verify your email address</h1>
            <p className="text-sm text-[#58506E] dark:text-[#A89EC4] leading-relaxed">
              We sent a verification link to <strong className="font-mono">{fbUser.email}</strong>. Click the link in your inbox, then refresh below to unlock your CREOVATE workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                await fbUser.reload();
                if (auth.currentUser?.emailVerified) {
                  await syncUserRecord(auth.currentUser, authModalRole);
                  pushToast('success', 'Email verified', 'Welcome to CREOVATE!');
                } else {
                  pushToast('info', 'Not verified yet', 'Check your spam folder or click resend.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>I&apos;ve Verified — Refresh</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await sendEmailVerification(fbUser);
                  pushToast('success', 'Verification email resent');
                } catch (err) {
                  pushToast('error', 'Could not resend', err instanceof Error ? err.message : '');
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold"
            >
              Resend Email
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-4 py-2.5 text-xs font-semibold text-[#645C7E] hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          creators={allCreators}
          campaigns={allPublicCampaigns}
          currentUser={userRecord}
          onOpenAuth={(mode, role) => {
            setAuthModalMode(mode);
            if (role) setAuthModalRole(role);
            setAuthModalOpen(true);
          }}
          onEnterWorkspace={() => enterRoleWorkspace(userRecord)}
        />
      )}

      {view === 'onboarding' && userRecord && (
        <OnboardingWizard
          user={userRecord}
          onComplete={async () => {
            const refreshed = await getUserRecord(userRecord.uid);
            if (refreshed) {
              setUserRecord(refreshed);
              enterRoleWorkspace(refreshed);
            } else {
              enterRoleWorkspace({ ...userRecord, onboardingComplete: true });
            }
          }}
          onToast={pushToast}
        />
      )}

      {view === 'brand' && userRecord && (
        <BrandStudio
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          user={userRecord}
          isAdminUser={isAdminUser}
          brandProfile={myBrandProfile}
          creators={allCreators}
          socialAccounts={allSocials}
          portfolios={allPortfolios}
          campaigns={brandCampaigns}
          contacts={brandContacts}
          requests={brandRequests}
          collaborations={brandCollabs}
          deliverables={brandDeliverables}
          conversations={brandConversations}
          notifications={notifications}
          onSwitchWorkspace={(t) => setView(t)}
          onLogout={() => void handleLogout()}
          onToast={pushToast}
        />
      )}

      {view === 'creator' && userRecord && (
        <CreatorHub
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          user={userRecord}
          isAdminUser={isAdminUser}
          creatorProfile={myCreatorProfile}
          allCreators={allCreators}
          mySocialAccounts={liveSocials.filter((s) => s.ownerId === userRecord.uid)}
          myPortfolios={livePortfolios.filter((p) => p.ownerId === userRecord.uid)}
          campaigns={allPublicCampaigns}
          requests={creatorRequests}
          collaborations={creatorCollabs}
          deliverables={creatorDeliverables}
          conversations={creatorConversations}
          notifications={notifications}
          onSwitchWorkspace={(t) => setView(t)}
          onLogout={() => void handleLogout()}
          onToast={pushToast}
        />
      )}

      {view === 'admin' && userRecord && isAdminUser && (
        <AdminControlCenter
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          user={userRecord}
          onSwitchWorkspace={(t) => setView(t)}
          onLogout={() => void handleLogout()}
          onToast={pushToast}
        />
      )}

      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        initialRole={authModalRole}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={async (role) => {
          const current = auth.currentUser;
          if (!current) return;
          if (!current.emailVerified) {
            setView('onboarding');
            return;
          }
          const rec = await getUserRecord(current.uid);
          if (rec) {
            setUserRecord(rec);
            enterRoleWorkspace(rec);
          } else {
            await syncUserRecord(current, role);
            const created = await getUserRecord(current.uid);
            if (created) enterRoleWorkspace(created);
          }
        }}
        onToast={pushToast}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CreovateApp />
    </ErrorBoundary>
  );
}
