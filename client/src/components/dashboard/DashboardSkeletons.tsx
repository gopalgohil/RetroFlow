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
      <SessionCardsSkeleton count={4} />
    </div>
  );
};

/**
 * SessionCardsSkeleton:
 * Standalone grid skeleton of Retrospective Session cards
 */
export const SessionCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
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
      {/* Top Header Banner Skeleton (Light Theme) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 rounded-full bg-indigo-100/80" />
            <div className="h-4 w-32 rounded-md bg-slate-200/60" />
          </div>
          <div className="h-7 sm:h-8 w-3/4 max-w-md rounded-xl bg-slate-200/80" />
          <div className="space-y-2 pt-0.5">
            <div className="h-3.5 w-full rounded-md bg-slate-100" />
            <div className="h-3.5 w-4/5 rounded-md bg-slate-100" />
          </div>
        </div>

        <div className="h-10 w-44 rounded-xl bg-indigo-100/80 shrink-0 self-start sm:self-auto" />
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
      <ProjectCardsSkeleton count={3} />
    </div>
  );
};

/**
 * ProjectCardsSkeleton:
 * Standalone grid skeleton of Agile Project cards
 */
export const ProjectCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
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
  );
};

/**
 * SprintCardsSkeleton:
 * Standalone list skeleton of Sprint cards
 */
export const SprintCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded-md bg-slate-200" />
                <div className="h-5 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="h-3.5 w-72 rounded bg-slate-100" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-36 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="h-8 w-44 rounded-xl bg-slate-100 shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * ActionItemsSkeleton:
 * Exactly matches the Retrospective Action Items Tab UI:
 * 1. Top Header Overview Banner (with Retrospective Action Engine badge & My/Team toggle)
 * 2. 4 Top Summary KPI Stat Cards Grid (Total, To Do, In Progress, Done)
 * 3. Filter & Control Toolbar (Search box, 3 dropdown selects, status tabs strip)
 * 4. Action Item Cards list (Checkbox, title, priority, description, context badges, status button, avatar)
 */
