'use client';

import React from 'react';

/**
 * ActionItemsCardsSkeleton:
 * Exactly matches ActionItemCard component structure:
 * - Status Cycle checkbox square
 * - Title, Priority tag, Description preview line, 3 Context tags
 * - Due date urgency pill, status dropdown button, assignee avatar
 */
export const ActionItemsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          {/* Left: Checkbox & Details */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Status Checkbox Square */}
            <div className="mt-0.5 w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0" />

            {/* Title, Description & Metadata Badges */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* Title & Priority Badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`h-4 ${i % 2 === 0 ? 'w-3/5 sm:w-72' : 'w-4/5 sm:w-96'} rounded-md bg-slate-200 dark:bg-slate-800`} />
                <div className="h-4.5 w-14 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40" />
              </div>

              {/* Description preview */}
              <div className={`h-3 ${i % 2 === 0 ? 'w-5/6 sm:w-3/4' : 'w-2/3 sm:w-1/2'} rounded bg-slate-100 dark:bg-slate-800/60`} />

              {/* Context Badges: Project, Retro, Sprint */}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div className="h-5 w-18 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700" />
                <div className="h-5 w-32 rounded-md bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
                <div className="h-5 w-24 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700" />
              </div>
            </div>
          </div>

          {/* Right: Due Date Pill, Status Cycle Button, Assignee Avatar */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            {/* Due date urgency badge */}
            <div className="h-6 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700" />

            {/* Status selector button */}
            <div className="h-8 w-28 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Assignee Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ActionItemsSkeleton:
 * Exactly matches the Retrospective Action Items Tab UI:
 * 1. Top Header Overview Banner (with Retrospective Action Engine badge & My/Team toggle)
 * 2. 4 Top Summary KPI Stat Cards Grid (Total, To Do, In Progress, Done)
 * 3. Filter & Control Toolbar (Search box, 3 dropdown selects, status tabs strip)
 * 4. Action Item Cards list (Checkbox, title, priority, description, context badges, status button, avatar)
 */
export const ActionItemsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header Overview Banner Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#eaf5e3]/60 via-white to-slate-50 dark:from-[#12151c] dark:via-[#0e1015] dark:to-[#08090a] border border-[#cdeac0]/80 dark:border-white/[0.08] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 rounded-full bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
            <div className="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-slate-800" />
          </div>
          <div className="h-8 w-64 sm:w-80 rounded-xl bg-slate-300/80 dark:bg-slate-700" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full max-w-xl rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="h-3.5 w-4/5 max-w-md rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
          </div>
        </div>

        {/* Action Toggle Button Skeleton */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
          <div className="h-7 w-28 rounded-xl bg-[#5cb028]/30 dark:bg-[#5cb028]/30" />
          <div className="h-7 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* 2. Top Summary KPI Stats Grid Skeleton (Matches ActionItemsMetrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-[#cdeac0] dark:bg-[#5cb028]/40" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-7 w-12 rounded bg-slate-300 dark:bg-slate-700" />
          </div>
        </div>

        {/* Metric 2: To Do / Pending */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-amber-200/80 dark:bg-amber-700/60" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-7 w-10 rounded bg-amber-200/80 dark:bg-amber-800/60" />
          </div>
        </div>

        {/* Metric 3: In Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-sky-200/80 dark:bg-sky-700/60" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-7 w-10 rounded bg-sky-200/80 dark:bg-sky-700/60" />
          </div>
        </div>

        {/* Metric 4: Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-md bg-emerald-200/80 dark:bg-emerald-700/60" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-18 rounded bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-7 w-10 rounded bg-emerald-200/80 dark:bg-emerald-700/60" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-10 rounded bg-emerald-100 dark:bg-emerald-950/40 ml-auto" />
            <div className="h-2.5 w-12 rounded bg-slate-100 dark:bg-slate-800 ml-auto" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Control Toolbar Skeleton (Matches ActionItemsFilters) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box Skeleton */}
          <div className="flex-1 max-w-md h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center px-3.5 gap-3">
            <div className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-600 shrink-0" />
            <div className="h-3.5 w-48 rounded bg-slate-200/70 dark:bg-slate-700" />
          </div>

          {/* Filter Dropdowns Skeleton */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-9 w-32 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between px-3">
              <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200/80 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="h-9 w-32 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between px-3">
              <div className="h-3 w-22 rounded bg-slate-200/80 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs Strip Skeleton */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="h-7 w-24 rounded-xl bg-[#5cb028]/30 dark:bg-[#5cb028]/30 flex items-center justify-center gap-2 px-3">
            <div className="h-3 w-12 rounded bg-white/40 dark:bg-white/20" />
            <div className="w-4 h-4 rounded-full bg-white/30 dark:bg-white/20" />
          </div>
          {[
            { w: 'w-20', bw: 'w-8' },
            { w: 'w-28', bw: 'w-14' },
            { w: 'w-20', bw: 'w-8' },
          ].map((tab, idx) => (
            <div key={idx} className={`h-7 ${tab.w} rounded-xl bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center gap-2 px-3`}>
              <div className={`h-3 ${tab.bw} rounded bg-slate-200/80 dark:bg-slate-700`} />
              <div className="w-4 h-4 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Items List Cards Skeleton */}
      <ActionItemsCardsSkeleton count={4} />
    </div>
  );
};
