'use client';

import React from 'react';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="border-b border-slate-200 dark:border-white/[0.08] pb-4 space-y-1.5">
        <div className="h-6 w-44 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
        <div className="h-3.5 w-72 rounded-md bg-slate-100 dark:bg-white/[0.05]" />
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-3 w-56 rounded bg-slate-100 dark:bg-white/[0.05]" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-10 w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-10 w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
};
