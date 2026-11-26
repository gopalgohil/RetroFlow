'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  Send,
  Link2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { api, ENDPOINTS } from '@/lib/api';
import { validateEmailAddress, isAllowedCompanyEmail } from '@/lib/validations/auth';

export interface ShareInviteSession {
  _id: string;
  title: string;
  shareToken: string;
  description?: string;
  status?: string;
}

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ShareInviteSession | null;
  onInviteSent?: (email: string) => void;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  isOpen,
  onClose,
  session,
  onInviteSent,
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [magicLink, setMagicLink] = useState<{ email: string; url: string } | null>(null);
  const [magicCopied, setMagicCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${origin}/retro/${session.shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyMagicLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setMagicCopied(true);
    setTimeout(() => setMagicCopied(false), 2200);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailCheck = validateEmailAddress(trimmedEmail);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    if (!isAllowedCompanyEmail(trimmedEmail)) {
      setErrorMessage('Only official @digiflux.io or @internal.digiflux.io emails are allowed.');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post(`${ENDPOINTS.RETROS}/${session._id}/invite`, {
        email: trimmedEmail,
      });

      const genUrl =
        res.data?.inviteUrl ||
        (res.data?.magicToken
          ? `${origin}/retro/${session.shareToken}?invite=${res.data.magicToken}`
          : null);
      if (genUrl) {
        setMagicLink({ email: trimmedEmail, url: genUrl });
      }

      setSuccessMessage(res.message || `Invitation dispatched to ${trimmedEmail}!`);
      setEmail('');
      if (onInviteSent) onInviteSent(trimmedEmail);

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch invitation email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0e1015] rounded-2xl shadow-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5cb028]/10 text-[#5cb028] dark:bg-[#88c958]/15 dark:text-[#88c958] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Invite Teammates
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Email Invite Form */}
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Send Email Invitation
              </label>
              <input
                type="email"
                placeholder="name@digiflux.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958] transition-all bg-slate-50/50 dark:bg-[#12151c]"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#88c958]/15 border border-emerald-200 dark:border-[#88c958]/30 text-emerald-700 dark:text-[#88c958] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#88c958]" />
                <span>{successMessage}</span>
              </div>
            )}

            {magicLink && (
              <div className="p-3 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl space-y-2 animate-in fade-in">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Direct invite link for <strong>{magicLink.email}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={magicLink.url}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-700 dark:text-slate-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyMagicLink(magicLink.url)}
                    className="px-3 py-1.5 rounded-lg bg-[#5cb028] hover:bg-[#4e9921] dark:bg-[#88c958] dark:hover:bg-[#76b846] text-white dark:text-[#08090a] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {magicCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || !email.trim()}
              className="w-full py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </form>

          <div className="relative py-1 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-white/[0.08]" />
            </div>
            <span className="relative px-2 bg-white dark:bg-[#0e1015] text-[11px] text-slate-400">
              or copy link
            </span>
          </div>

          {/* Direct Link Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Session Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 dark:bg-[#88c958]/20 text-emerald-700 dark:text-[#88c958] border-emerald-300 dark:border-[#88c958]/40'
                    : 'bg-white dark:bg-[#12151c] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#88c958]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#12151c]/70 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12151c] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareInviteModal;
