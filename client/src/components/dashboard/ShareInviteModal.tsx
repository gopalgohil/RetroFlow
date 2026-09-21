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
import { validateEmailAddress } from '@/lib/validations/auth';

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

      // Auto dismiss success note after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch invitation email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0e1015] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.08] flex items-start justify-between bg-gradient-to-r from-[#eaf5e3]/50 via-white to-slate-50 dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#12151c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] flex items-center justify-center shadow-md shadow-[#5cb028]/20 dark:shadow-[#88c958]/20 shrink-0 font-bold">
              <Mail className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Invite Teammates & Developers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share board link or dispatch direct email invitation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Target Retrospective Session Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3d8318] dark:text-[#88c958]">
                Target Session
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {session.title}
              </h4>
              {session.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{session.description}</p>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 dark:bg-[#88c958]/15 text-emerald-700 dark:text-[#88c958] border border-emerald-200 dark:border-[#88c958]/30 shrink-0">
              Live Link Ready
            </span>
          </div>

          {/* Section 1: Send Direct Email */}
          <form onSubmit={handleSendEmail} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                <span>Send Email Invitation via Brevo</span>
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Auto-whitelisted</span>
            </div>

            <div>
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958] transition-all bg-white dark:bg-[#12151c]"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#88c958]/15 border border-emerald-200 dark:border-[#88c958]/30 text-emerald-700 dark:text-[#88c958] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#88c958]" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1-Click Magic Link Box */}
            {magicLink && (
              <div className="p-3.5 bg-[#eaf5e3]/80 dark:bg-[#88c958]/10 border border-[#cdeac0] dark:border-[#88c958]/30 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3d8318] dark:text-[#88c958] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                    <span>1-Click Magic Link for <strong>{magicLink.email}</strong></span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-[#88c958] font-bold bg-emerald-100 dark:bg-[#88c958]/20 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-[#88c958]/30">
                    Zero Passwords
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={magicLink.url}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#0e1015] border border-[#cdeac0] dark:border-white/[0.08] rounded-xl text-xs text-[#3d8318] dark:text-[#88c958] font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyMagicLink(magicLink.url)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      magicCopied
                        ? 'bg-emerald-50 dark:bg-[#88c958]/20 text-emerald-700 dark:text-[#88c958] border-emerald-300 dark:border-[#88c958]/40'
                        : 'bg-[#5cb028] hover:bg-[#4e9921] text-white border-transparent shadow-xs dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a]'
                    }`}
                  >
                    {magicCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#88c958]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Brevo notification dispatched. You can also directly send this link to your teammate.
                </p>
              </div>
            )}

            {/* Send Invitation Button */}
            <button
              type="submit"
              disabled={isSending || !email.trim()}
              className="w-full py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all flex items-center justify-center gap-2 cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Brevo Invitation...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Send Brevo Email Invitation</span>
                </>
              )}
            </button>
          </form>

          <div className="h-px bg-slate-100 dark:bg-white/[0.08]" />

          {/* Section 2: Direct URL Copy Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
              <span>Direct Retrospective Session URL</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 dark:bg-[#88c958]/20 text-emerald-700 dark:text-[#88c958] border-emerald-300 dark:border-[#88c958]/40'
                    : 'bg-white dark:bg-[#12151c] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:border-[#88c958]/60'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#88c958]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Anyone with this link can view the topics and contribute sticky cards.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#12151c]/70 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end">
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
