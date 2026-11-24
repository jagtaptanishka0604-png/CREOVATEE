import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Mail,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Megaphone,
  FileCheck,
  Clock,
} from 'lucide-react';
import type { NotificationItem } from '../types';
import { formatTimestamp, markAllNotificationsRead, markNotificationRead } from '../lib/firestoreService';
import { EmptyState } from './UIPrimitives';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onNavigateTab?: (tab: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export function NotificationCenter({ notifications, onNavigateTab, onToast }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busy, setBusy] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead(notifications);
      onToast('success', 'All caught up', 'All notifications marked as read.');
    } catch (err) {
      onToast('error', 'Action failed', err instanceof Error ? err.message : 'Unable to mark notifications.');
    } finally {
      setBusy(false);
    }
  };

  const handleClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
      } catch {
        // non-blocking
      }
    }
    if (item.linkTab && onNavigateTab) {
      onNavigateTab(item.linkTab);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'invitation':
        return Mail;
      case 'invitation_accepted':
        return CheckCircle2;
      case 'invitation_rejected':
        return XCircle;
      case 'message':
        return MessageSquare;
      case 'deliverable_submitted':
        return FileCheck;
      case 'deadline':
        return Clock;
      case 'announcement':
      case 'campaign_published':
      case 'campaign_updated':
        return Megaphone;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-[#130E24] text-[#110D1F] dark:text-white shadow-sm'
                : 'text-[#5E5678] dark:text-[#A89EC4]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-white dark:bg-[#130E24] text-[#110D1F] dark:text-white shadow-sm'
                : 'text-[#5E5678] dark:text-[#A89EC4]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <button
          type="button"
          disabled={busy || unreadCount === 0}
          onClick={handleMarkAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-xs font-semibold text-[#3F3756] dark:text-[#DDD6FE] hover:border-[#6D28D9] disabled:opacity-40 whitespace-nowrap"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Invitations, deliverable reviews, messages, and campaign updates will show up here automatically."
        />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] divide-y divide-[#EFEBF7] dark:divide-[#211938] overflow-hidden">
          {visible.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => void handleClick(item)}
                className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                  item.read
                    ? 'hover:bg-[#FAF9FC] dark:hover:bg-[#18112D]'
                    : 'bg-[#F8F5FF] dark:bg-[#1C1436] hover:bg-[#F3EEFE] dark:hover:bg-[#221942]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#EFEAF9] dark:bg-[#261C47] text-[#6D28D9] dark:text-[#C4B5FD] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-[#110D1F] dark:text-[#F4F2FA] truncate">{item.title}</h4>
                    <span className="text-[11px] font-mono text-[#786E91] shrink-0">
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#58506E] dark:text-[#A89EC4] leading-relaxed">{item.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <span className="text-[#6D28D9] dark:text-[#C4B5FD] font-semibold">
                      {item.read ? 'Read' : 'Unread'}
                    </span>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markNotificationRead(item.id);
                        }}
                        className="text-[#58506E] dark:text-[#A89EC4] hover:text-[#110D1F] dark:hover:text-white underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
