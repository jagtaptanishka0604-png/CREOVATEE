import React, { useState } from 'react';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { Briefcase, Users, X, Mail, Lock, User, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { BOOTSTRAPPED_ADMIN_EMAIL, type UserRole } from '../types';
import { createUserRecord, getUserRecord } from '../lib/firestoreService';
import { CreovateLogo } from './UIPrimitives';

interface AuthModalProps {
  open: boolean;
  initialMode: 'login' | 'register';
  initialRole: 'brand' | 'creator';
  onClose: () => void;
  onAuthSuccess: (role: UserRole) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export function AuthModal({
  open,
  initialMode,
  initialRole,
  onClose,
  onAuthSuccess,
  onToast,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<'brand' | 'creator'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(initialRole);
      setErrorMsg('');
      setInfoMsg('');
    }
  }, [open, initialMode, initialRole]);

  if (!open) return null;

  const ensureUserDoc = async (uid: string, displayName: string, userEmail: string, photoUrl?: string | null) => {
    const existing = await getUserRecord(uid);
    if (existing) {
      return existing.role;
    }
    const assignedRole: UserRole =
      userEmail.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ? 'admin' : role;
    await createUserRecord({
      uid,
      name: displayName || userEmail.split('@')[0] || 'CREOVATE Member',
      email: userEmail,
      role: assignedRole,
      photoUrl: photoUrl || '',
    });
    return assignedRole;
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      const resolvedRole = await ensureUserDoc(u.uid, u.displayName || name, u.email || '', u.photoURL);
      onToast('success', 'Signed in with Google', `Welcome to CREOVATE, ${u.displayName || u.email}.`);
      onAuthSuccess(resolvedRole);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setInfoMsg('Password reset instructions have been sent to your email address.');
        onToast('success', 'Reset link sent', `Check ${trimmedEmail} to reset your password.`);
      } catch (err) {
        setErrorMsg(formatAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setErrorMsg('Please enter your full name or brand name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!acceptedTerms) {
        setErrorMsg('Please accept the CREOVATE Terms of Service to continue.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await sendEmailVerification(cred.user);
        setInfoMsg(
          'Account created! A verification email has been sent. Please verify your email inbox, then click refresh in the workspace banner.'
        );
        onToast('info', 'Verify your email', 'Check your inbox for the CREOVATE verification link.');
        onAuthSuccess(role);
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        if (cred.user.emailVerified) {
          const resolvedRole = await ensureUserDoc(
            cred.user.uid,
            cred.user.displayName || '',
            cred.user.email || trimmedEmail,
            cred.user.photoURL
          );
          onToast('success', 'Welcome back', 'Signed into your CREOVATE workspace.');
          onAuthSuccess(resolvedRole);
        } else {
          onToast('info', 'Email verification required', 'Please verify your email address to unlock full write access.');
          onAuthSuccess(role);
        }
        onClose();
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[#EFEBF7] dark:border-[#211938]">
          <CreovateLogo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 rounded-lg text-[#6E658A] hover:text-[#110D1F] dark:hover:text-white hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {mode !== 'forgot' ? (
            <>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433] mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'login'
                      ? 'bg-white dark:bg-[#130E24] text-[#110D1F] dark:text-white shadow-sm'
                      : 'text-[#5E5678] dark:text-[#A89EC4]'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'register'
                      ? 'bg-white dark:bg-[#130E24] text-[#110D1F] dark:text-white shadow-sm'
                      : 'text-[#5E5678] dark:text-[#A89EC4]'
                  }`}
                >
                  Join CREOVATE
                </button>
              </div>

              {/* Role Selection (Active for Registration & First-Time Google Sign-In) */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#4E4663] dark:text-[#C4B8E3] mb-2">
                  {mode === 'register' ? 'Choose your workspace role' : 'Workspace role (for new Google accounts)'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('brand')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                      role === 'brand'
                        ? 'border-[#6D28D9] bg-[#6D28D9]/8 dark:bg-[#6D28D9]/20 text-[#110D1F] dark:text-white'
                        : 'border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Continue as Brand</span>
                      <span className="block text-[11px] opacity-75">Brand Studio</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                      role === 'creator'
                        ? 'border-[#6D28D9] bg-[#6D28D9]/8 dark:bg-[#6D28D9]/20 text-[#110D1F] dark:text-white'
                        : 'border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Continue as Creator</span>
                      <span className="block text-[11px] opacity-75">Creator Hub</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Instant Google OAuth */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-[#110D1F] dark:bg-white text-white dark:text-[#110D1F] hover:opacity-92 text-sm font-semibold flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50 mb-5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.6c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.9-2.1-6.9-5H1.1v3.1C3.1 21.3 7.2 24 12 24z" />
                  <path fill="#FBBC05" d="M5.1 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.7H1.1C.4 8.3 0 10.1 0 12s.4 3.7 1.1 5.3l4-3.1z" />
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.2 0 3.1 2.7 1.1 6.7l4 3.1c1-2.9 3.7-5 6.9-5z" />
                </svg>
                <span>{loading ? 'Connecting...' : `Continue with Google (${role === 'brand' ? 'Brand' : 'Creator'})`}</span>
              </button>

              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-[#E6E1F2] dark:border-[#241C3B] w-full" />
                <span className="bg-white dark:bg-[#130E24] px-3 text-[11px] text-[#786E91] whitespace-nowrap">
                  or with email
                </span>
                <div className="border-t border-[#E6E1F2] dark:border-[#241C3B] w-full" />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Log In</span>
            </button>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#4E4663] dark:text-[#C4B8E3] mb-1">
                  {role === 'brand' ? 'Full Name / Brand Lead' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'brand' ? 'Hannah Brooks' : 'Aria Chen'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4E4663] dark:text-[#C4B8E3] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#4E4663] dark:text-[#C4B8E3]">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                      }}
                      className="text-xs font-medium text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#4E4663] dark:text-[#C4B8E3] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#786E91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#58506E] dark:text-[#A89EC4] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#D4CBEB] text-[#6D28D9] focus:ring-[#6D28D9]"
                  />
                  <span>
                    I accept the CREOVATE Terms of Service and Privacy Guidelines for brand and creator collaborations.
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
            >
              {loading
                ? 'Please wait...'
                : mode === 'forgot'
                  ? 'Send Reset Link'
                  : mode === 'register'
                    ? `Create ${role === 'brand' ? 'Brand' : 'Creator'} Account`
                    : 'Log In with Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function formatAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Use "Continue with Google" above for instant access.';
  }
  if (msg.includes('email-already-in-use')) {
    return 'An account with this email already exists. Switch to Log In instead.';
  }
  if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
    return 'Invalid email or password. Please verify your credentials or reset your password.';
  }
  return msg;
}
