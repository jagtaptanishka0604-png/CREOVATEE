import React, { useEffect, useRef, useState } from 'react';
import { Search, Send, MessageSquare, Briefcase } from 'lucide-react';
import type { ChatMessage, Conversation, UserRecord } from '../types';
import {
  formatTimestamp,
  markConversationRead,
  sendMessage,
  subscribeConversationMessages,
} from '../lib/firestoreService';
import { EmptyState } from './UIPrimitives';

interface MessagingCenterProps {
  currentUser: UserRecord;
  perspective: 'brand' | 'creator';
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export function MessagingCenter({
  currentUser,
  perspective,
  conversations,
  activeConversationId,
  onSelectConversation,
  onToast,
}: MessagingCenterProps) {
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    const field = perspective === 'brand' ? 'brandId' : 'creatorId';
    const unsub = subscribeConversationMessages(activeConv.id, field, currentUser.uid, (list) => {
      setMessages(list);
    });
    void markConversationRead(activeConv, currentUser.uid);
    return () => unsub();
  }, [activeConv?.id, perspective, currentUser.uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.brandName.toLowerCase().includes(q) ||
      c.creatorName.toLowerCase().includes(q) ||
      (c.campaignTitle || '').toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(activeConv, currentUser.uid, currentUser.name, draft.trim());
      setDraft('');
    } catch (err) {
      onToast('error', 'Message failed', err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description={
          perspective === 'brand'
            ? 'Start a conversation from any creator card in Discover Creators or from an active collaboration.'
            : 'Messages with brands appear here once you apply to a campaign or a brand reaches out.'
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden min-h-[580px]">
      {/* Left Conversation List */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E6E1F2] dark:border-[#241C3B] flex flex-col">
        <div className="p-4 border-b border-[#EFEBF7] dark:border-[#211938]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#786E91] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#EFEBF7] dark:divide-[#211938]">
          {filtered.map((conv) => {
            const partnerName = perspective === 'brand' ? conv.creatorName : conv.brandName;
            const unread = perspective === 'brand' ? conv.unreadByBrand : conv.unreadByCreator;
            const selected = activeConv?.id === conv.id;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-4 transition-colors ${
                  selected
                    ? 'bg-[#F4F1FA] dark:bg-[#1D1536]'
                    : 'hover:bg-[#FAF9FC] dark:hover:bg-[#18112D]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-[#110D1F] dark:text-[#F4F2FA] truncate">{partnerName}</span>
                  {unread > 0 && (
                    <span className="text-[11px] font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD] shrink-0">
                      {unread} new
                    </span>
                  )}
                </div>
                {conv.campaignTitle && (
                  <p className="text-[11px] text-[#6D28D9] dark:text-[#A78BFA] truncate mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    <span className="truncate">{conv.campaignTitle}</span>
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">{conv.lastMessage}</p>
                  <span className="text-[10px] font-mono text-[#8A80A3] shrink-0">
                    {formatTimestamp(conv.updatedAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Thread Panel */}
      <div className="lg:col-span-8 flex flex-col">
        {activeConv ? (
          <>
            <div className="px-5 py-4 border-b border-[#EFEBF7] dark:border-[#211938] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#110D1F] dark:text-[#F4F2FA] truncate">
                  {perspective === 'brand' ? activeConv.creatorName : activeConv.brandName}
                </h3>
                <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] truncate">
                  {activeConv.campaignTitle
                    ? `Campaign: ${activeConv.campaignTitle}`
                    : 'Direct collaboration thread'}
                </p>
              </div>
              <span className="text-xs font-mono text-[#786E91] shrink-0">
                {messages.length} message{messages.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex-1 p-5 space-y-3.5 overflow-y-auto max-h-[420px] bg-[#FAF9FC]/60 dark:bg-[#0E0A1B]/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#786E91]">
                  <MessageSquare className="w-6 h-6 mb-2 opacity-60" />
                  <p className="text-sm font-medium">Send the first message to kick off this conversation.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUser.uid;
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          mine
                            ? 'bg-[#6D28D9] text-white'
                            : 'bg-white dark:bg-[#1B1433] border border-[#E6E1F2] dark:border-[#2C224A] text-[#110D1F] dark:text-[#F4F2FA]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A80A3] mt-1 px-1">
                        {mine ? 'You' : m.senderName} · {formatTimestamp(m.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-[#EFEBF7] dark:border-[#211938] flex items-center gap-3"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message about deliverables, timelines, or creative direction..."
                maxLength={2000}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm focus:outline-none focus:border-[#6D28D9]"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
