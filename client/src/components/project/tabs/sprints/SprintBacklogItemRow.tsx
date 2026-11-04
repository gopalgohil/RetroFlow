'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Trash2, Calendar, Check, AlertCircle, UserPlus, UserX } from 'lucide-react';
import { BacklogItem } from '@/types/project';

interface SprintBacklogItemRowProps {
  sprintId: string;
  item: BacklogItem;
  itemIndex?: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
  projectManagerName?: string;
  isUpdating: boolean;
  canManageProject?: boolean;
  canMarkDone?: boolean;
  currentUser?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  members?: Array<{ id?: string; name: string; email?: string; avatar?: string; role?: string }>;
  isDeleting?: boolean;
  onUpdateStatus: (
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
  onDeleteItem?: (sprintId: string, itemId: string) => void;
}

const formatDueDate = (dateStr: string) => {
  try {
    const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
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

export const SprintBacklogItemRow: React.FC<SprintBacklogItemRowProps> = React.memo(
  ({
    sprintId,
    item,
    itemIndex,
    sprintStartDate,
    sprintEndDate,
    projectManagerName,
    isUpdating,
    canManageProject = false,
    canMarkDone = false,
    currentUser = null,
    members = [],
    isDeleting = false,
    onUpdateStatus,
    onUpdateDueDate,
    onUpdateAssignee,
    onDeleteItem,
  }) => {
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
          setIsAssigneeOpen(false);
        }
      };
      if (isAssigneeOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isAssigneeOpen]);

    const userEmail = currentUser?.email?.toLowerCase().trim();
    const userName = currentUser?.name?.toLowerCase().trim();
    const assigneeEmail = item.assignee?.email?.toLowerCase().trim();
    const assigneeName = item.assignee?.name?.toLowerCase().trim();

    const isAssignee = Boolean(
      item.assignee && (
        (userEmail && assigneeEmail && userEmail === assigneeEmail) ||
        (userName && assigneeName && userName === assigneeName)
      )
    );

    const canChangeStatus = Boolean(canManageProject || isAssignee);

    const givenByName =
      (item.givenBy && item.givenBy !== 'Admin')
        ? item.givenBy
        : ((item as any).managerName && (item as any).managerName !== 'Admin')
        ? (item as any).managerName
        : projectManagerName ||
          item.givenBy ||
          (item as any).managerName ||
          'Project Manager';
    const isDone = item.status === 'done';
    const isAdminOrManager = Boolean(
      canManageProject ||
      currentUser?.role?.toLowerCase() === 'admin' ||
      currentUser?.role?.toLowerCase() === 'manager'
    );
    const completedByName = item.completedBy || givenByName;
    const completedDateStr = item.completedAt || item.createdAt;
    const assigneeDisplayName = item.assignee?.name;
    const managerEmail = item.managerEmail;

    const isSelfAssigned = Boolean(
      (assigneeEmail && managerEmail && assigneeEmail.toLowerCase().trim() === managerEmail.toLowerCase().trim()) ||
      (assigneeDisplayName && givenByName && givenByName !== 'Project Manager' && assigneeDisplayName.toLowerCase().trim() === givenByName.toLowerCase().trim())
    );

    const assigneeTooltip = assigneeEmail
      ? `Assigned to: ${assigneeDisplayName} (${assigneeEmail})`
      : `Assigned to: ${assigneeDisplayName}`;

    const givenByTooltip = givenByName
      ? managerEmail
        ? `Assigned by: ${givenByName} (${managerEmail})`
        : `Assigned by: ${givenByName}`
      : '';

    const fullTooltip = isSelfAssigned
      ? `Self-assigned by ${assigneeDisplayName}${assigneeEmail ? ` (${assigneeEmail})` : ''}`
      : [givenByTooltip, assigneeTooltip].filter(Boolean).join('\n');

    const dueBadgeInfo = React.useMemo(() => {
      if (!item.dueDate) return null;
      if (isDone) {
        return {
          label: `Due: ${formatDueDate(item.dueDate)}`,
          badgeClass: 'text-slate-400 dark:text-slate-500 font-medium',
          isOverdue: false,
          tooltip: `Completed deadline: ${formatDueDate(item.dueDate)}`,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = item.dueDate.includes('T') ? new Date(item.dueDate) : new Date(`${item.dueDate}T00:00:00`);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        return {
          label: `Due: ${formatDueDate(item.dueDate)} · Overdue (${daysAgo}d)`,
          badgeClass:
            'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 font-bold',
          isOverdue: true,
          tooltip: `Task is OVERDUE by ${daysAgo} day${daysAgo > 1 ? 's' : ''}! Deadline was ${formatDueDate(item.dueDate)}. Click to change.`,
        };
      }
      if (diffDays === 0) {
        return {
          label: `Due: ${formatDueDate(item.dueDate)} · Due Today`,
          badgeClass:
            'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 font-bold',
          isOverdue: false,
          tooltip: `Due today! (${formatDueDate(item.dueDate)}). Click to change.`,
        };
      }
      return {
        label: `Due: ${formatDueDate(item.dueDate)}`,
        badgeClass:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-bold',
        isOverdue: false,
        tooltip: `Target deadline: ${formatDueDate(item.dueDate)}. Click to change.`,
      };
    }, [item.dueDate, isDone]);

    return (
      <div className="group p-3 bg-white dark:bg-[#0e1015] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <span
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0 tabular-nums select-none mt-0.5 sm:mt-0 shadow-2xs"
            title={typeof itemIndex === 'number' ? `Item #${itemIndex}` : 'Item'}
          >
            {typeof itemIndex === 'number' ? itemIndex : '1'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {item.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px]">
              {item.sourceRetroTitle && (
                <span className="text-[#88c958] flex items-center gap-1 font-medium">
                  <Sparkles className="w-2.5 h-2.5" />
                  From Retro: {item.sourceRetroTitle}
                </span>
              )}
              {isDone ? (
                <>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    title={
                      isAdminOrManager
                        ? `Completed on ${formatDueDate(completedDateStr)} by ${completedByName}`
                        : `Completed on ${formatDueDate(completedDateStr)}`
                    }
                  >
                    <Check className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {isAdminOrManager
                        ? `Completed: ${formatDueDate(completedDateStr)} · by ${completedByName}`
                        : `Completed: ${formatDueDate(completedDateStr)}`}
                    </span>
                  </span>
                  {item.dueDate && (
                    <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 text-[10px]">
                      <Calendar className="w-2.5 h-2.5 opacity-60" />
                      Due: {formatDueDate(item.dueDate)}
                    </span>
                  )}
                </>
              ) : canManageProject ? (
                <label
                  title={dueBadgeInfo?.tooltip || 'Click to set or change due date for this item'}
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                    if (input && typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch {}
                    }
                  }}
                  className={`relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] cursor-pointer transition-colors ${
                    dueBadgeInfo
                      ? dueBadgeInfo.badgeClass
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-bold'
                  }`}
                >
                  {dueBadgeInfo?.isOverdue ? (
                    <AlertCircle className="w-2.5 h-2.5 shrink-0 text-rose-600 dark:text-rose-400 animate-pulse" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                  )}
                  <span>
                    {dueBadgeInfo?.label || (item.dueDate ? `Due: ${formatDueDate(item.dueDate)}` : '+ Due Date')}
                  </span>
                  <input
                    type="date"
                    min={sprintStartDate ? sprintStartDate.split('T')[0] : undefined}
                    max={sprintEndDate ? sprintEndDate.split('T')[0] : undefined}
                    value={item.dueDate ? item.dueDate.split('T')[0] : ''}
                    disabled={isUpdating || isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        (e.target as HTMLInputElement).showPicker?.();
                      } catch {}
                    }}
                    onChange={(e) => {
                      if (onUpdateDueDate) {
                        onUpdateDueDate(sprintId, item.id, e.target.value || null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              ) : dueBadgeInfo ? (
                <span
                  title={dueBadgeInfo.tooltip}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] ${dueBadgeInfo.badgeClass}`}
                >
                  {dueBadgeInfo.isOverdue ? (
                    <AlertCircle className="w-2.5 h-2.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5" />
                  )}
                  {dueBadgeInfo.label}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {!canChangeStatus ? (
            <div
              title={
                item.assignee?.name
                  ? `Assigned to ${item.assignee.name}. Only ${item.assignee.name} or Manager can update status.`
                  : 'Unassigned task. Only Manager can update status.'
              }
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider select-none border shadow-2xs ${
                item.status === 'done'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : item.status === 'in_progress'
                  ? 'bg-[#88c958]/15 text-[#88c958] border-[#88c958]/30'
                  : 'bg-slate-100 dark:bg-[#141720] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/[0.08]'
              }`}
            >
              {item.status === 'done' ? '● DONE' : item.status === 'in_progress' ? '◑ IN PROGRESS' : '○ TO DO'}
            </div>
          ) : !canMarkDone && item.status === 'done' ? (
            <div
              title="This task is completed. Only Admin or Manager can modify completed tasks."
              className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider select-none border shadow-2xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 cursor-not-allowed opacity-90"
            >
              ● DONE
            </div>
          ) : (
            <div className="relative inline-block">
              <select
                value={item.status}
                disabled={isUpdating || isDeleting}
                onChange={(e) =>
                  onUpdateStatus(
                    sprintId,
                    item.id,
                    e.target.value as 'todo' | 'in_progress' | 'done'
                  )
                }
                title={
                  canMarkDone
                    ? 'Click to update ticket status (TODO ➔ IN PROGRESS ➔ DONE)'
                    : 'Click to update status (TODO ➔ IN PROGRESS). Only Manager/Admin can mark Done.'
                }
                className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 ${
                  item.status === 'done'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/90'
                    : item.status === 'in_progress'
                    ? 'bg-[#88c958]/15 text-[#88c958] border-[#88c958]/30 hover:bg-[#88c958]/25'
                    : 'bg-slate-100 dark:bg-[#141720] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/[0.08] hover:bg-slate-200/80 dark:hover:bg-white/[0.05]'
                }`}
              >
                <option value="todo" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-[#0e1015] font-bold py-1">
                  ○ TO DO
                </option>
                <option value="in_progress" className="text-[#88c958] bg-white dark:bg-[#0e1015] font-bold py-1">
                  ◑ IN PROGRESS
                </option>
                {canMarkDone && (
                  <option value="done" className="text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#0e1015] font-bold py-1">
                    ● DONE
                  </option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="w-3.5 h-3.5 opacity-60 text-current" />
              </div>
            </div>
          )}

          <div ref={assigneeDropdownRef} className="relative flex items-center shrink-0 select-none">
            {canManageProject && onUpdateAssignee ? (
              <button
                type="button"
                onClick={() => setIsAssigneeOpen((prev) => !prev)}
                title={item.assignee?.name ? `${fullTooltip}\n\nClick to reassign developer` : 'Click to assign a developer'}
                className="group/assignee flex items-center gap-1 rounded-full p-0.5 hover:ring-2 hover:ring-[#88c958]/80 transition-all cursor-pointer"
              >
                {isSelfAssigned && item.assignee?.name ? (
                  <div className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white dark:ring-[#0e1015]">
                    {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
                  </div>
                ) : givenByName && item.assignee?.name ? (
                  <div className="flex items-center -space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#488e1e] text-white dark:bg-[#72ad46] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs z-0">
                      {getAssigneeInitials(givenByName)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#0e1015] shadow-xs z-10">
                      {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
                    </div>
                  </div>
                ) : item.assignee?.name ? (
                  <div className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white dark:ring-[#0e1015]">
                    {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 hover:border-[#88c958] hover:text-[#88c958] flex items-center justify-center text-xs font-bold transition-colors">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            ) : (
              item.assignee?.name ? (
                <div
                  className="w-8 h-8 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white dark:ring-[#0e1015]"
                  title={fullTooltip}
                >
                  {getAssigneeInitials(item.assignee.name, item.assignee.avatar)}
                </div>
              ) : null
            )}

            {isAssigneeOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.12] rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                  Reassign Task
                </div>
                <div className="py-1 space-y-0.5">
                  {members.map((member) => {
                    const isSelected = item.assignee?.name?.toLowerCase().trim() === member.name?.toLowerCase().trim();
                    return (
                      <button
                        key={member.id || member.email || member.name}
                        type="button"
                        onClick={() => {
                          setIsAssigneeOpen(false);
                          if (!isSelected && onUpdateAssignee) {
                            onUpdateAssignee(sprintId, item.id, {
                              name: member.name,
                              email: member.email,
                              avatar: member.avatar,
                            });
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] text-[9px] font-black flex items-center justify-center shrink-0">
                            {getAssigneeInitials(member.name, member.avatar)}
                          </div>
                          <span className="truncate">{member.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />}
                      </button>
                    );
                  })}

                  {item.assignee?.name && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAssigneeOpen(false);
                        if (onUpdateAssignee) {
                          onUpdateAssignee(sprintId, item.id, null);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border-t border-slate-100 dark:border-white/[0.08] mt-1 pt-1.5 cursor-pointer font-medium"
                    >
                      <UserX className="w-3.5 h-3.5 shrink-0" />
                      <span>Unassign task</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {canManageProject && onDeleteItem && (
            <button
              type="button"
              disabled={isDeleting || isUpdating}
              onClick={() => onDeleteItem(sprintId, item.id)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete backlog item from sprint and action items"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SprintBacklogItemRow.displayName = 'SprintBacklogItemRow';

export default SprintBacklogItemRow;
