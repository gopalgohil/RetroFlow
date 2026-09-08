'use client';

import React, { useState } from 'react';
import { Users, Shield, Mail, Plus, UserCheck, RefreshCw } from 'lucide-react';
import { TeamMember } from '@/types/retro';

interface MembersTabProps {
  members: TeamMember[];
  isLoading: boolean;
  onRefresh: () => void;
  onWhitelistAdded: (email: string) => Promise<void>;
  currentEmail?: string;
  isAdmin?: boolean;
}

/**
 * MembersTab Component
 * Manages team member roster, contributor statuses, and automatic whitelist approvals.
 */
export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  isLoading,
  onRefresh,
  onWhitelistAdded,
  currentEmail,
  isAdmin = true,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    setIsSubmitting(true);
    try {
      await onWhitelistAdded(cleanEmail);
      setEmailInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {isAdmin ? 'Team Members & Whitelist Roster' : 'Team Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Developer permissions, automatic whitelist bypass, and workspace collaborators'
              : 'Workspace teammates, collaborators, and active retrospective contributors'}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Whitelist Quick Add Form Card (Admin Only) */}
      {isAdmin && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-indigo-50/40 border border-emerald-100/80 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Instant Whitelist Access</h3>
              <p className="text-xs text-slate-500">
                Developers on this whitelist bypass facilitator waiting room approvals.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. developer@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Whitelist Developer</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Members Roster List Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Registered & Whitelisted Members</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {members.length} Total Contributor{members.length !== 1 ? 's' : ''}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No team members found. Whitelist developers using the input above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id || m.email} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                    {m.name ? m.name.charAt(0) : m.email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {m.name || m.email}
                      {m.email === currentEmail && (
                        <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                    {m.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      m.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersTab;
