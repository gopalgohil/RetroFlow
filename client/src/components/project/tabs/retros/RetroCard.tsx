'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowUpRight,
  Share2,
  Check,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
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
  const isCompleted = retro.status === 'completed';

  // Default state: Active sprint is open, Completed sprint is collapsed
  const [isBacklogExpanded, setIsBacklogExpanded] = useState<boolean>(() => isActive);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const dateDisplay = formatRetroDateRange(
    retro.startDate,
    retro.endDate,
    retro.scheduledDate || (retro as any).createdAt
  );

  const isAdminOrManager = Boolean(
    canManageProject ||
    canMarkDone ||
    currentUser?.role?.toLowerCase() === 'admin' ||
    currentUser?.role?.toLowerCase() === 'manager' ||
    currentUser?.projectRole?.toLowerCase() === 'manager'
  );

  // Sprint rollover & scoping logic
  const { committedItems, relatedSprintId } = useMemo(() => {
    if (!project?.sprints || project.sprints.length === 0) {
      return { committedItems: [], relatedSprintId: null };
    }

    const retroSprintNum =
      (retro.title || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1] ||
      (retro.sprintName || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1];

    // Find the sprint matching this retro
    const matchedSprint = project.sprints.find((s) => {
      const sNum = (s.name || '').match(/\b(?:sprint|cycle)\s*(\d+)\b/i)?.[1];
      if (retroSprintNum && sNum && retroSprintNum === sNum) return true;
      if (s.retrospectiveId && (s.retrospectiveId === retro.id || s.retrospectiveId === retro.shareToken)) return true;
      if (retro.sprintName && s.name && s.name.toLowerCase().includes(retro.sprintName.toLowerCase())) return true;
      if (retro.title && s.name && (retro.title.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(retro.title.toLowerCase()))) return true;
      return false;
    }) || project.sprints[0];

    const targetSprintId = matchedSprint?.id || project.sprints[0]?.id;

    // Rollover separation:
    // If completed: show DONE tasks
    // If active: show TO DO and IN PROGRESS tasks
    const allAssigned = (matchedSprint?.items || []).filter((item) => {
      return Boolean(item.assignee?.name || item.assignee?.email);
    });

    if (isCompleted) {
      // Completed retro shows DONE tasks (historical completion record)
      const doneItems = allAssigned.filter((it) => it.status === 'done');
      return {
        committedItems: doneItems,
        relatedSprintId: targetSprintId,
      };
    } else {
      // Active retro shows in-progress & to-do tasks (current sprint backlog)
      // plus any tasks done in the current active sprint
      const activeItems = allAssigned.filter((it) => it.status !== 'done' || matchedSprint?.status === 'active');
      return {
        committedItems: activeItems,
        relatedSprintId: targetSprintId,
      };
    }
  }, [project?.sprints, retro, isCompleted]);

  // Progress calculation
  const totalCount = committedItems.length;
  const doneCount = committedItems.filter((it) => it.status === 'done').length;
  const percentComplete = totalCount > 0
    ? Math.round((doneCount / totalCount) * 100)
    : isCompleted ? 100 : 0;

  const handleStatusChange = async (itemId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    if (!onUpdateItemStatus || !relatedSprintId) return;
    setUpdatingItemId(itemId);
    try {
      await onUpdateItemStatus(relatedSprintId, itemId, newStatus);
    } catch (err) {
      console.error('[RetroCard] Status update error:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div
      className={`w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border transition-all space-y-4 shadow-xs ${
        isActive
          ? 'border-[#88c958] dark:border-[#88c958]/60 ring-2 ring-[#88c958]/10'
          : 'border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
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
              {isCompleted ? 'COMPLETED' : (retro.status || 'ACTIVE')}
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
            <span className={isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
              {isCompleted ? 'Sprint cycle closed' : 'Sprint cycle active'}
            </span>
          </p>
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shrink-0">
          {/* Progress Bar */}
          <div className="w-full sm:w-44 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Progress</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {percentComplete}% complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  percentComplete === 100
                    ? 'bg-emerald-500'
                    : 'bg-[#5cb028] dark:bg-[#88c958]'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
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

      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsBacklogExpanded((prev) => !prev)}
        className="w-full pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs cursor-pointer group hover:opacity-90 transition-opacity"
      >
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>📋</span>
          <span>Sprint Backlog & Committed Deliverables</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400">
            {committedItems.length}
          </span>
        </span>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3d8318] dark:text-[#88c958]">
          <span>
            {isBacklogExpanded
              ? 'Hide Backlog Items'
              : `View Backlog Items (${committedItems.length})`}
          </span>
          {isBacklogExpanded ? (
            <ChevronUp className="w-4 h-4 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform" />
          )}
        </div>
      </button>

      {/* Accordion Content (Collapsible) */}
      {isBacklogExpanded && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
          {committedItems.length > 0 ? (
            committedItems.map((item, idx) => {
              const isItemUpdating = updatingItemId === item.id;
              return (
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

                  {/* Status Dropdown (Admin/Manager) or Read-Only Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isItemUpdating && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#88c958]" />
                    )}

                    {isAdminOrManager ? (
                      <div className="relative inline-block">
                        <select
                          value={item.status || 'todo'}
                          disabled={isItemUpdating}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as 'todo' | 'in_progress' | 'done'
                            )
                          }
                          title="Click to update task status (TODO ➔ IN PROGRESS ➔ DONE)"
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 ${
                            item.status === 'done'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/90'
                              : item.status === 'in_progress'
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 hover:bg-sky-100/90'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100/90'
                          }`}
                        >
                          <option
                            value="todo"
                            className="text-slate-800 dark:text-slate-200 bg-white dark:bg-[#0e1015] font-bold py-1"
                          >
                            ○ TO DO
                          </option>
                          <option
                            value="in_progress"
                            className="text-sky-700 dark:text-sky-400 bg-white dark:bg-[#0e1015] font-bold py-1"
                          >
                            ◑ IN PROGRESS
                          </option>
                          <option
                            value="done"
                            className="text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#0e1015] font-bold py-1"
                          >
                            ● DONE
                          </option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDown className="w-3 h-3 opacity-60 text-current" />
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'done'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : item.status === 'in_progress'
                            ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        {item.status === 'done'
                          ? 'DONE'
                          : item.status === 'in_progress'
                          ? 'IN PROGRESS'
                          : 'TO DO'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#12151c]/60 border border-dashed border-slate-200 dark:border-white/[0.06] text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {isCompleted
                  ? 'No completed deliverables recorded for this sprint.'
                  : 'No action items committed to sprint backlog yet. When manager assigns items, they will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetroCard;
