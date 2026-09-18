'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  FolderKanban,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { EnrichedActionItem } from '@/types/project';

interface ActionItemCardProps {
  item: EnrichedActionItem;
  displayIndex?: number;
  isUpdating: boolean;
  onStatusChange: (item: EnrichedActionItem, status: 'todo' | 'in_progress' | 'done') => void;
  onCycleStatus?: (item: EnrichedActionItem) => void;
}

const PRIORITY_CONFIG: Record<
  string,
  { label: string; dot: string; pill: string }
> = {
  critical: {
    label: 'Critical',
    dot: 'bg-rose-500',
    pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/40',
  },
  high: {
    label: 'High',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40',
  },
  low: {
    label: 'Low',
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400 border-slate-200/80 dark:border-white/[0.08]',
  },
};

export const ActionItemCard: React.FC<ActionItemCardProps> = React.memo(({
  item,
  displayIndex,
  isUpdating,
  onStatusChange,
  onCycleStatus,
}) => {
  const isDone = item.status === 'done';
  const isInProgress = item.status === 'in_progress';

  // Calculate Due Date Urgency
  const urgency = React.useMemo(() => {
    if (!item.dueDate) return null;
    if (isDone) {
      return {
        label: 'Completed',
        className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/30',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.dueDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: `Overdue (${daysAgo}d)`,
        className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 font-bold',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays}d`,
        className: 'text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/30',
      };
    }
    return {
      label: new Date(item.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      className: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.06]',
    };
  }, [item.dueDate, isDone]);

  const priorityMeta = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;

  return (
    <div
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDone
          ? 'bg-slate-50/60 dark:bg-[#0e1015]/50 border-slate-200/60 dark:border-white/[0.04] opacity-75 hover:opacity-100'
          : urgency?.isOverdue
          ? 'bg-rose-50/15 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/40 shadow-xs hover:shadow-md'
          : 'bg-white dark:bg-[#0e1015] border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-[#88c958]/50 dark:hover:border-[#88c958]/40'
      }`}
    >
      {/* Left: Task Action Index & Content */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Item Sequence Number Badge */}
        {typeof displayIndex === 'number' && (
          <div
            className={`mt-0.5 min-w-[28px] h-7 px-1.5 rounded-xl text-xs font-black flex items-center justify-center shrink-0 border select-none transition-all ${
              isDone
                ? 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30'
                : isInProgress
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30'
                : 'bg-slate-100 dark:bg-[#12151c] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            {displayIndex}
          </div>
        )}

        {/* Task Title, Priority & Clean Sub-row */}
        <div className="space-y-2 flex-1 min-w-0">
          {/* Main Task Row */}
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-bold tracking-tight transition-all cursor-pointer ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                  : 'text-slate-900 dark:text-slate-100 group-hover:text-[#3d8318] dark:group-hover:text-[#88c958]'
              }`}
              onClick={() => onCycleStatus?.(item)}
            >
              {item.title}
            </h4>

            {/* Clean Priority Pill with colored dot */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border leading-none shrink-0 ${priorityMeta.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
              <span>{priorityMeta.label}</span>
            </span>
          </div>

          {/* Optional Custom Description */}
          {item.description && !item.description.startsWith('Action item originated from Retrospective') && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Clean Sub-Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {/* Project Pill */}
            {item.projectKey && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]">
                <FolderKanban className="w-3 h-3 text-slate-400" />
                <span>{item.projectKey}</span>
              </span>
            )}

            {/* Origin Retro Link */}
            {item.sourceRetroTitle && (
              item.sourceRetroShareToken ? (
                <Link
                  href={`/retro/${item.sourceRetroShareToken}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3d8318] dark:text-[#88c958] hover:underline transition-colors max-w-[240px] truncate"
                  title="Go to retrospective board"
                >
                  <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                  <span className="truncate">{item.sourceRetroTitle}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3d8318] dark:text-[#88c958] max-w-[240px] truncate">
                  <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                  <span className="truncate">{item.sourceRetroTitle}</span>
                </span>
              )
            )}

            {/* Due Date Badge */}
            {urgency && (
              <>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border font-medium ${urgency.className}`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{urgency.label}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Status Dropdown & Assignee */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.08] shrink-0">
        <div className="relative">
          <select
            value={item.status}
            disabled={isUpdating}
            onChange={(e) =>
              onStatusChange(
                item,
                e.target.value as 'todo' | 'in_progress' | 'done'
              )
            }
            className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDone
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                : isInProgress
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-950/60'
                : 'bg-slate-50 dark:bg-[#12151c] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#181b24]'
            }`}
          >
            <option value="todo" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">To Do</option>
            <option value="in_progress" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">In Progress</option>
            <option value="done" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">Done</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {item.assignee?.name && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300"
            title={`Assigned to ${item.assignee.name}`}
          >
            <div className="w-5 h-5 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[10px] font-bold flex items-center justify-center shrink-0">
              {item.assignee.avatar ||
                item.assignee.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-semibold text-[11px] truncate max-w-[90px]">
              {item.assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ActionItemCard.displayName = 'ActionItemCard';

