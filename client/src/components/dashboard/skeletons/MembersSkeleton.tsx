'use client';

import React from 'react';

export interface MembersSkeletonProps {
  isAdmin?: boolean;
}

/**
 * Members Skeleton:
 * Matches Team Members & Directory Tab layout:
 * - Top Section Header (Title & Subtitle)
 * - Roster List Card Header (Title, Counter text, Search bar)
 * - Table Header & Rows Skeleton
 */
export const MembersSkeleton: React.FC<MembersSkeletonProps> = ({ isAdmin = false }) => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#5cb028]/20 dark:bg-[#88c958]/20 shrink-0" />
            <div className="h-7 w-48 rounded-xl bg-slate-200/80 dark:bg-white/[0.08]" />
          </div>
          <div className="h-3.5 w-80 max-w-full rounded-md bg-slate-100 dark:bg-white/[0.04]" />
        </div>
      </div>

      {/* 2. Main Roster List Card */}
      <div className="rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] shadow-xs overflow-hidden">
        {/* Card Header with Counter and Search */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded bg-[#5cb028]/20 dark:bg-[#88c958]/20 shrink-0" />
            <div className="h-4 w-52 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
          </div>

          {/* Right Section: Counter Text & Live Search Bar */}
          <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto">
            <div className="h-3.5 w-28 rounded bg-slate-200/60 dark:bg-white/[0.05]" />
            <div className="h-8 w-full sm:w-64 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06]" />
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-[#12151c]/70 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-white/[0.08]">
              <tr>
                <th className="px-6 py-3.5">Member Name</th>
                <th className="px-6 py-3.5">Assigned Projects</th>
                <th className="px-6 py-3.5">Project Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Activity</th>
                {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-white/[0.06] shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-200/80 dark:bg-white/[0.06] rounded-md" />
                      <div className="h-2.5 w-20 bg-slate-100 dark:bg-white/[0.03] rounded-md" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-24 bg-slate-100 dark:bg-white/[0.06] rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-slate-100 dark:bg-white/[0.06] rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-14 bg-slate-100 dark:bg-white/[0.06] rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 w-12 bg-slate-100 dark:bg-white/[0.06] rounded ml-auto" />
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="h-7 w-16 bg-slate-100 dark:bg-white/[0.06] rounded-xl ml-auto" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
