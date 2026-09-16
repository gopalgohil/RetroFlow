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
        {/* 1. Member Identity Card - Simple Clean White */}
        <div className="relative flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <UserAvatar
            name={member.name || member.email}
            email={member.email}
            avatar={member.avatar}
            size="lg"
            status="online"
          />
          <div className="space-y-1 min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 truncate">
                {member.name || member.email.split('@')[0]}
              </h4>
              {isSelf && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
              {isPrimaryOwner ? (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Primary Owner
                </span>
              ) : member.role === 'Admin' ? (
                <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">{member.email}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Key Metadata Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email Card with 1-click Copy */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                Email Address
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-800 font-mono truncate">
              {member.email}
            </p>
          </div>

          {/* Joined Date Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Joined Date & Time
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {formatJoinedDate(member.joinedAt)}
            </p>
          </div>

          {/* Workspace Status Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              Account Status
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                  member.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    member.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span>{member.status === 'pending' ? 'Pending Approval' : 'Active Member'}</span>
              </span>
            </div>
          </div>

          {/* Project Role / Assigned Role - Simple Black Text */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" />
              Project Role
            </span>
            <p className="text-xs font-bold text-slate-900 pt-0.5">
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
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
              Assigned Initiatives & Projects
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              {member.projectsCount || 0} Total
            </span>
          </div>

          {member.projectNames && member.projectNames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {member.projectNames.map((projName, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-800"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">{projName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-400">
                This member is not assigned to any projects currently.
              </p>
            </div>
          )}
        </div>

        {/* 4. Footer Close Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-indigo-600 text-white transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
