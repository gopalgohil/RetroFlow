'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Check, ChevronDown, ChevronUp, Pencil, RotateCcw, Trash2, MoreVertical, Play } from 'lucide-react';
import { Sprint } from '@/types/project';
import { StatusPill, ProgressBar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';
import { SprintBacklogDrawer } from './SprintBacklogDrawer';

export interface SprintCardProps {
  projectId: string;
  sprint: Sprint;
  isExpanded: boolean;
  projectManagerName?: string;
  canManageProject: boolean;
  canMarkDone?: boolean;
  currentUser?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  members?: Array<{ id?: string; name: string; email?: string; avatar?: string; role?: string }>;
  canDeleteSprint?: boolean;
  updatingItemId: string | null;
  deletingItemId?: string | null;
  onToggleExpand: (sprintId: string) => void;
  onCompleteSprint: (sprint: Sprint) => void;
  onStartSprint?: (sprint: Sprint) => void;
  onReopenSprint?: (sprint: Sprint) => void;
  onEditDates: (sprint: Sprint) => void;
  onDeleteSprint?: (sprint: Sprint) => void;
  onUpdateItemStatus: (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => Promise<void>;
  onUpdateDueDate?: (
    sprintId: string,
    itemId: string,
    newDueDate: string | null
  ) => Promise<void> | void;
  onUpdateAssignee?: (
    sprintId: string,
    itemId: string,
    assignee: { name: string; email?: string; avatar?: string } | null
  ) => Promise<void> | void;
  onDeleteItem?: (sprintId: string, itemId: string) => Promise<void> | void;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  projectId,
  sprint,
  isExpanded,
  projectManagerName,
  canManageProject,
  canMarkDone = false,
  currentUser = null,
  members = [],
  canDeleteSprint = false,
  updatingItemId,
  deletingItemId = null,
  onToggleExpand,
  onCompleteSprint,
  onStartSprint,
  onReopenSprint,
  onEditDates,
  onDeleteSprint,
  onUpdateItemStatus,
  onUpdateDueDate,
  onUpdateAssignee,
  onDeleteItem,
}) => {
  const percentComplete = Math.round(
    ((sprint.completedStoryPoints || 0) / (sprint.totalStoryPoints || 1)) * 100
  );

  const now = new Date();
  const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
  const sprintEnd = sprint.endDate ? new Date(sprint.endDate) : null;

  const totalSprintDays = sprintStart && sprintEnd
    ? Math.max(
        1,
        Math.ceil(
          (sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 14;

  const rawRemaining = sprintEnd
    ? Math.ceil((sprintEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const sprintTimeLabel = React.useMemo(() => {
    if (sprint.status === 'completed') return null;
    if (sprint.status === 'upcoming') {
      return `${totalSprintDays} days duration`;
    }
    // Active sprint
    if (rawRemaining <= 0) {
      return 'Ends today';
    }
    const daysRemaining = Math.max(1, Math.min(totalSprintDays, rawRemaining));
    return `${daysRemaining} days remaining`;
  }, [sprint.status, rawRemaining, totalSprintDays]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 shadow-xs bg-white dark:bg-[#0e1015] ${
        sprint.status === 'active'
          ? 'border-[#88c958] dark:border-[#88c958]/60 ring-2 ring-[#88c958]/10'
          : 'border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
      }`}
    >
      <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
              sprint.status === 'active'
                ? 'bg-[#88c958] text-[#08090a]'
                : sprint.status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-100 dark:bg-[#141720] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            {sprint.number}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {sprint.name}
              </h4>
              {sprint.status !== 'active' && <StatusPill status={sprint.status} />}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl line-clamp-1">
              {sprint.goal || 'Sprint deliverables and retrospective action items.'}
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#12151c] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/[0.06]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {formatDateDMY(sprint.startDate)} – {formatDateDMY(sprint.endDate)}
                </span>
                {canManageProject && (
                  <button
                    type="button"
                    onClick={() => onEditDates(sprint)}
                    className="ml-1 p-0.5 text-slate-400 hover:text-[#88c958] dark:hover:text-[#88c958] rounded transition-colors cursor-pointer"
                    title="Edit sprint dates"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {sprintTimeLabel && (
                <span
                  className={`flex items-center gap-1 font-medium ${
                    sprint.status === 'active'
                      ? 'text-[#88c958]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {sprintTimeLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 self-end lg:self-center w-full lg:w-auto justify-between lg:justify-end">
          <div className="w-full sm:w-48 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {percentComplete}% complete
              </span>
            </div>
            <ProgressBar
              value={percentComplete}
              variant={sprint.status === 'active' ? 'emerald' : 'gradient'}
            />
          </div>

          <div className="flex items-center gap-2">
            {canManageProject && sprint.status === 'active' && (
              <button
                type="button"
                onClick={() => onCompleteSprint(sprint)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Complete and finish active tracking for this sprint"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Sprint</span>
              </button>
            )}

            {canManageProject && sprint.status === 'upcoming' && (
              <button
                type="button"
                onClick={() => (onStartSprint ? onStartSprint(sprint) : onReopenSprint?.(sprint))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4d9720] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Start this sprint and begin execution"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Sprint</span>
              </button>
            )}

            {sprint.status === 'completed' && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  <Check className="w-3 h-3" />
                  <span>Finished</span>
                </span>
                {canManageProject && onReopenSprint && (
                  <button
                    type="button"
                    onClick={() => onReopenSprint(sprint)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#88c958]/60 hover:bg-[#88c958]/15 dark:hover:bg-[#88c958]/20 text-slate-600 dark:text-slate-300 hover:text-[#88c958] text-xs font-semibold transition-colors cursor-pointer"
                    title="Reopen or reactivate this sprint"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen</span>
                  </button>
                )}
              </div>
            )}

            {canManageProject && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                  title="Sprint options"
                  aria-label="Sprint options"
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEditDates(sprint);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Dates</span>
                    </button>

                    {onDeleteSprint && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDeleteSprint(sprint);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Sprint</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleExpand(sprint.id)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse backlog' : 'Expand backlog items'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <SprintBacklogDrawer
          projectId={projectId}
          sprint={sprint}
          projectManagerName={projectManagerName}
          updatingItemId={updatingItemId}
          deletingItemId={deletingItemId}
          canManageProject={canManageProject}
          canMarkDone={canMarkDone}
          currentUser={currentUser}
          members={members}
          onUpdateItemStatus={onUpdateItemStatus}
          onUpdateDueDate={onUpdateDueDate}
          onUpdateAssignee={onUpdateAssignee}
          onDeleteItem={onDeleteItem}
        />
      )}
    </div>
  );
};

export default SprintCard;