export const ActionItemsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header Overview Banner Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100/90 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl w-full">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 rounded-full bg-indigo-100/90" />
            <div className="h-4 w-28 rounded-md bg-slate-200/70" />
          </div>
          <div className="h-8 w-64 sm:w-80 rounded-xl bg-slate-300/80" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full max-w-xl rounded-md bg-slate-200/60" />
            <div className="h-3.5 w-4/5 max-w-md rounded-md bg-slate-200/60" />
          </div>
        </div>

        {/* Action Toggle Button Skeleton */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs shrink-0">
          <div className="h-7 w-28 rounded-xl bg-indigo-600/30" />
          <div className="h-7 w-28 rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* 2. Top Summary KPI Stats Grid Skeleton (Matches ActionItemsMetrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-indigo-200/80" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80" />
            <div className="h-7 w-12 rounded bg-slate-300" />
          </div>
        </div>

        {/* Metric 2: To Do / Pending */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-amber-200/80" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 rounded bg-slate-200/80" />
            <div className="h-7 w-10 rounded bg-amber-200/80" />
          </div>
        </div>

        {/* Metric 3: In Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-md bg-sky-200/80" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-slate-200/80" />
            <div className="h-7 w-10 rounded bg-sky-200/80" />
          </div>
        </div>

        {/* Metric 4: Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-md bg-emerald-200/80" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-18 rounded bg-slate-200/80" />
              <div className="h-7 w-10 rounded bg-emerald-200/80" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-10 rounded bg-emerald-100 ml-auto" />
            <div className="h-2.5 w-12 rounded bg-slate-100 ml-auto" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Control Toolbar Skeleton (Matches ActionItemsFilters) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box Skeleton */}
          <div className="flex-1 max-w-md h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center px-3.5 gap-3">
            <div className="w-4 h-4 rounded bg-slate-300 shrink-0" />
            <div className="h-3.5 w-48 rounded bg-slate-200/70" />
          </div>

          {/* Filter Dropdowns Skeleton */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-9 w-32 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between px-3">
              <div className="h-3 w-20 rounded bg-slate-200/80" />
              <div className="w-3 h-3 rounded bg-slate-300" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200/80" />
              <div className="w-3 h-3 rounded bg-slate-300" />
            </div>
            <div className="h-9 w-32 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between px-3">
              <div className="h-3 w-22 rounded bg-slate-200/80" />
              <div className="w-3 h-3 rounded bg-slate-300" />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs Strip Skeleton */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          <div className="h-7 w-24 rounded-xl bg-indigo-600/30 flex items-center justify-center gap-2 px-3">
            <div className="h-3 w-12 rounded bg-white/40" />
            <div className="w-4 h-4 rounded-full bg-white/30" />
          </div>
          {[
            { w: 'w-20', bw: 'w-8' },
            { w: 'w-28', bw: 'w-14' },
            { w: 'w-20', bw: 'w-8' },
          ].map((tab, idx) => (
            <div key={idx} className={`h-7 ${tab.w} rounded-xl bg-slate-100/80 flex items-center justify-center gap-2 px-3`}>
              <div className={`h-3 ${tab.bw} rounded bg-slate-200/80`} />
              <div className="w-4 h-4 rounded-full bg-slate-200/60" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Items List Cards Skeleton */}
      <ActionItemsCardsSkeleton count={4} />
    </div>
  );
};

/**
 * ActionItemsCardsSkeleton:
 * Exactly matches ActionItemCard component structure:
 * - Status Cycle checkbox square
 * - Title, Priority tag, Description preview line, 3 Context tags
 * - Due date urgency pill, status dropdown button, assignee avatar
 */
export const ActionItemsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          {/* Left: Checkbox & Details */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Status Checkbox Square */}
            <div className="mt-0.5 w-6 h-6 rounded-lg border-2 border-slate-200 bg-slate-50 shrink-0" />

            {/* Title, Description & Metadata Badges */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* Title & Priority Badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`h-4 ${i % 2 === 0 ? 'w-3/5 sm:w-72' : 'w-4/5 sm:w-96'} rounded-md bg-slate-200`} />
                <div className="h-4.5 w-14 rounded-md bg-amber-50 border border-amber-200/80" />
              </div>

              {/* Description preview */}
              <div className={`h-3 ${i % 2 === 0 ? 'w-5/6 sm:w-3/4' : 'w-2/3 sm:w-1/2'} rounded bg-slate-100`} />

              {/* Context Badges: Project, Retro, Sprint */}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div className="h-5 w-18 rounded-md bg-slate-100 border border-slate-200/70" />
                <div className="h-5 w-32 rounded-md bg-indigo-50 border border-indigo-200/70" />
                <div className="h-5 w-24 rounded-md bg-slate-50 border border-slate-200/70" />
              </div>
            </div>
          </div>

          {/* Right: Due Date Pill, Status Cycle Button, Assignee Avatar */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            {/* Due date urgency badge */}
            <div className="h-6 w-20 rounded-lg bg-slate-100 border border-slate-200/70" />

            {/* Status selector button */}
            <div className="h-8 w-28 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between px-3">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="w-3 h-3 rounded bg-slate-300" />
            </div>

            {/* Assignee Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200/80 shrink-0" />
          </div>
        </div>
      ))}
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
    case 'action_items':
      return <ActionItemsSkeleton />;
    case 'projects':
      return <ProjectsTabSkeleton />;
    case 'members':
      return <MembersSkeleton />;
    case 'sessions':
    default:
      return <SessionsSkeleton />;
  }
};

/**
 * DashboardLayoutSkeleton:
 * Full-page skeleton representing the complete dashboard chrome on initial reload/suspense:
 * - Left fixed sidebar skeleton
 * - Top header bar skeleton
 * - Contextual tab content skeleton
 */
export const DashboardLayoutSkeleton: React.FC<{ tab?: string }> = ({ tab = 'sessions' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex font-sans">
      {/* Sidebar Skeleton (fixed on large screens) */}
      <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 hidden lg:flex flex-col p-6 animate-pulse">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/80" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-2.5 w-16 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Live Status Pill Skeleton */}
        <div className="mt-6 p-3 rounded-xl bg-slate-50/80 border border-slate-100 h-11" />

        {/* Nav Items Skeleton */}
        <div className="mt-6 space-y-2 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-100/70 flex items-center px-3.5 gap-3">
              <div className="w-4 h-4 rounded-md bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* User Footer Skeleton */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-2.5 w-28 bg-slate-100 rounded" />
          </div>
        </div>
      </aside>

      {/* Main Workspace Area Skeleton */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header Skeleton */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-slate-100" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-32 rounded-xl bg-indigo-100/70" />
            <div className="w-9 h-9 rounded-full bg-slate-200" />
          </div>
        </header>

        {/* Dynamic Tab Body Skeleton */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          <TabSkeleton tab={tab} />
        </main>
      </div>
    </div>
  );
};
