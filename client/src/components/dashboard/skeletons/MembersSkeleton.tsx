'use client';

import React from 'react';

/**
 * Members Skeleton:
 * Matches Team Members & Whitelist Tab
 */
export const MembersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Section Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1.5">
        <div className="h-6 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-3.5 w-80 rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Main Roster Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <div className="h-6 w-28 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40" />
        </div>

        {/* Member Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-44 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="h-6 w-28 rounded-lg bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
