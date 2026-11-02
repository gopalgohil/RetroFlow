'use client';

import React from 'react';

export const ProjectCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#eaf5e3] dark:bg-[#88c958]/20 shrink-0 border border-[#88c958]/30" />
                <div className="space-y-1.5">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-white/[0.08] rounded-md" />
                  <div className="h-3.5 w-20 bg-slate-100 dark:bg-white/[0.05] rounded" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-emerald-100/70 dark:bg-[#88c958]/15 border border-[#88c958]/25" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/[0.08] shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-white/[0.08] rounded" />
                <div className="h-3 w-24 bg-slate-300 dark:bg-white/[0.12] rounded" />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full bg-slate-100 dark:bg-white/[0.05] rounded" />
              <div className="h-3 w-4/5 bg-slate-100 dark:bg-white/[0.05] rounded" />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-white/[0.08] rounded" />
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-white/[0.08] rounded" />
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-white/[0.08] rounded-full" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-center space-y-1">
                  <div className="h-2 w-10 bg-slate-200 dark:bg-white/[0.08] rounded mx-auto" />
                  <div className="h-4 w-6 bg-slate-300 dark:bg-white/[0.12] rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>

          <div className="h-11 w-full rounded-2xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 border border-[#5cb028]/30 dark:border-[#88c958]/30 mt-2" />
        </div>
      ))}
    </div>
  );
};

export const ProjectsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#eaf5e3]/60 via-slate-50 to-white dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#0e1015] border border-[#cdeac0]/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30" />
            <div className="h-4 w-32 rounded-md bg-slate-200/60 dark:bg-white/[0.06]" />
          </div>
          <div className="h-7 sm:h-8 w-3/4 max-w-md rounded-xl bg-slate-200/80 dark:bg-white/[0.08]" />
          <div className="space-y-2 pt-0.5">
            <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-white/[0.04]" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </div>

        <div className="h-10 w-44 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 border border-[#5cb028]/30 dark:border-[#88c958]/30 shrink-0 self-start sm:self-auto" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] rounded-xl w-fit">
          <div className="h-7 w-28 rounded-lg bg-slate-200/80 dark:bg-white/[0.08]" />
        </div>
        <div className="h-4 w-36 rounded bg-slate-200/50 dark:bg-white/[0.05]" />
      </div>

      <ProjectCardsSkeleton count={3} />
    </div>
  );
};

export const SprintCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.08] shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded-md bg-slate-200 dark:bg-white/[0.08]" />
                <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-white/[0.05]" />
              </div>
              <div className="h-3.5 w-72 rounded bg-slate-100 dark:bg-white/[0.05]" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-36 rounded bg-slate-100 dark:bg-white/[0.05]" />
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-white/[0.05]" />
              </div>
            </div>
          </div>
          <div className="h-8 w-44 rounded-xl bg-slate-100 dark:bg-white/[0.08] shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const ProjectTableSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.02] text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-4 px-5 sm:px-6">Project</th>
              <th className="py-4 px-5">Manager / Lead</th>
              <th className="py-4 px-5 min-w-[220px]">Active Sprint</th>
              <th className="py-4 px-3.5 text-center">Sprints</th>
              <th className="py-4 px-3.5 text-center">Retros</th>
              <th className="py-4 px-3.5 text-center">Members</th>
              <th className="py-4 px-5 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-5 px-5 sm:px-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/[0.08]" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-white/[0.08] rounded-md" />
                      <div className="h-3 w-20 bg-slate-100 dark:bg-white/[0.05] rounded" />
                    </div>
                  </div>
                </td>
                <td className="py-5 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-white/[0.08] rounded" />
                      <div className="h-3 w-28 bg-slate-100 dark:bg-white/[0.05] rounded" />
                    </div>
                  </div>
                </td>
                <td className="py-5 px-5">
                  <div className="space-y-2 max-w-[200px]">
                    <div className="h-3.5 w-28 bg-slate-200 dark:bg-white/[0.08] rounded" />
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.05] rounded-full" />
                  </div>
                </td>
                <td className="py-5 px-3.5 text-center">
                  <div className="h-6 w-10 bg-slate-100 dark:bg-white/[0.05] rounded-lg mx-auto" />
                </td>
                <td className="py-5 px-3.5 text-center">
                  <div className="h-6 w-10 bg-slate-100 dark:bg-white/[0.05] rounded-lg mx-auto" />
                </td>
                <td className="py-5 px-3.5 text-center">
                  <div className="h-6 w-10 bg-slate-100 dark:bg-white/[0.05] rounded-lg mx-auto" />
                </td>
                <td className="py-5 px-5 sm:px-6 text-right">
                  <div className="h-8 w-20 bg-slate-200 dark:bg-white/[0.08] rounded-xl ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
