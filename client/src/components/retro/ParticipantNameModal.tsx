'use client';

import React, { useState, memo } from 'react';
import { CheckCircle2, Sparkles, ShieldCheck, Mail, User } from 'lucide-react';

export interface ParticipantNameModalProps {
  isOpen: boolean;
  onJoin: (name: string, email?: string) => void;
  verifiedEmail?: string | null;
}

/**
 * Clean Modal dialog prompting guest developers to provide their display name & work email
 * Supports Solution 1: Instant No-Password Access & Auto-Identity Activation
 */
export const ParticipantNameModal: React.FC<ParticipantNameModalProps> = memo(
  function ParticipantNameModal({ isOpen, onJoin, verifiedEmail }) {
    // Derive initial suggestion from email prefix if available
    const initialSuggestion = verifiedEmail
      ? verifiedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '';

    const [nameInput, setNameInput] = useState(initialSuggestion);
    const [emailInput, setEmailInput] = useState(verifiedEmail || '');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = nameInput.trim();
      if (!trimmedName) return;
      const effectiveEmail = verifiedEmail || emailInput.trim();
      onJoin(trimmedName, effectiveEmail || undefined);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md font-black">
              RF
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {verifiedEmail ? 'Welcome, Teammate!' : 'Join Retrospective'}
              </h3>
              <p className="text-xs text-slate-500">
                {verifiedEmail
                  ? 'Instant 1-Click Magic Entry'
                  : 'Enter your identity to collaborate on sprint retros'}
              </p>
            </div>
          </div>

          {/* Verified Invitation Pill (if invited via magic token) */}
          {verifiedEmail ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <span>Verified Project Invitation</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                </div>
                <div className="text-xs font-semibold text-emerald-900 truncate">
                  {verifiedEmail}
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Your Display Name</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Parth Patel, Alex Rivera..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all bg-white"
              />
            </div>

            {/* Email Field - enables instant Project Dashboard & Role mapping */}
            {!verifiedEmail && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Work / Team Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. parth@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Connects you to your Project Dashboard, Sprints & Team Directory.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!nameInput.trim() || (!verifiedEmail && !emailInput.trim())}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:bg-indigo-300 flex items-center justify-center gap-1.5 mt-2"
            >
              <span>Enter Retrospective Board</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }
);

export default ParticipantNameModal;

