'use client';

import React from 'react';
import { RetroCardSkeleton } from './tabs/retros/RetroCardSkeleton';

export const ProjectBannerSkeleton: React.FC<{ activeTab?: string }> = ({ activeTab = 'overview' }) => {
  return (
    <div className="bg-white dark:bg-[#08090a] border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#88c958]/20 shrink-0 border border-[#88c958]/30" />

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-52 sm:w-72 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-5 w-14 rounded-md bg-slate-100 dark:bg-white/[0.05]" />
              <div className="h-5 w-20 rounded-full bg-emerald-100/70 dark:bg-[#88c958]/15 border border-[#88c958]/25" />
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="h-3.5 w-full max-w-xl rounded bg-slate-100 dark:bg-white/[0.05]" />
              <div className="h-3.5 w-3/4 max-w-md rounded bg-slate-100 dark:bg-white/[0.05]" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-3 w-32 rounded bg-slate-200/80 dark:bg-white/[0.08]" />
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-white/[0.05]" />
              <div className="h-3 w-28 rounded bg-slate-100 dark:bg-white/[0.05]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0e1015] p-2 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shrink-0">
          <div className="px-3 py-1.5 text-center space-y-1">
            <div className="h-2.5 w-10 mx-auto rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-4 w-6 mx-auto rounded bg-slate-300 dark:bg-white/[0.12]" />
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/[0.08]" />
          <div className="px-3 py-1.5 text-center space-y-1">
            <div className="h-2.5 w-10 mx-auto rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-4 w-6 mx-auto rounded bg-[#cdeac0] dark:bg-[#88c958]/30" />
          </div>
        </div>
      </div>

      <div className="w-full mt-6 pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', width: 'w-24' },
          { id: 'sprints', label: 'Sprints & Backlog', width: 'w-36' },
          { id: 'retros', label: 'Retrospectives', width: 'w-32' },
          { id: 'team', label: 'Team & Settings', width: 'w-32' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              className={`h-9 ${tab.width} rounded-xl ${
                isSelected ? 'bg-[#5cb028] dark:bg-[#88c958]' : 'bg-slate-100 dark:bg-white/[0.04]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const OverviewTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-white/[0.08]" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05]" />
            </div>
            <div className="h-6 w-32 rounded-lg bg-slate-300 dark:bg-white/[0.12]" />
            <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-white/[0.05] pt-1" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-3 w-56 rounded bg-slate-100 dark:bg-white/[0.05]" />
          </div>
          <div className="h-6 w-24 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30" />
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/[0.05]" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]" />
          <div className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]" />
          <div className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/[0.08]" />
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]" />
            ))}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/[0.08]" />
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SprintsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.03] p-1 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
          ))}
        </div>
        <div className="h-4 w-28 rounded bg-slate-100 dark:bg-white/[0.05]" />
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded-full bg-emerald-100/70 dark:bg-[#88c958]/20" />
                <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div className="h-3.5 w-64 rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
                    <div className="h-5 w-8 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RetrosTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-end">
        <div className="h-9 w-36 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 border border-[#5cb028]/30 dark:border-[#88c958]/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 2xl:gap-5">
        {[1, 2, 3].map((i) => (
          <RetroCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const TeamTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-3 w-64 rounded bg-slate-100 dark:bg-white/[0.05]" />
          </div>
          <div className="h-9 w-36 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 border border-[#5cb028]/30 dark:border-[#88c958]/30" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.08]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.08]" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="h-2.5 w-48 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </div>
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-5">
        <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="h-5 w-40 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
          <div className="h-3 w-60 rounded bg-slate-100 dark:bg-white/[0.05]" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-10 w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 rounded bg-slate-200 dark:bg-white/[0.08]" />
            <div className="h-20 w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-[#5cb028]/20 dark:bg-[#88c958]/20 border border-[#5cb028]/30 dark:border-[#88c958]/30" />
        </div>
      </div>
    </div>
  );
};

export const ProjectDetailSkeleton: React.FC<{
  activeTab?: 'overview' | 'sprints' | 'retros' | 'team';
}> = ({ activeTab = 'overview' }) => {
  return (
    <div className="animate-in fade-in duration-150">
      <ProjectBannerSkeleton activeTab={activeTab} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {activeTab === 'overview' && <OverviewTabSkeleton />}
        {activeTab === 'sprints' && <SprintsTabSkeleton />}
        {activeTab === 'retros' && <RetrosTabSkeleton />}
        {activeTab === 'team' && <TeamTabSkeleton />}
      </main>
    </div>
  );
};

export default ProjectDetailSkeleton;
