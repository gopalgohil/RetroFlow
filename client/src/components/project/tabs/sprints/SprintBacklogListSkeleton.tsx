'use client';

import React from 'react';

/**
 * SprintBacklogListSkeleton:
 * Dedicated skeleton loader for sprint backlog action item rows.
 * Rendered when user or admin switches pages in pagination.
 */
export const SprintBacklogListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2 animate-pulse" aria-label="Loading backlog items">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 bg-white dark:bg-[#0e1015] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          {/* Left: Action item type badge & title skeleton */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Pill badge skeleton */}
            <div className="w-20 h-5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0" />
            <div className="space-y-1.5 min-w-0">
              {/* Title line skeleton */}
              <div
                className={`h-3.5 rounded bg-slate-200 dark:bg-slate-800 ${
                  i % 3 === 0 ? 'w-48 sm:w-64' : i % 3 === 1 ? 'w-40 sm:w-56' : 'w-52 sm:w-72'
                }`}
              />
              {/* Retro source subtitle skeleton */}
              <div className="h-2.5 w-36 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>

          {/* Right: Story points pill, assignee avatar, status dropdown button skeleton */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {/* Story Points badge skeleton */}
            <div className="w-12 h-5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]" />

            {/* Assignee Avatar + Name skeleton */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="w-12 h-3 rounded bg-slate-100 dark:bg-slate-800 hidden md:inline-block" />
            </div>

            {/* Status Dropdown button skeleton */}
            <div className="w-24 h-7 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SprintBacklogListSkeleton;
