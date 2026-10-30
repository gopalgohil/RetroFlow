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

          {/* Right: Status dropdown button skeleton, merged round circles skeleton */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {/* Status Dropdown button skeleton */}
            <div className="w-24 h-7 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]" />

            {/* Merged circles skeleton */}
            <div className="flex items-center -space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 ring-2 ring-white dark:ring-[#0e1015]" />
              <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 ring-2 ring-white dark:ring-[#0e1015]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SprintBacklogListSkeleton;
