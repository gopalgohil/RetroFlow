'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowUpRight,
  Share2,
  Check,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Project, ProjectRetroLink, BacklogItem } from '@/types/project';
import { formatRetroDateRange } from '@/lib/dateUtils';

export interface RetroCardProps {
  retro: ProjectRetroLink;
  project?: Project;
  canManageProject: boolean;
  canMarkDone?: boolean;
  currentUser?: any;
  isCopied: boolean;
  onShare: (retro: ProjectRetroLink) => void;
  onEdit: (retro: ProjectRetroLink) => void;
  onDelete: (retro: ProjectRetroLink) => void;
  onUpdateItemStatus?: (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => Promise<void>;
}

export const RetroCard: React.FC<RetroCardProps> = ({
  retro,
  project,
  canManageProject,
  canMarkDone = false,
  currentUser = null,
  isCopied,
  onShare,
  onEdit,
  onDelete,
  onUpdateItemStatus,
}) => {
  const isActive = retro.status === 'active';

  const dateDisplay = formatRetroDateRange(
    retro.startDate,
    retro.endDate,
    retro.scheduledDate || (retro as any).createdAt
  );

  // Find all items linked to this retro across all sprints or matching sprint
  const committedItems: BacklogItem[] = React.useMemo(() => {
    if (!project?.sprints) return [];

    // Extract sprint number e.g. "1" from "Sprint 1 Retrospective"
    const retroSprintNum =
      (retro.title || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1] ||
      (retro.sprintName || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1];

    const allItems: BacklogItem[] = [];
    const seenIds = new Set<string>();

    for (const sprint of project.sprints) {
      const sprintNum = (sprint.name || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1];
      const isRelatedSprint =
        (retroSprintNum && sprintNum && retroSprintNum === sprintNum) ||
        (sprint.retrospectiveId && (sprint.retrospectiveId === retro.id || sprint.retrospectiveId === retro.shareToken)) ||
        (retro.sprintName && sprint.name && sprint.name.toLowerCase().includes(retro.sprintName.toLowerCase())) ||
        (retro.title && sprint.name && (retro.title.toLowerCase().includes(sprint.name.toLowerCase()) || sprint.name.toLowerCase().includes(retro.title.toLowerCase())));

      for (const item of sprint.items || []) {
        const itemMatchesRetro =
          (item.sourceRetroId && (item.sourceRetroId === retro.id || item.sourceRetroId === retro.shareToken)) ||
          (item.sourceRetroTitle && retro.title && item.sourceRetroTitle.toLowerCase().trim() === retro.title.toLowerCase().trim());

        if (itemMatchesRetro || isRelatedSprint) {
          const key = item.id || item.title;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            allItems.push(item);
          }
        }
      }
    }

    return allItems;
  }, [project?.sprints, retro]);

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:border-[#88c958]/60 dark:hover:border-[#88c958]/60 transition-all space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isActive
                  ? 'bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? 'bg-[#88c958] animate-pulse shadow-[0_0_6px_rgba(136,201,88,0.8)]'
                    : 'bg-slate-400'
                }`}
              />
              {retro.status === 'completed' ? 'COMPLETED' : (retro.status || 'ACTIVE')}
            </span>

            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
              {retro.title}
            </h4>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {dateDisplay}
            </span>
            <span>•</span>
            <span className={retro.status === 'completed' ? 'text-slate-500 dark:text-slate-400' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
              {retro.status === 'completed' ? 'Sprint cycle closed' : 'Sprint cycle active'}
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/retro/${retro.shareToken}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer bg-[#5cb028] hover:bg-[#4e9921] text-white dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/20"
          >
            <span>Open Board</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {canManageProject && (
            <button
              type="button"
              onClick={() => onShare(retro)}
              title="Share or Invite Teammates"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[#88c958]/10 dark:bg-[#88c958]/15 hover:bg-[#88c958]/20 dark:hover:bg-[#88c958]/25 text-[#3d8318] dark:text-[#88c958] border-[#88c958]/30 dark:border-[#88c958]/40 hover:border-[#88c958]/60 shadow-2xs whitespace-nowrap"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                  <span>Share / Invite</span>
                </>
              )}
            </button>
          )}

          {canManageProject && (
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => onEdit(retro)}
                title="Edit Retrospective Details"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(retro)}
                title="Delete Retrospective"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Topics</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {retro.topicsCount || 3} Columns
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Feedback Thoughts</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {retro.cardsCount || 0} Cards
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#88c958]/10 dark:bg-[#88c958]/15 border border-[#88c958]/30 text-center">
          <span className="text-[10px] text-[#3d8318] dark:text-[#88c958] uppercase font-bold block">Action Items</span>
          <span className="text-xs font-black text-[#3d8318] dark:text-[#88c958]">
            {committedItems.length > 0
              ? `${committedItems.length} Assigned to Backlog`
              : `${retro.actionItemsCount || 0} Items`}
          </span>
        </div>
      </div>

      {/* Committed Deliverables Backlog Section */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>📋</span> Sprint Backlog & Committed Deliverables (Only Assigned Items)
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {committedItems.length} Item{committedItems.length === 1 ? '' : 's'} committed
          </span>
        </div>

        {committedItems.length > 0 ? (
          <div className="space-y-2">
            {committedItems.map((item, idx) => (
              <div
                key={item.id || `item-${idx}`}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      {item.assignee?.name && (
                        <span className="px-1.5 py-0.2 rounded bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold">
                          Assignee: {item.assignee.name}
                        </span>
                      )}
                      {item.dueDate && (
                        <>
                          <span>•</span>
                          <span>Due: {item.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'done'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : item.status === 'in_progress'
                        ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {item.status === 'done' ? 'DONE' : item.status === 'in_progress' ? 'IN PROGRESS' : 'TO DO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-[#12151c]/60 border border-dashed border-slate-200 dark:border-white/[0.06] text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              No action items committed to sprint backlog yet. When the manager assigns action items, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroCard;
