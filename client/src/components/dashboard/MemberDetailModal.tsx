'use client';

import React, { useState } from 'react';
import {
  Mail,
  Calendar,
  Briefcase,
  FolderKanban,
  Check,
  Copy,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui';
import { TeamMember } from '@/types/retro';

interface MemberDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  currentEmail?: string;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  currentEmail = '',
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!member) return null;

  const emailLower = member.email?.toLowerCase().trim();
  const isPrimaryOwner = emailLower === 'gopalgohel249@gmail.com';
  const isSelf = emailLower === currentEmail?.toLowerCase().trim();

  // Format joined date nicely
  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently joined';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyEmail = () => {
    if (member.email) {
      navigator.clipboard.writeText(member.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      showCloseButton={false}
    >
      <div className="space-y-5">
        {/* 1. Member Identity Card */}
        <div className="relative flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08]">
          <UserAvatar
            name={member.name || member.email}
            email={member.email}
            avatar={member.avatar}
            size="lg"
            status="online"
          />
          <div className="space-y-1 min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {member.name || member.email.split('@')[0]}
              </h4>
              {isSelf && (
                <span className="text-[10px] font-semibold text-[#3d8318] dark:text-[#88c958] bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
              {isPrimaryOwner ? (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                  Primary Owner
                </span>
              ) : member.role === 'Admin' ? (
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
                  Admin
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{member.email}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Key Metadata Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email Card with 1-click Copy */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                Email Address
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5cb028] dark:text-[#88c958] hover:text-[#4e9921] cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-[#88c958]" />
                    <span className="text-[#88c958]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate">
              {member.email}
            </p>
          </div>

          {/* Joined Date Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              Joined Date & Time
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatJoinedDate(member.joinedAt)}
            </p>
          </div>

          {/* Workspace Status Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              Account Status
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                  member.status === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    : 'bg-emerald-50 dark:bg-[#88c958]/15 text-emerald-700 dark:text-[#88c958] border border-emerald-200 dark:border-[#88c958]/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    member.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-[#88c958]'
                  }`}
                />
                <span>{member.status === 'pending' ? 'Pending Approval' : 'Active Member'}</span>
              </span>
            </div>
          </div>

          {/* Project Role / Assigned Role */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              Project Role
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white pt-0.5">
              {isPrimaryOwner
                ? 'Admin'
                : member.projectRole && member.projectRole !== 'Unassigned'
                ? member.projectRole
                : 'Developer'}
            </p>
          </div>
        </div>

        {/* 3. Assigned Projects Section */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
              Assigned Initiatives & Projects
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30">
              {member.projectsCount || 0} Total
            </span>
          </div>

          {member.projectNames && member.projectNames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {member.projectNames.map((projName, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/70 dark:border-white/[0.06] text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <div className="w-2 h-2 rounded-full bg-[#88c958] shrink-0" />
                  <span className="truncate">{projName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-[#12151c]/50 border border-dashed border-slate-200 dark:border-white/[0.08] text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                This member is not assigned to any projects currently.
              </p>
            </div>
          )}
        </div>

        {/* 4. Footer Close Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white transition-colors cursor-pointer shadow-xs dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
