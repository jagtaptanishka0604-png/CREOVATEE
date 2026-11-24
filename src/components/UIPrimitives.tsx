import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Info,
  Sun,
  Moon,
  X,
  Clock,
  AlertCircle,
  PauseCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import type { ToastMessage } from '../types';
import { isSafeUrl } from '../lib/api';

export function CreovateLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 7.5a6 6 0 1 0 0 9" />
          <path d="M12 12h7" />
          <path d="M16 9l3 3-3 3" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display font-extrabold text-[19px] tracking-tight text-[#110D1F] dark:text-[#F4F2FA]">
          CREOVATE
        </span>
      )}
    </span>
  );
}

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-10 h-10 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-white dark:bg-[#130E24] text-[#4E4663] dark:text-[#C4B8E3] hover:text-[#6D28D9] dark:hover:text-[#A78BFA] hover:border-[#C4B5FD] dark:hover:border-[#4C1D95] flex items-center justify-center transition-colors shrink-0"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);
  const valid = isSafeUrl(src) && !failed;

  if (!valid) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EFEAF9] via-[#E5DDF7] to-[#DBEAFE] dark:from-[#1B1333] dark:via-[#221840] dark:to-[#17203A] text-[#5B4D80] dark:text-[#A78BFA] ${className}`}
      >
        <ImageIcon className="w-6 h-6 opacity-60 mb-1" />
        {fallbackTitle && (
          <span className="text-xs font-medium px-3 text-center truncate max-w-full opacity-80">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 650;
    const stepMs = 16;
    const increment = value / Math.max(1, duration / stepMs);
    const timer = window.setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        window.clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums font-mono">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatusText({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let color = 'text-[#58506E] dark:text-[#A89EC4]';
  let Icon = Clock;

  if (['active', 'open', 'accepted', 'approved', 'completed', 'resolved'].includes(normalized)) {
    color = 'text-emerald-700 dark:text-emerald-400';
    Icon = CheckCircle2;
  } else if (['pending', 'in_review', 'submitted', 'reviewed', 'draft'].includes(normalized)) {
    color = 'text-amber-700 dark:text-amber-400';
    Icon = Clock;
  } else if (['rejected', 'cancelled', 'suspended', 'revision_requested', 'dismissed'].includes(normalized)) {
    color = 'text-rose-700 dark:text-rose-400';
    Icon = AlertCircle;
  } else if (normalized === 'withdrawn') {
    color = 'text-slate-600 dark:text-slate-400';
    Icon = PauseCircle;
  }

  const label = normalized.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export function AiSourceLabel() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6D28D9] dark:text-[#C4B5FD]">
      <Sparkles className="w-3.5 h-3.5" />
      <span>AI-generated recommendation · Review before acting</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="border border-dashed border-[#D8CFF0] dark:border-[#2E244D] rounded-2xl p-10 text-center bg-white/60 dark:bg-[#130E24]/60">
      <h3 className="text-base font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-1.5">{title}</h3>
      <p className="text-sm text-[#58506E] dark:text-[#A89EC4] max-w-md mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 rounded-xl bg-[#EFEAF9]/70 dark:bg-[#1B1433]/70 animate-pulse border border-[#E6E1F2] dark:border-[#241C3B]"
        />
      ))}
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#18122E] border border-[#E6E1F2] dark:border-[#2E244D] shadow-lg"
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-[#6D28D9] dark:text-[#A78BFA] shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#110D1F] dark:text-[#F4F2FA]">{t.title}</p>
            {t.description && (
              <p className="text-xs text-[#58506E] dark:text-[#A89EC4] mt-0.5 leading-relaxed">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-[#786E91] hover:text-[#110D1F] dark:hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/60 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-2">{title}</h3>
        <p className="text-sm text-[#58506E] dark:text-[#A89EC4] leading-relaxed mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-sm font-medium text-[#3F3756] dark:text-[#C4B8E3] hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433] transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors whitespace-nowrap ${
              destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#6D28D9] hover:bg-[#5B21B6]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
