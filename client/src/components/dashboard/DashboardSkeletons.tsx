'use client';

import React from 'react';

/**
 * Sessions Skeleton:
 * Matches the Retrospective Sessions Tab:
 * - Top Banner Overview Card
 * - Filter & Action Bar
 * - 4 Retrospective Session Cards Grid
 */
export const SessionsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Overview Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-100/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          {/* Engine Pill Badge */}
          <div className="h-6 w-32 rounded-full bg-indigo-100/90" />
          {/* Main Hub Title */}
          <div className="h-8 w-3/4 max-w-md rounded-xl bg-slate-200/90" />
          {/* Subtitle Description Lines */}
          <div className="space-y-2 pt-1">
            <div className="h-3.5 w-full rounded-md bg-slate-100" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-100" />
          </div>
        </div>

        {/* Right Stats Box Skeleton */}
        <div className="hidden md:flex flex-col gap-2.5 shrink-0 bg-white/90 p-4 rounded-xl border border-indigo-100/80 shadow-xs w-52">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-2.5 w-14 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-2.5 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 rounded-lg bg-slate-200/70" />
          ))}
        </div>
        <div className="h-4 w-32 rounded bg-slate-100" />
      </div>

      {/* Sessions Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4"
          >
            {/* Top Row: Status pill & Date */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-full bg-emerald-100/70" />
              <div className="h-3.5 w-24 rounded bg-slate-100" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-2/3 rounded bg-slate-100" />
            </div>

            {/* Configured Topics */}
            <div className="space-y-2 pt-1">
              <div className="h-2.5 w-28 rounded bg-slate-100" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-6 w-28 rounded-lg bg-indigo-50 border border-indigo-100" />
                <div className="h-6 w-24 rounded-lg bg-emerald-50 border border-emerald-100" />
                <div className="h-6 w-20 rounded-lg bg-rose-50 border border-rose-100" />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-28 rounded-xl bg-indigo-200/80" />
                <div className="h-8 w-28 rounded-xl bg-slate-100" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100" />
                <div className="w-7 h-7 rounded-lg bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Members Skeleton:
 * Matches Team Members & Whitelist Tab
 */
export const MembersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Section Header */}
      <div className="border-b border-slate-200 pb-4 space-y-1.5">
        <div className="h-6 w-52 rounded-lg bg-slate-200" />
        <div className="h-3.5 w-80 rounded-md bg-slate-100" />
      </div>

      {/* Main Roster Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="h-3 w-64 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-6 w-28 rounded-full bg-emerald-50 border border-emerald-100" />
        </div>

        {/* Member Rows */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-slate-200" />
                  <div className="h-2.5 w-44 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-28 rounded-lg bg-indigo-50 border border-indigo-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Skeleton:
 * Matches Workspace Settings Tab
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      {/* Top Section Header */}
      <div className="border-b border-slate-200 pb-4 space-y-1.5">
        <div className="h-6 w-44 rounded-lg bg-slate-200" />
        <div className="h-3.5 w-72 rounded-md bg-slate-100" />
      </div>

      {/* Settings Form Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-36 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * RetroBoardSkeleton:
 * Matches the Live Retrospective Session Board:
 * - Header with back arrow, sprint title, status pill, votes counter, and action buttons
 * - Horizontal columns canvas with column headers, sticky cards, and add card buttons
 */
export const RetroBoardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex flex-col font-sans animate-pulse">
      {/* Top Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Back button + Title & Status */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-48 sm:w-64 rounded-lg bg-slate-200" />
              <div className="h-5 w-24 rounded-full bg-emerald-100" />
            </div>
            <div className="h-3 w-40 sm:w-72 rounded bg-slate-100" />
          </div>
        </div>

        {/* Right: Badges & Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block h-8 w-36 rounded-xl bg-indigo-50 border border-indigo-100" />
          <div className="hidden md:block h-8 w-32 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="h-9 w-36 rounded-xl bg-indigo-200" />
        </div>
      </header>

      {/* Columns Board Canvas Skeleton */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-x-auto w-full">
        <div className="flex gap-3 sm:gap-4 items-start w-full min-w-max md:min-w-0 pb-6">
          {[
            { color: '#10B981', titleWidth: 'w-24', cardCount: 3 },
            { color: '#EF4444', titleWidth: 'w-28', cardCount: 2 },
            { color: '#06B6D4', titleWidth: 'w-24', cardCount: 2 },
            { color: '#F59E0B', titleWidth: 'w-24', cardCount: 2 },
            { color: '#8B5CF6', titleWidth: 'w-24', cardCount: 1 },
          ].map((col, idx) => (
            <div
              key={idx}
              className="flex-1 min-w-[220px] rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-xs flex flex-col overflow-hidden transition-all"
            >
              {/* Column Top Header */}
              <div
                style={{ backgroundColor: `${col.color}15`, borderBottomColor: `${col.color}30` }}
                className="px-3 py-2.5 border-b space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: col.color }}
                      className="w-6 h-6 rounded-lg opacity-80"
                    />
                    <div className={`h-3.5 ${col.titleWidth} rounded bg-slate-300`} />
                  </div>
                  <div className="h-4 w-5 rounded-full bg-white/80" />
                </div>
                <div className="h-2 w-32 rounded bg-slate-200/70 ml-8" />
              </div>

              {/* Cards List Skeleton */}
              <div className="p-2.5 space-y-2 min-h-[220px]">
                {Array.from({ length: col.cardCount }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    style={{ borderLeftColor: col.color }}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 border-l-[3.5px] shadow-2xs space-y-2"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-full rounded bg-slate-200" />
                      <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                      <div className="h-6 w-16 rounded-lg bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note Button Skeleton */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
                <div className="h-9 w-full rounded-xl bg-slate-200/80" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

/**
 * ProjectsTabSkeleton:
 * Matches the Agile Projects Tab:
 * - Top Dark Header Banner Skeleton (with badge, title, subtitle, CTA button)
 * - View Filter Switcher Bar Skeleton
 * - 2/3 Agile Project Cards Grid Skeleton
 */
export const ProjectsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/80 to-indigo-950/80 border border-indigo-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 rounded-full bg-indigo-800/60" />
            <div className="h-4 w-32 rounded-md bg-slate-700/50" />
          </div>
          <div className="h-7 sm:h-8 w-3/4 max-w-md rounded-xl bg-slate-700/60" />
          <div className="space-y-2 pt-0.5">
            <div className="h-3.5 w-full rounded-md bg-slate-800/60" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-800/60" />
          </div>
        </div>

        <div className="h-10 w-44 rounded-xl bg-indigo-600/50 shrink-0 self-start sm:self-auto" />
      </div>

      {/* View Filter Switcher Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl w-fit">
          <div className="h-7 w-28 rounded-lg bg-slate-200/80" />
          <div className="h-7 w-36 rounded-lg bg-slate-200/60" />
        </div>
        <div className="h-4 w-36 rounded bg-slate-200/50" />
      </div>

      {/* Project Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Card Header: Icon + Name + Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100/70 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-36 bg-slate-200 rounded-md" />
                    <div className="h-3.5 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded-full bg-emerald-100/70" />
              </div>

              {/* Project Lead Pill Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-200 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-2.5 w-16 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-300 rounded" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-4/5 bg-slate-100 rounded" />
              </div>

              {/* Sprint Progress Box */}
              <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-20 bg-slate-200 rounded" />
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <div className="h-2 w-10 bg-slate-200 rounded mx-auto" />
                    <div className="h-4 w-6 bg-slate-300 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="h-11 w-full rounded-2xl bg-slate-200/80 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface TabSkeletonProps {
  tab: string;
}

/**
 * Dynamically renders the component-matched skeleton loader based on the active tab
 */
export const TabSkeleton: React.FC<TabSkeletonProps> = ({ tab }) => {
  switch (tab) {
    case 'projects':
      return <ProjectsTabSkeleton />;
    case 'members':
      return <MembersSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'sessions':
    default:
      return <SessionsSkeleton />;
  }
};
