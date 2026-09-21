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
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#eaf5e3]/60 via-slate-50 to-white dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950 border border-[#cdeac0]/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          {/* Engine Pill Badge */}
          <div className="h-6 w-32 rounded-full bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
          {/* Main Hub Title */}
          <div className="h-8 w-3/4 max-w-md rounded-xl bg-slate-200/90 dark:bg-slate-800" />
          {/* Subtitle Description Lines */}
          <div className="space-y-2 pt-1">
            <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>

        {/* Right Stats Box Skeleton */}
        <div className="hidden md:flex flex-col gap-2.5 shrink-0 bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-[#cdeac0]/80 dark:border-slate-800 shadow-xs w-52">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2.5 w-14 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Sessions Grid Skeleton (4 Cards) */}
      <SessionCardsSkeleton count={4} />
    </div>
  );
};
