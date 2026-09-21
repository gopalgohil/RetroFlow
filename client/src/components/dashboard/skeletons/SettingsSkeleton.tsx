'use client';

import React from 'react';

/**
 * Settings Skeleton:
 * Matches Workspace Settings Tab
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      {/* Top Section Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1.5">
        <div className="h-6 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-3.5 w-72 rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Settings Form Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-56 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
};
