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
  UserPlus,
  UserX,
  MoreVertical,
  Pencil,
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
  onUpdateAssignee?: (
    sprintId: string,
    itemId: string,
    assignee: { name: string; email?: string; avatar?: string } | null
  ) => Promise<void>;
  onUpdateDueDate?: (
    sprintId: string,
    itemId: string,
    newDueDate: string | null
  ) => Promise<void>;
}

const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name?: string, avatar?: string): string => {
  if (avatar && avatar.length <= 3) return avatar.toUpperCase();
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

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
  onUpdateAssignee,
  onUpdateDueDate,
}) => {
  const isActive = retro.status === 'active';
  const isCompleted = retro.status === 'completed';

  // Default state: Active sprint is open, Completed sprint is collapsed
  const [isBacklogExpanded, setIsBacklogExpanded] = useState<boolean>(() => isActive);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [openStatusItemId, setOpenStatusItemId] = useState<string | null>(null);
  const [openAssigneeItemId, setOpenAssigneeItemId] = useState<string | null>(null);
  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);

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

  const members = project?.members || [];

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
      if (s.number && retroSprintNum && s.number.toString() === retroSprintNum) return true;
      if (s.retrospectiveId && (s.retrospectiveId === retro.id || s.retrospectiveId === retro.shareToken)) return true;
      if (retro.sprintName && s.name && s.name.toLowerCase().includes(retro.sprintName.toLowerCase())) return true;
      if (retro.title && s.name && (retro.title.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(retro.title.toLowerCase()))) return true;
      return false;
    }) || project.sprints[0];

    const targetSprintId = matchedSprint?.id || project.sprints[0]?.id;

    // Show all committed items of this sprint (TODO, IN PROGRESS, and DONE)
    return {
      committedItems: matchedSprint?.items || [],
      relatedSprintId: targetSprintId,
    };
  }, [project?.sprints, retro]);

  // Progress calculation
  const totalCount = committedItems.length;
  const doneCount = committedItems.filter((it) => it.status === 'done').length;
  const percentComplete = totalCount > 0
    ? Math.round((doneCount / totalCount) * 100)
    : isCompleted ? 100 : 0;

  const handleStatusChange = async (itemId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    setOpenStatusItemId(null);
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

  const handleAssigneeChange = async (
    itemId: string,
    assignee: { name: string; email?: string; avatar?: string } | null
  ) => {
    setOpenAssigneeItemId(null);
    if (!onUpdateAssignee || !relatedSprintId) return;
    setUpdatingItemId(itemId);
    try {
      await onUpdateAssignee(relatedSprintId, itemId, assignee);
    } catch (err) {
      console.error('[RetroCard] Assignee update error:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDueDateChange = async (itemId: string, newDueDate: string | null) => {
    if (!onUpdateDueDate || !relatedSprintId) return;
    setUpdatingItemId(itemId);
    try {
      await onUpdateDueDate(relatedSprintId, itemId, newDueDate);
    } catch (err) {
      console.error('[RetroCard] Due date update error:', err);
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCardMenuOpen((prev) => !prev)}
                  title="More sprint actions"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isCardMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCardMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                        Sprint Actions
                      </div>
                      <div className="py-1 space-y-0.5">
                        <button
                          type="button"
                          disabled={isCompleted}
                          onClick={() => {
                            if (isCompleted) return;
                            setIsCardMenuOpen(false);
                            onEdit(retro);
                          }}
                          title={isCompleted ? 'Completed sprint retrospective cannot be edited' : 'Edit retrospective details'}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                            isCompleted
                              ? 'opacity-40 text-slate-400 dark:text-slate-600 cursor-not-allowed select-none bg-slate-50/50 dark:bg-white/[0.02]'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Edit3 className={`w-3.5 h-3.5 ${isCompleted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-400'}`} />
                            <span>Edit Details</span>
                          </div>
                          {isCompleted && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsCardMenuOpen(false);
                            onDelete(retro);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-t border-slate-100 dark:border-white/[0.08] mt-1 pt-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Retrospective</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
            {Math.max(retro.actionItemsCount || 0, committedItems.length)} Items
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
              const isStatusMenuOpen = openStatusItemId === item.id;
              const isAssigneeMenuOpen = openAssigneeItemId === item.id;

              return (
                <div
                  key={item.id || `item-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        {item.assignee?.name ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold text-[10px]">
                            Assignee: {item.assignee.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 font-medium text-[10px]">
                            Unassigned
                          </span>
                        )}

                        {item.status === 'done' ? (
                          <>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              title={`Completed on ${formatDisplayDate(item.completedAt || (item as any).updatedAt || item.createdAt)}`}
                            >
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Completed: {formatDisplayDate(item.completedAt || (item as any).updatedAt || item.createdAt)}</span>
                            </span>
                            {item.dueDate && (
                              <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 text-[10px]">
                                <Calendar className="w-3 h-3 opacity-60" />
                                <span>Due: {formatDisplayDate(item.dueDate)}</span>
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="relative inline-flex items-center">
                            {isAdminOrManager && onUpdateDueDate ? (
                              <label
                                title="Click to set or change due date"
                                className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 shadow-2xs group/due"
                              >
                                <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{item.dueDate ? `Due: ${formatDisplayDate(item.dueDate)}` : '+ Due Date'}</span>
                                <Pencil className="w-2.5 h-2.5 opacity-60 group-hover/due:opacity-100 transition-opacity ml-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <input
                                  type="date"
                                  value={item.dueDate ? item.dueDate.split('T')[0] : ''}
                                  onChange={(e) => {
                                    handleDueDateChange(item.id, e.target.value || null);
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </label>
                            ) : item.dueDate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]">
                                <Calendar className="w-3 h-3 opacity-60" />
                                <span>Due: {formatDisplayDate(item.dueDate)}</span>
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status Dropdown & Circular Avatar */}
                  <div className="shrink-0 flex items-center gap-2.5">
                    {isItemUpdating && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#88c958]" />
                    )}

                    {/* Status Dropdown Menu (Styled exactly as in the user screenshot) */}
                    <div className="relative">
                      {isAdminOrManager ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenAssigneeItemId(null);
                            setOpenStatusItemId((prev) => (prev === item.id ? null : item.id));
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs ${
                            item.status === 'done'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/90'
                              : item.status === 'in_progress'
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 hover:bg-sky-100/90'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100/90'
                          }`}
                        >
                          <span>
                            {item.status === 'done'
                              ? 'Done'
                              : item.status === 'in_progress'
                              ? 'In Progress'
                              : 'To Do'}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
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

                      {/* Floating Status Dropdown Popup */}
                      {isStatusMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenStatusItemId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                              Update Status
                            </div>
                            <div className="py-1 space-y-0.5">
                              {[
                                { id: 'todo', label: 'To Do' },
                                { id: 'in_progress', label: 'In Progress' },
                                { id: 'done', label: 'Done' },
                              ].map((opt) => {
                                const isCurrent = (item.status || 'todo') === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        item.id,
                                        opt.id as 'todo' | 'in_progress' | 'done'
                                      )
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      isCurrent
                                        ? 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958]'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isCurrent && (
                                      <Check className="w-3.5 h-3.5 text-[#3d8318] dark:text-[#88c958] stroke-[2.5]" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Circular Avatar / Initials on Right Side (with reassign / unassign popup) */}
                    <div className="relative">
                      {isAdminOrManager ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenStatusItemId(null);
                            setOpenAssigneeItemId((prev) => (prev === item.id ? null : item.id));
                          }}
                          title={
                            item.assignee?.name
                              ? `Assigned to: ${item.assignee.name}\nClick to reassign or unassign`
                              : 'Click to assign task to team member'
                          }
                          className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-[#88c958]/80 transition-all cursor-pointer select-none"
                        >
                          {item.assignee?.name ? (
                            <div className="flex items-center -space-x-2">
                              {/* If manager/givenBy exists, show overlapping circle like M AD */}
                              {item.givenBy && item.givenBy !== item.assignee.name && (
                                <div className="w-7 h-7 rounded-full bg-[#488e1e] text-white dark:bg-[#72ad46] dark:text-[#08090a] text-[10px] font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs">
                                  {getInitials(item.givenBy)}
                                </div>
                              )}
                              <div className="w-7 h-7 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[10px] font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs">
                                {getInitials(item.assignee.name, item.assignee.avatar)}
                              </div>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 hover:border-[#88c958] hover:text-[#88c958] flex items-center justify-center text-xs font-bold transition-colors">
                              <UserPlus className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      ) : (
                        item.assignee?.name && (
                          <div
                            className="w-7 h-7 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[10px] font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs select-none"
                            title={`Assigned to: ${item.assignee.name}`}
                          >
                            {getInitials(item.assignee.name, item.assignee.avatar)}
                          </div>
                        )
                      )}

                      {/* Floating Assignee Dropdown Popup */}
                      {isAssigneeMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenAssigneeItemId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-56 max-h-64 overflow-y-auto bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                              Assign Member
                            </div>
                            <div className="py-1 space-y-0.5">
                              {members.map((member) => {
                                const isSelected =
                                  item.assignee?.name?.toLowerCase().trim() ===
                                  member.name?.toLowerCase().trim();
                                return (
                                  <button
                                    key={member.id || member.email || member.name}
                                    type="button"
                                    onClick={() =>
                                      handleAssigneeChange(item.id, {
                                        name: member.name,
                                        email: member.email,
                                        avatar: member.avatar,
                                      })
                                    }
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] font-bold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-5 h-5 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[9px] font-black flex items-center justify-center shrink-0">
                                        {getInitials(member.name, member.avatar)}
                                      </div>
                                      <span className="truncate">{member.name}</span>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}

                              {/* Unassign Task Button (Removes task assignment) */}
                              {item.assignee?.name && (
                                <button
                                  type="button"
                                  onClick={() => handleAssigneeChange(item.id, null)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border-t border-slate-100 dark:border-white/[0.08] mt-1 pt-1.5 cursor-pointer font-bold"
                                >
                                  <UserX className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                  <span>Unassign task</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#12151c]/60 border border-dashed border-slate-200 dark:border-white/[0.06] text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                No action items committed to sprint backlog yet. When manager assigns items, they will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetroCard;
