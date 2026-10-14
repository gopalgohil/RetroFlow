'use client';

import React from 'react';

/**
 * AnalyticsSkeleton Component
 * Component-wise skeleton loader matching the exact visual layout of Image 2:
 * 1. Analytics Header (Title, Subtitle, Project & Year Selectors, Refresh)
 * 2. 4 High-Level Summary KPI Cards
 * 3. 12-Month Bar Chart Workspace (Grid, Bars, Y-Axis, X-Axis, Insight Cards)
 * 4. Retrospectives & Action Items Deliverables Table
 */
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 1. Header Component Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-6 w-52 sm:w-64 bg-slate-200 dark:bg-white/[0.1] rounded-lg" />
            <div className="h-5 w-24 bg-[#eaf5e3] dark:bg-[#88c958]/15 rounded-full" />
          </div>
          <div className="h-3.5 w-72 sm:w-96 bg-slate-100 dark:bg-white/[0.05] rounded-md" />
        </div>

        {/* Right Toolbar Controls Skeleton */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="h-9 w-44 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]" />
          <div className="h-9 w-28 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]" />
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]" />
        </div>
      </div>

      {/* Annual Retrospective 12-Month Bar Chart Skeleton */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-6">
        {/* Chart Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-5 w-64 bg-slate-200 dark:bg-white/[0.1] rounded-lg" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-white/[0.06] rounded-full" />
            </div>
            <div className="h-3 w-80 bg-slate-100 dark:bg-white/[0.05] rounded" />
          </div>

          {/* Metric Toggle Pills Skeleton */}
          <div className="h-8 w-64 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]" />
        </div>

        {/* Bar Chart Area (Matching Image 2 layout) */}
        <div className="relative pt-6 pb-2">
          <div className="relative h-[250px] sm:h-[280px] flex">
            {/* Columns Area with Horizontal Reference Lines */}
            <div className="relative flex-1 h-full">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
                <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
                <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
                <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
                <div className="border-b border-slate-200 dark:border-white/[0.12] w-full" />
              </div>

              {/* 12 Bars Skeleton */}
              <div className="absolute inset-0 grid grid-cols-12 gap-1 sm:gap-2 items-end px-1 sm:px-2">
                {[15, 30, 0, 45, 20, 60, 10, 25, 75, 50, 20, 35].map((h, i) => (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    {h > 0 ? (
                      <div
                        className="w-4 sm:w-6 md:w-8 max-w-[34px] rounded-t-lg bg-[#5cb028]/25 dark:bg-[#88c958]/20"
                        style={{ height: `${h}%` }}
                      />
                    ) : (
                      <div className="w-2.5 sm:w-3.5 h-1 rounded-full bg-slate-200 dark:bg-white/[0.06]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Y-Axis Scale Skeleton (4, 3, 2, 1, 0) */}
            <div className="w-8 sm:w-12 h-full flex flex-col justify-between items-end pl-2 sm:pl-3 pb-0">
              {[4, 3, 2, 1, 0].map((t) => (
                <div key={t} className="h-3 w-3 bg-slate-200 dark:bg-white/[0.08] rounded" />
              ))}
            </div>
          </div>

          {/* Month Labels Skeleton (Jan - Dec) */}
          <div className="flex pt-3 border-t border-slate-200 dark:border-white/[0.12]">
            <div className="flex-1 grid grid-cols-12 gap-1 sm:gap-2 px-1 sm:px-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                <div key={m} className="flex flex-col items-center justify-center">
                  <div className="h-2.5 w-6 bg-slate-200 dark:bg-white/[0.08] rounded" />
                </div>
              ))}
            </div>
            <div className="w-8 sm:w-12" />
          </div>
        </div>

        {/* Bottom Hover Card Skeleton */}
        <div className="h-16 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-3 w-72 bg-slate-200 dark:bg-white/[0.08] rounded" />
          </div>
          <div className="h-3 w-40 bg-slate-200 dark:bg-white/[0.08] rounded" />
        </div>

        {/* Bottom 2 Summary Insight Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-2.5 w-20 bg-slate-200 dark:bg-white/[0.08] rounded" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-white/[0.1] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Table Component Skeleton */}
      <div className="bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-xs overflow-hidden space-y-4">
        {/* Table Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-5 w-64 bg-slate-200 dark:bg-white/[0.1] rounded-lg" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-white/[0.06] rounded-full" />
            </div>

            {/* Search Box & Expand All Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-60 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]" />
              <div className="h-9 w-24 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]" />
            </div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="p-6 pt-0 space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-14 w-full rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-40 bg-slate-200 dark:bg-white/[0.08] rounded" />
                <div className="h-3 w-16 bg-slate-100 dark:bg-white/[0.05] rounded" />
              </div>
              <div className="flex items-center gap-8">
                <div className="h-4 w-12 bg-slate-200 dark:bg-white/[0.08] rounded" />
                <div className="h-4 w-16 bg-emerald-100 dark:bg-emerald-950/50 rounded" />
                <div className="h-4 w-16 bg-amber-100 dark:bg-amber-950/50 rounded" />
                <div className="h-2 w-24 bg-slate-200 dark:bg-white/[0.08] rounded-full" />
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
