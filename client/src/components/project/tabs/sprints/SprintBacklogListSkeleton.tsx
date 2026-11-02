'use client';

import React from 'react';

export const SprintBacklogListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2 animate-pulse" aria-label="Loading backlog items">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 bg-white dark:bg-[#0e1015] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-20 h-5 rounded-md bg-emerald-100/70 dark:bg-[#88c958]/15 border border-emerald-200/60 dark:border-[#88c958]/30 shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div
                className={`h-3.5 rounded bg-slate-200 dark:bg-white/[0.08] ${
                  i % 3 === 0 ? 'w-48 sm:w-64' : i % 3 === 1 ? 'w-40 sm:w-56' : 'w-52 sm:w-72'
                }`}
              />
              <div className="h-2.5 w-36 rounded bg-slate-100 dark:bg-white/[0.05]" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <div className="w-24 h-7 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]" />

            <div className="flex items-center -space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/[0.08] shrink-0 ring-2 ring-white dark:ring-[#0e1015]" />
              <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-white/[0.12] shrink-0 ring-2 ring-white dark:ring-[#0e1015]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SprintBacklogListSkeleton;
