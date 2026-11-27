'use client';

import React from 'react';
import { AlertTriangle, CalendarClock, UserX, CheckCircle2 } from 'lucide-react';

export type ActionItemsQuickFilter = 'overdue' | 'dueSoon' | 'unassigned' | null;

interface ActionItemsMetricsProps {
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    completionRate: number;
  };
  attention: {
    overdue: number;
    dueSoon: number;
    unassigned: number;
  };
  activeQuickFilter: ActionItemsQuickFilter;
  onQuickFilterChange: (filter: ActionItemsQuickFilter) => void;
}

export const ActionItemsMetrics: React.FC<ActionItemsMetricsProps> = React.memo(
  ({ metrics, attention, activeQuickFilter, onQuickFilterChange }) => {
    // Cards that need action double as one-click filters.
    const actionCards = [
      {
        id: 'overdue' as const,
        label: 'Overdue',
        value: attention.overdue,
        hint: 'Past due date',
        icon: AlertTriangle,
        tone: attention.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white',
        iconTone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        activeRing: 'ring-2 ring-rose-400/60 border-rose-300 dark:border-rose-500/40',
      },
      {
        id: 'dueSoon' as const,
        label: 'Due in 7 days',
        value: attention.dueSoon,
        hint: 'Coming up next',
        icon: CalendarClock,
        tone: attention.dueSoon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white',
        iconTone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        activeRing: 'ring-2 ring-amber-400/60 border-amber-300 dark:border-amber-500/40',
      },
      {
        id: 'unassigned' as const,
        label: 'Unassigned',
        value: attention.unassigned,
        hint: 'Needs an owner',
        icon: UserX,
        tone: 'text-slate-900 dark:text-white',
        iconTone: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
        activeRing: 'ring-2 ring-slate-400/50 border-slate-300 dark:border-white/20',
      },
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actionCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeQuickFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onQuickFilterChange(isActive ? null : card.id)}
              aria-pressed={isActive}
              title={isActive ? 'Clear this filter' : `Show only: ${card.label.toLowerCase()}`}
              className={`text-left p-4 rounded-xl bg-white dark:bg-[#0e1015] border transition-all cursor-pointer hover:shadow-md ${
                isActive ? card.activeRing : 'border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.label}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconTone}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isActive ? 'Filter on · click to clear' : card.hint}</p>
            </button>
          );
        })}

        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#eaf5e3] text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {metrics.done}
            <span className="text-base font-medium text-slate-400 dark:text-slate-500"> / {metrics.total}</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5cb028] dark:bg-[#88c958] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, metrics.completionRate))}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {metrics.completionRate}%
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ActionItemsMetrics.displayName = 'ActionItemsMetrics';
