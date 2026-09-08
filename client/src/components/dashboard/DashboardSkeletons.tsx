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
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 items-start min-w-max pb-6">
          {[
            { color: '#10B981', titleWidth: 'w-32', cardCount: 3 },
            { color: '#EF4444', titleWidth: 'w-44', cardCount: 2 },
            { color: '#06B6D4', titleWidth: 'w-28', cardCount: 2 },
            { color: '#8B5CF6', titleWidth: 'w-36', cardCount: 1 },
          ].map((col, idx) => (
            <div
              key={idx}
              className="w-80 sm:w-96 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-sm flex flex-col shrink-0 overflow-hidden"
            >
              {/* Column Top Header */}
              <div
                style={{ backgroundColor: `${col.color}15`, borderBottomColor: `${col.color}30` }}
                className="p-4 border-b space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: col.color }}
                      className="w-7 h-7 rounded-lg opacity-80"
                    />
                    <div className={`h-4 ${col.titleWidth} rounded bg-slate-300`} />
                  </div>
                  <div className="h-5 w-6 rounded-full bg-white/80" />
                </div>
                <div className="h-2.5 w-48 rounded bg-slate-200/70 ml-9" />
              </div>

              {/* Cards List Skeleton */}
              <div className="p-3.5 space-y-3 min-h-[340px]">
                {Array.from({ length: col.cardCount }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    style={{ borderLeftColor: col.color }}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 border-l-4 shadow-2xs space-y-2.5"
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

interface TabSkeletonProps {
  tab: string;
}

/**
 * Dynamically renders the component-matched skeleton loader based on the active tab
 */
export const TabSkeleton: React.FC<TabSkeletonProps> = ({ tab }) => {
  switch (tab) {
    case 'members':
      return <MembersSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'sessions':
    default:
      return <SessionsSkeleton />;
  }
};
