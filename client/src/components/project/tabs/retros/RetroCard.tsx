'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Share2,
  Check,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ProjectRetroLink } from '@/types/project';
import { StatusPill } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';

export interface RetroCardProps {
  retro: ProjectRetroLink;
  canManageProject: boolean;
  isCopied: boolean;
  onShare: (retro: ProjectRetroLink) => void;
  onEdit: (retro: ProjectRetroLink) => void;
  onDelete: (retro: ProjectRetroLink) => void;
}

/**
 * RetroCard:
 * Card item for an individual retrospective session with live stats and action buttons.
 */
export const RetroCard: React.FC<RetroCardProps> = ({
  retro,
  canManageProject,
  isCopied,
  onShare,
  onEdit,
  onDelete,
}) => {
  const isActive = retro.status === 'active';

  return (
    <div className="group p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:border-[#88c958]/60 dark:hover:border-[#88c958]/60 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Status & Sprint Badge & Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusPill status={retro.status} pulse={isActive} />

            {retro.sprintName && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#88c958]/15 text-[#88c958] border border-[#88c958]/30">
                {retro.sprintName}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            {formatDateDMY(retro.scheduledDate)}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          {retro.title}
        </h4>

        {/* Stats Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Topics</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {retro.topicsCount || 3} Columns
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Thoughts</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {retro.cardsCount || 0} Cards
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#88c958]/10 dark:bg-[#88c958]/15 border border-[#88c958]/30 text-center">
            <span className="text-[10px] text-[#88c958] block">Action Items</span>
            <span className="text-xs font-bold text-[#88c958]">
              {retro.actionItemsCount || 0} Items
            </span>
          </div>
        </div>

        {/* Export Link Status */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          {retro.actionItemsExported ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Action items exported into sprint backlog
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Pending export to next sprint backlog
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        {/* Left: Launch Board + Share / Invite */}
        <div className="flex items-center gap-2">
          <Link
            href={`/retro/${retro.shareToken}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isActive
                ? 'bg-[#5cb028] hover:bg-[#4e9921] text-white shadow-xs dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/20'
                : 'bg-slate-900 dark:bg-[#141720] hover:bg-slate-800 dark:hover:bg-white/[0.08] text-white'
            }`}
          >
            <span>Open Board</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          {canManageProject && (
            <button
              type="button"
              onClick={() => onShare(retro)}
              title="Share or Invite Teammates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[#88c958]/10 dark:bg-[#88c958]/15 hover:bg-[#88c958]/20 dark:hover:bg-[#88c958]/25 text-[#88c958] border-[#88c958]/30 dark:border-[#88c958]/40 hover:border-[#88c958]/60 shadow-2xs"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#88c958]" />
                  <span>Share / Invite</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Quick Action Buttons (Admin & Project Leads only) */}
        {canManageProject && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(retro)}
              title="Edit Retrospective Details"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(retro)}
              title="Delete Retrospective"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroCard;
