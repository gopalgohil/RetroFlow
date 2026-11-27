'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, Check, User } from 'lucide-react';
import { EnrichedActionItem } from '@/types/project';

interface ActionItemCardProps {
  item: EnrichedActionItem;
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

const PROJECT_AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
];

const getProjectAvatarColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PROJECT_AVATAR_COLORS[Math.abs(hash) % PROJECT_AVATAR_COLORS.length];
};

const getAssigneeInitials = (name?: string, avatar?: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (avatar && avatar.trim().length >= 2) return avatar.trim().slice(0, 2).toUpperCase();
  return 'U';
};

export const ActionItemCard: React.FC<ActionItemCardProps> = React.memo(({
  item,
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
  const assigneeEmail = item.assignee?.email;
  const givenByName = item.givenBy || item.managerName;
  const managerEmail = item.managerEmail;

  const isSelfAssigned = Boolean(
    (assigneeEmail && managerEmail && assigneeEmail.toLowerCase().trim() === managerEmail.toLowerCase().trim()) ||
    (assigneeName && givenByName && givenByName !== 'Unassigned' && givenByName !== 'Project Manager' && assigneeName.toLowerCase().trim() === givenByName.toLowerCase().trim())
  );

  const assignedDateFull = React.useMemo(() => {
    const rawDate = item.assignedAt || item.createdAt;
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [item.assignedAt, item.createdAt]);

  const assignmentDateSuffix = assignedDateFull ? ` (Assigned on ${assignedDateFull})` : '';

  const assigneeTooltip = assigneeEmail
    ? `Assigned to: ${assigneeName} (${assigneeEmail})${assignmentDateSuffix}`
    : `Assigned to: ${assigneeName}${assignmentDateSuffix}`;

  const givenByTooltip = givenByName
    ? managerEmail
      ? `Assigned by: ${givenByName} (${managerEmail})${assignmentDateSuffix}`
      : `Assigned by: ${givenByName}${assignmentDateSuffix}`
    : '';

  const fullTooltip = isSelfAssigned
    ? `Self-assigned by ${assigneeName}${assigneeEmail ? ` (${assigneeEmail})` : ''}${assignmentDateSuffix}`
    : [givenByTooltip, assigneeTooltip].filter(Boolean).join('\n');

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

    const dateParts = item.dueDate.split('T')[0].split('-');
    let target: Date;
    let dateFormatted = '';

    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      target = new Date(year, month, day);
      dateFormatted = target.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(target.getFullYear() !== today.getFullYear() ? { year: 'numeric' as const } : {}),
      });
    } else {
      target = new Date(item.dueDate);
      target.setHours(0, 0, 0, 0);
      dateFormatted = target.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(target.getFullYear() !== today.getFullYear() ? { year: 'numeric' as const } : {}),
      });
    }

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: `Overdue ${daysAgo}d · ${dateFormatted}`,
        className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 font-bold',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due today',
        className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: `${dateFormatted} · In ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        className: 'text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/30 font-medium',
      };
    }
    return {
      label: dateFormatted,
      className: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.06]',
    };
  }, [item.dueDate, isDone]);

  const priorityMeta = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
  // Medium is the default, so only call out priorities that differ from it.
  const showPriority = item.priority && item.priority !== 'medium' && Boolean(PRIORITY_CONFIG[item.priority]);
  const projectLabel = item.projectName || item.projectKey;
  const projectInitials = (item.projectKey || item.projectName || 'P').slice(0, 2).toUpperCase();

  return (
    <div
      className={`group relative px-4 sm:px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_11rem_10rem_9rem] md:items-center gap-3 md:gap-4 ${
        urgency?.isOverdue
          ? 'bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/70 dark:hover:bg-rose-950/20'
          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
      }`}
    >
      {urgency?.isOverdue && (
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-rose-500" aria-hidden="true" />
      )}

      <div className="min-w-0 space-y-1.5">
        <div className="flex items-start gap-2 min-w-0">
          {isDone && (
            <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          )}
          <h4
            className={`text-[15px] font-semibold leading-snug line-clamp-2 [overflow-wrap:anywhere] min-w-0 ${
              isDone ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white'
            }`}
            title={item.title}
          >
            {item.title}
          </h4>
          {showPriority && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border shrink-0 ${priorityMeta.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
              {priorityMeta.label}
            </span>
          )}
        </div>

        {item.description &&
          !item.description.startsWith('Action item originated from Retrospective') &&
          !item.description.startsWith('Originated from Retrospective') &&
          !item.description.startsWith('Retrospective item from session') &&
          !item.description.startsWith('Generated from Retrospective') && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 [overflow-wrap:anywhere]">
              {item.description}
            </p>
          )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
          {projectLabel && (
            <span className="inline-flex items-center gap-1.5 min-w-0" title={projectLabel}>
              <span
                className={`w-5 h-5 rounded-md ${getProjectAvatarColor(item.projectKey || projectLabel)} text-white text-[10px] font-black flex items-center justify-center shrink-0`}
                aria-hidden="true"
              >
                {projectInitials}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {projectLabel}
              </span>
            </span>
          )}

          {item.sourceRetroTitle && (
            <>
              {projectLabel && <span className="text-slate-300 dark:text-white/20">/</span>}
              {item.sourceRetroShareToken ? (
                <Link
                  href={`/retro/${item.sourceRetroShareToken}`}
                  className="inline-flex items-center gap-1 truncate max-w-[240px] hover:text-[#3d8318] dark:hover:text-[#88c958] hover:underline"
                  title="Open retrospective board"
                >
                  <span className="truncate">{item.sourceRetroTitle}</span>
                </Link>
              ) : (
                <span className="truncate max-w-[240px]">{item.sourceRetroTitle}</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0" title={item.assignee?.name ? fullTooltip || assigneeTooltip : 'No one is assigned yet'}>
        {item.assignee?.name ? (
          <>
            <span className="w-7 h-7 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[11px] font-bold flex items-center justify-center shrink-0">
              {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {assigneeName}
              </span>
              {isSelfAssigned && (
                <span className="block text-xs text-slate-500 dark:text-slate-400">Self-assigned</span>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-white/20 text-slate-400 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Unassigned</span>
          </>
        )}
      </div>

      <div className="min-w-0">
        {urgency ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border font-semibold ${urgency.className}`}
            title={item.dueDate ? `Due date: ${item.dueDate}` : undefined}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{urgency.label}</span>
          </span>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500">No due date</span>
        )}
      </div>

      <div className="flex md:justify-end">
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            disabled={isUpdating || (!canMarkDone && isDone)}
            onClick={() => setIsStatusOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isStatusOpen}
            className={`w-36 whitespace-nowrap inline-flex items-center justify-between gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
              !canMarkDone && isDone ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
            } ${
              isDone
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                : isInProgress
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-950/60'
                : 'bg-white dark:bg-[#12151c] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#181b24]'
            }`}
            title={
              !canMarkDone && isDone
                ? 'Only Admin or Manager can modify completed action items'
                : undefined
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDone ? 'bg-emerald-500' : isInProgress ? 'bg-sky-500' : 'bg-slate-400'
                }`}
              />
              {isDone ? 'Done' : isInProgress ? 'In Progress' : 'To Do'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isStatusOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isStatusOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            >
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
                    role="menuitem"
                    onClick={() => {
                      onStatusChange(item, s.value);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ActionItemCard.displayName = 'ActionItemCard';

