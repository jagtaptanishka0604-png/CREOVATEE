import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { submitReport } from '../lib/firestoreService';

interface ReportModalProps {
  open: boolean;
  reporterId: string;
  targetType: 'user' | 'campaign';
  targetId: string;
  targetName: string;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

const REASONS = [
  'Misleading metrics or impersonation',
  'Inappropriate or policy-violating content',
  'Spam or solicitation abuse',
  'Unfair payment or contract terms',
  'Other moderation concern',
];

export function ReportModal({
  open,
  reporterId,
  targetType,
  targetId,
  targetName,
  onClose,
  onToast,
}: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      onToast('error', 'More detail required', 'Please provide at least 5 characters explaining the issue.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        reporterId,
        targetType,
        targetId,
        targetName,
        reason,
        description: description.trim(),
      });
      onToast('success', 'Report submitted', 'Platform administrators have received your report for review.');
      setDescription('');
      onClose();
    } catch (err) {
      onToast('error', 'Could not submit report', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/65 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Flag className="w-4 h-4" />
            <h3 className="text-base font-bold text-[#110D1F] dark:text-[#F4F2FA]">
              Report {targetType === 'campaign' ? 'Campaign' : 'Profile'}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-4">
          Reporting <strong className="text-[#110D1F] dark:text-[#F4F2FA]">{targetName}</strong> for moderator review.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Details</label>
            <textarea
              rows={3}
              required
              minLength={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what policy or guideline was violated..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
