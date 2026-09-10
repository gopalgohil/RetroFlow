'use client';

import React from 'react';

/**
 * ProjectBannerSkeleton:
 * Matches the project detail summary banner and tab navigation strip.
 */
export const ProjectBannerSkeleton: React.FC<{ activeTab?: string }> = ({ activeTab = 'overview' }) => {
  return (
    <div className="bg-white border-b border-slate-200/80 px-6 py-6 sm:px-8 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Project Key Avatar Skeleton */}
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 shrink-0" />

          <div className="space-y-2 flex-1 min-w-0">
            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-52 sm:w-72 rounded-lg bg-slate-200" />
              <div className="h-5 w-14 rounded-md bg-slate-100" />
              <div className="h-5 w-20 rounded-full bg-emerald-100/70" />
            </div>

            {/* Description lines */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-3.5 w-full max-w-xl rounded bg-slate-100" />
              <div className="h-3.5 w-3/4 max-w-md rounded bg-slate-100" />
            </div>

            {/* Sub-meta */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-3 w-32 rounded bg-slate-200/80" />
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shrink-0">
          <div className="px-3 py-1.5 text-center space-y-1">
            <div className="h-2.5 w-10 mx-auto rounded bg-slate-200" />
            <div className="h-4 w-6 mx-auto rounded bg-slate-300" />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="px-3 py-1.5 text-center space-y-1">
            <div className="h-2.5 w-10 mx-auto rounded bg-slate-200" />
            <div className="h-4 w-6 mx-auto rounded bg-indigo-200" />
          </div>
        </div>
      </div>

      {/* Tab Navigation Strip Skeleton */}
      <div className="max-w-7xl mx-auto mt-6 pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
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
                isSelected ? 'bg-indigo-600/90' : 'bg-slate-100'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * OverviewTabSkeleton:
 * Matches the Overview tab KPI grid, active sprint highlight, and retros timeline.
 */
export const OverviewTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Lead Recognition Banner Skeleton */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-200/80 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-44 rounded bg-amber-200" />
            <div className="h-3 w-80 max-w-sm rounded bg-amber-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 rounded-xl bg-white border border-amber-200" />
          <div className="h-7 w-28 rounded-xl bg-amber-200" />
        </div>
      </div>

      {/* 4 KPI Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-6 w-32 rounded-lg bg-slate-300" />
            <div className="h-2.5 w-full rounded bg-slate-100 pt-1" />
          </div>
        ))}
      </div>

      {/* Active Sprint Delivery Card Skeleton */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
          <div className="h-6 w-24 rounded-full bg-indigo-50 border border-indigo-100" />
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
          <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
          <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
        </div>
      </div>

      {/* Retrospectives & Timeline Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-4 w-44 rounded bg-slate-200" />
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-4 w-44 rounded bg-slate-200" />
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SprintsTabSkeleton:
 * Matches Sprints & Backlog tab.
 */
export const SprintsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 rounded-lg bg-slate-200" />
          ))}
        </div>
        <div className="h-4 w-28 rounded bg-slate-100" />
      </div>

      {/* Sprints List (2 cards) */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded-full bg-emerald-100/70" />
                <div className="h-8 w-28 rounded-xl bg-indigo-100" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="h-3.5 w-64 rounded bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 rounded-full bg-slate-200" />
                    <div className="h-5 w-8 rounded-full bg-slate-200" />
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

/**
 * RetrosTabSkeleton:
 * Matches Retrospectives tab.
 */
export const RetrosTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-5 w-48 rounded-lg bg-slate-200" />
          <div className="h-3.5 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-indigo-200" />
      </div>

      {/* Retros Grid (4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-full bg-emerald-100/70" />
              <div className="h-3.5 w-24 rounded bg-slate-100" />
            </div>

            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
              <div className="h-3.5 w-full rounded bg-slate-100" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
              <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
              <div className="h-12 rounded-xl bg-slate-50 border border-slate-100" />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-8 w-28 rounded-xl bg-slate-100" />
              <div className="h-8 w-28 rounded-xl bg-indigo-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * TeamTabSkeleton:
 * Matches Team & Settings tab.
 */
export const TeamTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Section 1: Team Members Directory Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded-lg bg-slate-200" />
            <div className="h-3 w-64 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-36 rounded-xl bg-indigo-200" />
        </div>

        {/* Members Table Rows */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-slate-200" />
                  <div className="h-2.5 w-48 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: General Configuration Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="space-y-1.5 pb-3 border-b border-slate-100">
          <div className="h-5 w-40 rounded-lg bg-slate-200" />
          <div className="h-3 w-60 rounded bg-slate-100" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 rounded bg-slate-200" />
            <div className="h-20 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-indigo-200" />
        </div>
      </div>
    </div>
  );
};

/**
 * Complete ProjectDetailSkeleton component:
 * Renders the banner skeleton and the active tab's specific skeleton.
 */
export const ProjectDetailSkeleton: React.FC<{
  activeTab?: 'overview' | 'sprints' | 'retros' | 'team';
}> = ({ activeTab = 'overview' }) => {
  return (
    <div className="animate-in fade-in duration-150">
      <ProjectBannerSkeleton activeTab={activeTab} />
      <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' && <OverviewTabSkeleton />}
        {activeTab === 'sprints' && <SprintsTabSkeleton />}
        {activeTab === 'retros' && <RetrosTabSkeleton />}
        {activeTab === 'team' && <TeamTabSkeleton />}
      </main>
    </div>
  );
};

export default ProjectDetailSkeleton;
