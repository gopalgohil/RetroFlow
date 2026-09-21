'use client';

import React from 'react';

/**
 * ProjectCardsSkeleton:
 * Standalone grid skeleton of Agile Project cards
 */
export const ProjectCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Card Header: Icon + Name + Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-emerald-100/70 dark:bg-emerald-950/40" />
            </div>

            {/* Project Lead Pill Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-24 bg-slate-300 dark:bg-slate-600 rounded" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>

            {/* Sprint Progress Box */}
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                  <div className="h-2 w-10 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                  <div className="h-4 w-6 bg-slate-300 dark:bg-slate-600 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Button */}
          <div className="h-11 w-full rounded-2xl bg-[#5cb028]/20 dark:bg-[#5cb028]/20 border border-[#5cb028]/30 mt-2" />
        </div>
      ))}
    </div>
  );
};

/**
 * ProjectsTabSkeleton:
 * Matches the Agile Projects Tab:
 * - Top Dark Header Banner Skeleton (with badge, title, subtitle, CTA button)
 * - View Filter Switcher Bar Skeleton
 * - 2/3 Agile Project Cards Grid Skeleton
 */
export const ProjectsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#eaf5e3]/60 via-slate-50 to-white dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950 border border-[#cdeac0]/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 rounded-full bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
            <div className="h-4 w-32 rounded-md bg-slate-200/60 dark:bg-slate-800" />
          </div>
          <div className="h-7 sm:h-8 w-3/4 max-w-md rounded-xl bg-slate-200/80 dark:bg-slate-800" />
          <div className="space-y-2 pt-0.5">
            <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>

        <div className="h-10 w-44 rounded-xl bg-[#5cb028]/30 shrink-0 self-start sm:self-auto" />
      </div>

      {/* View Filter Switcher Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl w-fit">
          <div className="h-7 w-28 rounded-lg bg-slate-200/80 dark:bg-slate-700" />
          <div className="h-7 w-36 rounded-lg bg-slate-200/60 dark:bg-slate-700/60" />
        </div>
        <div className="h-4 w-36 rounded bg-slate-200/50 dark:bg-slate-800" />
      </div>

      {/* Project Cards Grid Skeleton */}
      <ProjectCardsSkeleton count={3} />
    </div>
  );
};

/**
 * SprintCardsSkeleton:
 * Standalone list skeleton of Sprint cards
 */
export const SprintCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="h-3.5 w-72 rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-36 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          </div>
          <div className="h-8 w-44 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
        </div>
      ))}
    </div>
  );
};
