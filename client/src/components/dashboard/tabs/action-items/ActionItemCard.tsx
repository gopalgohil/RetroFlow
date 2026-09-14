'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  Calendar,
  Sparkles,
  FolderKanban,
  Layers,
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
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
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
      return { label: 'Completed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
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
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'text-amber-700 bg-amber-50 border-amber-200 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        color: 'text-amber-600 bg-amber-50/70 border-amber-200',
      };
    }
    return {
      label: new Date(item.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      color: 'text-slate-600 bg-slate-100 border-slate-200',
    };
  }, [item.dueDate, isDone]);

  return (
    <div
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDone
          ? 'bg-slate-50/70 border-slate-200/60 opacity-80 hover:opacity-100'
          : urgency?.isOverdue
          ? 'bg-rose-50/20 border-rose-200/80 shadow-xs hover:shadow-md'
          : 'bg-white border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300'
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
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : isInProgress
              ? 'bg-sky-50 border-sky-500 text-sky-600 hover:bg-sky-100'
              : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 text-transparent'
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
            <div className="w-2 h-2 rounded-full bg-sky-600" />
          ) : (
            <Check className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Content & Metadata */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-bold tracking-tight transition-all ${
                isDone ? 'line-through text-slate-400' : 'text-slate-900'
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

          {item.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Context Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {item.projectKey && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <FolderKanban className="w-3 h-3 text-slate-500" />
                <span>{item.projectKey}</span>
              </span>
            )}

            {item.sourceRetroTitle && (
              item.sourceRetroShareToken ? (
                <Link
                  href={`/retro/${item.sourceRetroShareToken}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="truncate max-w-[200px]">{item.sourceRetroTitle}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="truncate max-w-[200px]">{item.sourceRetroTitle}</span>
                </span>
              )
            )}

            {item.sprintName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>{item.sprintName}</span>
              </span>
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
      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
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
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : isInProgress
                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {item.assignee?.name && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700"
            title={`Assigned to ${item.assignee.name}`}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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
