'use client';

import React from 'react';
import { Sparkles, ChevronDown, Trash2, Calendar } from 'lucide-react';
import { BacklogItem } from '@/types/project';
import { StatusPill, UserAvatar } from '@/components/ui';

interface SprintBacklogItemRowProps {
  sprintId: string;
  item: BacklogItem;
  isUpdating: boolean;
  canManageProject?: boolean;
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

/**
 * SprintBacklogItemRow:
 * Highly optimized, memoized single backlog / action item card.
 */
export const SprintBacklogItemRow: React.FC<SprintBacklogItemRowProps> = React.memo(
  ({
    sprintId,
    item,
    isUpdating,
    canManageProject = false,
    isDeleting = false,
    onUpdateStatus,
    onUpdateDueDate,
    onDeleteItem,
  }) => {
    return (
      <div className="group p-3 bg-white dark:bg-[#0e1015] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors">
        {/* Left: Type badge & Title */}
        <div className="flex items-center gap-3">
          <StatusPill status={item.type} />
          <div>
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
              {canManageProject ? (
                <label
                  title="Click to set or change due date for this item"
                  className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                >
                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                  <span>
                    {item.dueDate ? `Due: ${formatDueDate(item.dueDate)}` : '+ Due Date'}
                  </span>
                  <input
                    type="date"
                    value={item.dueDate ? item.dueDate.split('T')[0] : ''}
                    disabled={isUpdating || isDeleting}
                    onChange={(e) => {
                      if (onUpdateDueDate) {
                        onUpdateDueDate(sprintId, item.id, e.target.value || null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              ) : item.dueDate ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  Due: {formatDueDate(item.dueDate)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Assignee, Status Select Dropdown, Delete Action */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {item.assignee && (
            <div className="flex items-center gap-1.5">
              <UserAvatar name={item.assignee.name} avatar={item.assignee.avatar} size="xs" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium hidden md:inline">
                {item.assignee.name}
              </span>
            </div>
          )}

          {/* Interactive Ticket Status Toggle Dropdown */}
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
              title="Click to update ticket status (TODO ➔ IN PROGRESS ➔ DONE)"
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
              <option value="done" className="text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#0e1015] font-bold py-1">
                ● DONE
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="w-3.5 h-3.5 opacity-60 text-current" />
            </div>
          </div>

          {/* Admin / Manager / Lead Delete Action */}
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
