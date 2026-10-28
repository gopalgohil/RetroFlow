'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Check,
} from 'lucide-react';
import { EnrichedActionItem } from '@/types/project';

interface ActionItemCardProps {
  item: EnrichedActionItem;
  displayIndex?: number;
  isUpdating: boolean;
  onStatusChange: (item: EnrichedActionItem, status: 'todo' | 'in_progress' | 'done') => void;
  canMarkDone?: boolean;
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

const getAssigneeInitials = (name?: string, avatar?: string): string => {
  if (avatar && avatar.trim().length >= 2) return avatar.trim().slice(0, 2).toUpperCase();
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
};

export const ActionItemCard: React.FC<ActionItemCardProps> = React.memo(({
  item,
  displayIndex,
  isUpdating,
  onStatusChange,
  canMarkDone = false,
}) => {
  const isDone = item.status === 'done';
  const isInProgress = item.status === 'in_progress';

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    if (isStatusOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusOpen]);

  const assigneeName = item.assignee?.name || 'Unassigned';
  const givenByName = item.givenBy || item.managerName;
  const hoverTooltip = givenByName
    ? `Assigned to: ${assigneeName}\nGiven by: ${givenByName}`
    : `Assigned to: ${assigneeName}`;

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
      label: `Due: ${new Date(item.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`,
      className: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.06]',
    };
  }, [item.dueDate, isDone]);

  // Calculate Assigned Date
  const assignedDateFormatted = React.useMemo(() => {
    const rawDate = item.assignedAt || item.createdAt;
    if (!rawDate) return null;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [item.assignedAt, item.createdAt]);

  const assignedDateFull = React.useMemo(() => {
    const rawDate = item.assignedAt || item.createdAt;
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [item.assignedAt, item.createdAt]);

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
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Item Number (Plain dark number) */}
        {typeof displayIndex === 'number' && (
          <span
            className={`text-base sm:text-lg font-black select-none shrink-0 tabular-nums min-w-[24px] pt-0.5 ${
              isDone
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {displayIndex}
          </span>
        )}

        {/* Task Title, Priority & Clean Sub-row */}
        <div className="space-y-2 flex-1 min-w-0">
          {/* Main Task Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h4
              className={`text-base sm:text-[17px] font-bold tracking-tight select-text leading-snug ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {item.title}
            </h4>

            {/* Clean Priority Pill with colored dot */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border leading-none shrink-0 ${priorityMeta.pill}`}
            >
              <span className={`w-2 h-2 rounded-full ${priorityMeta.dot}`} />
              <span>{priorityMeta.label}</span>
            </span>
          </div>

          {/* Optional Custom Description (Only display authentic user-written descriptions, filter boilerplate origin text) */}
          {item.description &&
            !item.description.startsWith('Action item originated from Retrospective') &&
            !item.description.startsWith('Originated from Retrospective') &&
            !item.description.startsWith('Retrospective item from session') &&
            !item.description.startsWith('Generated from Retrospective') && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

          {/* Clean Sub-Metadata Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">

            {/* Origin Retro Link */}
            {item.sourceRetroTitle && (
              item.sourceRetroShareToken ? (
                <Link
                  href={`/retro/${item.sourceRetroShareToken}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3d8318] dark:text-[#88c958] hover:underline transition-colors max-w-[280px] truncate"
                  title="Go to retrospective board"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                  <span className="truncate">{item.sourceRetroTitle}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3d8318] dark:text-[#88c958] max-w-[280px] truncate">
                  <Sparkles className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                  <span className="truncate">{item.sourceRetroTitle}</span>
                </span>
              )
            )}

            {/* Assigned Date Badge */}
            {assignedDateFormatted && (
              <>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]"
                  title={assignedDateFull ? `Assigned on ${assignedDateFull}` : undefined}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                  <span>Assigned: {assignedDateFormatted}</span>
                </span>
              </>
            )}

            {/* Due Date Badge */}
            {urgency && (
              <>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs border font-semibold ${urgency.className}`}
                  title={item.dueDate ? `Due date: ${item.dueDate}` : undefined}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{urgency.label}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Status Dropdown & Assignee */}
      <div className="flex items-center justify-between md:justify-end gap-3.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.08] shrink-0">
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            disabled={isUpdating || (!canMarkDone && isDone)}
            onClick={() => setIsStatusOpen((prev) => !prev)}
            className={`inline-flex items-center justify-between gap-2 pl-3.5 pr-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${
              !canMarkDone && isDone ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
            } ${
              isDone
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                : isInProgress
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-950/60'
                : 'bg-slate-50 dark:bg-[#12151c] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#181b24]'
            }`}
            title={
              !canMarkDone && isDone
                ? 'Only Admin or Manager can modify completed action items'
                : undefined
            }
          >
            <span>{isDone ? 'Done' : isInProgress ? 'In Progress' : 'To Do'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isStatusOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isStatusOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                Update Status
              </div>
              <div className="py-0.5">
                {[
                  { value: 'todo' as const, label: 'To Do' },
                  { value: 'in_progress' as const, label: 'In Progress' },
                  ...(canMarkDone ? [{ value: 'done' as const, label: 'Done' }] : []),
                ].map((s) => {
                  const isSelected = item.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        onStatusChange(item, s.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Merged Round Circles: Assigned By (Manager) & Assigned To (Member) merged half-half with round curve */}
        <div className="flex items-center shrink-0 select-none">
          {givenByName && item.assignee?.name ? (
            <div
              className="flex items-center -space-x-3.5 group/merged"
              title={`Assigned by: ${givenByName}\nAssigned to: ${assigneeName}`}
            >
              {/* Left Round Circle: Assigned By (Manager) */}
              <div
                className="w-8 h-8 rounded-full bg-[#488e1e] text-white dark:bg-[#72ad46] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs cursor-pointer z-0 group-hover/merged:z-10 group-hover/merged:scale-105 transition-all"
                title={`Assigned by: ${givenByName}`}
              >
                {getAssigneeInitials(givenByName)}
              </div>

              {/* Right Round Circle: Assigned To (Member) */}
              <div
                className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs cursor-pointer z-10 hover:z-20 hover:scale-105 transition-all"
                title={`Assigned to: ${assigneeName}`}
              >
                {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
              </div>
            </div>
          ) : item.assignee?.name ? (
            <div
              className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white dark:ring-[#0e1015] cursor-pointer"
              title={`Assigned to: ${assigneeName}`}
            >
              {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

ActionItemCard.displayName = 'ActionItemCard';

