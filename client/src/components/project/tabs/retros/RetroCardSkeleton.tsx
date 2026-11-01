'use client';

import React from 'react';

export const RetroCardSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-4.5 2xl:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col justify-between space-y-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 bg-slate-200 dark:bg-white/[0.08] rounded-lg w-5/12 sm:w-1/2"></div>
          <div className="h-4 bg-slate-100 dark:bg-white/[0.05] rounded-md w-28 shrink-0"></div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1.5 h-14">
            <div className="h-2.5 bg-slate-200 dark:bg-white/[0.08] rounded w-8"></div>
            <div className="h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded w-14"></div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-100 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1.5 h-14">
            <div className="h-2.5 bg-slate-200 dark:bg-white/[0.08] rounded w-10"></div>
            <div className="h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded w-12"></div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#88c958]/10 dark:bg-[#88c958]/15 border border-[#88c958]/20 flex flex-col items-center justify-center gap-1.5 h-14">
            <div className="h-2.5 bg-[#88c958]/30 rounded w-14"></div>
            <div className="h-3.5 bg-[#88c958]/40 rounded w-12"></div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 bg-slate-200 dark:bg-white/[0.08] rounded-xl"></div>
          <div className="h-7 w-28 bg-[#88c958]/15 border border-[#88c958]/30 rounded-xl"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 bg-slate-100 dark:bg-white/[0.06] rounded-lg"></div>
          <div className="w-7 h-7 bg-slate-100 dark:bg-white/[0.06] rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default RetroCardSkeleton;
