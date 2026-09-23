'use client';

import React from 'react';
import { Calendar, Clock, Play, Check, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Sprint } from '@/types/project';
import { StatusPill, ProgressBar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';
import { SprintBacklogDrawer } from './SprintBacklogDrawer';

export interface SprintCardProps {
  projectId: string;
  sprint: Sprint;
  isExpanded: boolean;
  canManageProject: boolean;
  updatingItemId: string | null;
  deletingItemId?: string | null;
  onToggleExpand: (sprintId: string) => void;
  onStartSprint: (sprint: Sprint) => void;
  onCompleteSprint: (sprint: Sprint) => void;
  onEditDates: (sprint: Sprint) => void;
  onUpdateItemStatus: (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => Promise<void>;
  onDeleteItem?: (sprintId: string, itemId: string) => Promise<void> | void;
}

/**
 * SprintCard:
 * Self-contained Sprint Header card with progress metrics, action buttons,
 * and integrated expandable Backlog items drawer.
 */
export const SprintCard: React.FC<SprintCardProps> = ({
  projectId,
  sprint,
  isExpanded,
  canManageProject,
  updatingItemId,
  deletingItemId = null,
  onToggleExpand,
  onStartSprint,
  onCompleteSprint,
  onEditDates,
  onUpdateItemStatus,
  onDeleteItem,
}) => {
  const percentComplete = Math.round(
    ((sprint.completedStoryPoints || 0) / (sprint.totalStoryPoints || 1)) * 100
  );

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs bg-white dark:bg-[#0e1015] ${
        sprint.status === 'active'
          ? 'border-[#88c958] dark:border-[#88c958]/60 ring-2 ring-[#88c958]/10'
          : 'border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
      }`}
    >
      {/* Sprint Summary Header */}
      <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Number Badge */}
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
              <StatusPill status={sprint.status} />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl line-clamp-1">
              {sprint.goal || 'Sprint deliverables and retrospective action items.'}
            </p>

            {/* Dates and Countdown with Edit Action */}
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
                    title="Edit sprint dates & goal"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {sprint.status === 'active' && (
                <span className="flex items-center gap-1 text-[#88c958] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {daysRemaining} days remaining
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Progress Bar + Sprint Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 self-end lg:self-center w-full lg:w-auto justify-between lg:justify-end">
          {/* Story Points Progress */}
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

          {/* Actions: Start / Complete & Expand Drawer Toggle */}
          <div className="flex items-center gap-2">
            {canManageProject && sprint.status === 'active' && (
              <button
                type="button"
                onClick={() => onCompleteSprint(sprint)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Sprint</span>
              </button>
            )}

            {canManageProject && sprint.status === 'upcoming' && (
              <button
                type="button"
                onClick={() => onStartSprint(sprint)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#88c958] hover:bg-[#76b349] text-[#08090a] text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Sprint</span>
              </button>
            )}

            {sprint.status === 'completed' && (
              <button
                type="button"
                onClick={() => onStartSprint(sprint)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#88c958]/60 hover:bg-[#88c958]/15 dark:hover:bg-[#88c958]/20 text-slate-600 dark:text-slate-300 hover:text-[#88c958] text-xs font-semibold transition-colors cursor-pointer"
                title="Resume or reactivate this sprint"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Reopen</span>
              </button>
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

      {/* Backlog Items Drawer */}
      {isExpanded && (
        <SprintBacklogDrawer
          projectId={projectId}
          sprint={sprint}
          updatingItemId={updatingItemId}
          deletingItemId={deletingItemId}
          canManageProject={canManageProject}
          onUpdateItemStatus={onUpdateItemStatus}
          onDeleteItem={onDeleteItem}
        />
      )}
    </div>
  );
};

export default SprintCard;
