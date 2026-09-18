'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  Calendar,
  Sparkles,
  FolderKanban,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { EnrichedActionItem } from '@/types/project';

interface ActionItemCardProps {
  item: EnrichedActionItem;
  isUpdating: boolean;
  onStatusChange: (item: EnrichedActionItem, status: 'todo' | 'in_progress' | 'done') => void;
  onCycleStatus: (item: EnrichedActionItem) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
  high: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  medium: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  low: 'bg-slate-100 dark:bg-[#12151c] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]',
};

export const ActionItemCard: React.FC<ActionItemCardProps> = React.memo(({
  item,
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
      return { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.dueDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: `Overdue by ${daysAgo} day${daysAgo !== 1 ? 's' : ''}`,
        color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 font-bold',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30',
      };
    }
    return {
      label: new Date(item.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#12151c] border-slate-200 dark:border-white/[0.08]',
    };
  }, [item.dueDate, isDone]);

  return (
    <div
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDone
          ? 'bg-slate-50/70 dark:bg-[#0e1015]/60 border-slate-200/60 dark:border-white/[0.05] opacity-75 hover:opacity-100'
          : urgency?.isOverdue
          ? 'bg-rose-50/20 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-500/30 shadow-xs hover:shadow-md'
          : 'bg-white dark:bg-[#0e1015] border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/[0.18]'
      }`}
    >
      {/* Left: Interactive Checkbox Circle & Item Details */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onCycleStatus(item)}
          disabled={isUpdating}
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone
              ? 'bg-[#5cb028] border-[#5cb028] text-white dark:bg-[#88c958] dark:border-[#88c958] dark:text-[#08090a]'
              : isInProgress
              ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40'
              : 'border-slate-300 dark:border-white/20 hover:border-[#88c958] dark:hover:border-[#88c958] hover:bg-[#eaf5e3]/40 dark:hover:bg-[#88c958]/10 text-transparent'
          }`}
          title={
            isDone
              ? 'Mark as To Do'
              : isInProgress
              ? 'Mark as Completed'
              : 'Mark as In Progress'
          }
        >
          {isDone ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : isInProgress ? (
            <div className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
          ) : (
            <Check className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Content & Metadata */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-bold tracking-tight transition-all ${
                isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {item.title}
            </h4>

            {/* Priority Tag */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border leading-none ${
                PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium
              }`}
            >
              {item.priority || 'medium'}
            </span>
          </div>

          {item.description && !item.description.startsWith('Action item originated from Retrospective') && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Context Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {item.projectKey && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                <FolderKanban className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>{item.projectKey}</span>
              </span>
            )}

            {item.sourceRetroTitle && (
              item.sourceRetroShareToken ? (
                <Link
                  href={`/retro/${item.sourceRetroShareToken}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] hover:bg-[#def0d4] dark:hover:bg-[#88c958]/25 border border-[#cdeac0] dark:border-[#88c958]/30 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958]" />
                  <span className="truncate max-w-[200px]">{item.sourceRetroTitle}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30">
                  <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958]" />
                  <span className="truncate max-w-[200px]">{item.sourceRetroTitle}</span>
                </span>
              )
            )}

            {urgency && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${urgency.color}`}
              >
                <Calendar className="w-3 h-3" />
                <span>{urgency.label}</span>
              </span>
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
