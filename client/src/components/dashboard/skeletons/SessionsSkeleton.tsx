'use client';

import React from 'react';

/**
 * SessionCardsSkeleton:
 * Standalone grid skeleton of Retrospective Session cards
 */
export const SessionCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 2xl:gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 sm:p-4.5 2xl:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-md flex flex-col justify-between space-y-4"
        >
          {/* Top Row: Status pill & Date */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 rounded-full bg-[#88c958]/20 dark:bg-[#88c958]/20" />
            <div className="h-3.5 w-24 rounded bg-slate-100 dark:bg-white/[0.06]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-3.5 w-full rounded bg-slate-100 dark:bg-white/[0.06]" />
            <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/[0.06]" />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 rounded-xl bg-[#88c958]/25" />
              <div className="h-8 w-28 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-white/[0.08]" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SessionsSkeleton:
 * Matches the Retrospective Sessions Tab:
 * - Top Banner Overview Card
 * - Filter & Action Bar
 * - 4 Retrospective Session Cards Grid
 */
export const SessionsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Overview Card Skeleton */}
      <div className="relative py-5 px-6 sm:py-6 sm:px-8 rounded-2xl bg-[#5cb028]/15 dark:bg-[#0e1015] border border-[#5cb028]/25 dark:border-white/[0.08] shadow-xs flex flex-col justify-center space-y-2.5">
        <div className="h-7 sm:h-8 w-60 sm:w-72 rounded-xl bg-[#5cb028]/25 dark:bg-white/[0.1]" />
        <div className="h-3.5 w-full max-w-lg rounded-md bg-[#5cb028]/15 dark:bg-white/[0.05]" />
      </div>

      {/* Filter Tabs Bar Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-24 rounded-xl bg-slate-200/80 dark:bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-8 w-full sm:w-56 md:w-64 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]" />
      </div>

      {/* Sessions Grid Skeleton (6 Cards) */}
      <SessionCardsSkeleton count={6} />
    </div>
  );
};
