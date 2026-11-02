'use client';

import React from 'react';

export const ActionItemsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="mt-0.5 w-6 h-6 rounded-lg border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] shrink-0" />

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`h-4 ${i % 2 === 0 ? 'w-3/5 sm:w-72' : 'w-4/5 sm:w-96'} rounded-md bg-slate-200 dark:bg-white/[0.08]`} />
                <div className="h-4.5 w-14 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40" />
              </div>

              <div className={`h-3 ${i % 2 === 0 ? 'w-5/6 sm:w-3/4' : 'w-2/3 sm:w-1/2'} rounded bg-slate-100 dark:bg-white/[0.05]`} />

              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div className="h-5 w-18 rounded-md bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.06]" />
                <div className="h-5 w-32 rounded-md bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30" />
                <div className="h-5 w-24 rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="h-6 w-20 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.06]" />

            <div className="h-8 w-28 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-white/[0.08]" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-white/[0.12]" />
            </div>

            <div className="w-8 h-8 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActionItemsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#eaf5e3]/60 via-white to-slate-50 dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#0e1015] border border-[#cdeac0]/80 dark:border-white/[0.08] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30" />
            <div className="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/[0.06]" />
          </div>
          <div className="h-8 w-64 sm:w-80 rounded-xl bg-slate-300/80 dark:bg-white/[0.08]" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full max-w-xl rounded-md bg-slate-200/60 dark:bg-white/[0.05]" />
            <div className="h-3.5 w-4/5 max-w-md rounded-md bg-slate-200/60 dark:bg-white/[0.05]" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-[#0e1015] p-1 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs shrink-0">
          <div className="h-7 w-28 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20" />
          <div className="h-7 w-28 rounded-xl bg-slate-100 dark:bg-white/[0.05]" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-[#cdeac0] dark:bg-[#88c958]/40" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
            <div className="h-7 w-12 rounded bg-slate-300 dark:bg-white/[0.12]" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-amber-200/80 dark:bg-amber-700/60" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
            <div className="h-7 w-10 rounded bg-amber-200/80 dark:bg-amber-800/60" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-sky-200/80 dark:bg-sky-700/60" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
            <div className="h-7 w-10 rounded bg-sky-200/80 dark:bg-sky-700/60" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-md bg-emerald-200/80 dark:bg-emerald-700/60" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-18 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
              <div className="h-7 w-10 rounded bg-emerald-200/80 dark:bg-emerald-700/60" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-10 rounded bg-emerald-100 dark:bg-emerald-950/40 ml-auto" />
            <div className="h-2.5 w-12 rounded bg-slate-100 dark:bg-white/[0.05] ml-auto" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-md h-10 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center px-3.5 gap-3">
            <div className="w-4 h-4 rounded bg-slate-300 dark:bg-white/[0.12] shrink-0" />
            <div className="h-3.5 w-48 rounded bg-slate-200/70 dark:bg-white/[0.08]" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-9 w-32 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between px-3">
              <div className="h-3 w-20 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-white/[0.12]" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-white/[0.12]" />
            </div>
            <div className="h-9 w-32 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between px-3">
              <div className="h-3 w-22 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-white/[0.12]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.06] overflow-x-auto">
          <div className="h-7 w-24 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 flex items-center justify-center gap-2 px-3">
            <div className="h-3 w-12 rounded bg-white/40 dark:bg-white/20" />
            <div className="w-4 h-4 rounded-full bg-white/30 dark:bg-white/20" />
          </div>
          {[
            { w: 'w-20', bw: 'w-8' },
            { w: 'w-28', bw: 'w-14' },
            { w: 'w-20', bw: 'w-8' },
          ].map((tab, idx) => (
            <div key={idx} className={`h-7 ${tab.w} rounded-xl bg-slate-100/80 dark:bg-white/[0.04] flex items-center justify-center gap-2 px-3`}>
              <div className={`h-3 ${tab.bw} rounded bg-slate-200/80 dark:bg-white/[0.08]`} />
              <div className="w-4 h-4 rounded-full bg-slate-200/60 dark:bg-white/[0.08]" />
            </div>
          ))}
        </div>
      </div>

      <ActionItemsCardsSkeleton count={4} />
    </div>
  );
};
