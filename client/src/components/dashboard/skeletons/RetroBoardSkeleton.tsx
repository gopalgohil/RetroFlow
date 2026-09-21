'use client';

import React from 'react';
import Image from 'next/image';

/**
 * RetroBoardSkeleton:
 * Matches the Live Retrospective Session Board:
 * - Header with back arrow, sprint title, status pill, votes counter, and action buttons
 * - Horizontal columns canvas with column headers, sticky cards, and add card buttons
 */
export const RetroBoardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090a] text-slate-900 dark:text-white flex flex-col font-sans">
      {/* Top Header Skeleton: Real stable Logo badge, pulse ONLY the variable text lines */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#08090a]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-white/[0.08] px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors duration-200">
        {/* Left: Real Logo badge (Rock-solid, NEVER pulses or disappears on reload) + Title Skeleton */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div
            title="RetroFlow Retrospective Sessions"
            className="w-8 h-8 rounded-xl bg-[#5cb028] text-white flex items-center justify-center p-1.5 shadow-xs shrink-0 select-none font-bold dark:bg-[#88c958] dark:text-[#08090a]"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={24}
              height={24}
              className="w-full h-auto object-contain brightness-0 invert dark:invert-0"
              priority
              unoptimized
            />
          </div>

          <div className="space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-48 sm:w-64 rounded-lg bg-slate-200 dark:bg-[#141720]" />
              <div className="h-5 w-24 rounded-full bg-emerald-100 dark:bg-[#88c958]/20" />
            </div>
            <div className="h-3 w-40 sm:w-72 rounded bg-slate-100 dark:bg-[#12151c]" />
          </div>
        </div>

        {/* Right: Badges & Buttons */}
        <div className="flex items-center gap-3 animate-pulse">
          <div className="hidden sm:block h-8 w-36 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/20 border border-[#cdeac0] dark:border-[#88c958]/30" />
          <div className="hidden md:block h-8 w-32 rounded-xl bg-slate-100 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08]" />
          <div className="h-9 w-36 rounded-xl bg-[#88c958]/30" />
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
              className="flex-1 min-w-[220px] rounded-2xl bg-white/95 dark:bg-[#0e1015] backdrop-blur-sm border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col overflow-hidden transition-all"
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
                    <div className={`h-3.5 ${col.titleWidth} rounded bg-slate-300 dark:bg-slate-700`} />
                  </div>
                  <div className="h-4 w-5 rounded-full bg-white/80 dark:bg-[#141720]" />
                </div>
                <div className="h-2 w-32 rounded bg-slate-200/70 dark:bg-[#141720] ml-8" />
              </div>

              {/* Cards List Skeleton */}
              <div className="p-2.5 space-y-2 min-h-[220px]">
                {Array.from({ length: col.cardCount }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    style={{ borderLeftColor: col.color }}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] border-l-[3.5px] shadow-2xs space-y-2"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-[#141720]" />
                      <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-[#141720]" />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/[0.05]">
                      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-[#141720]" />
                      <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-[#141720]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note Button Skeleton */}
              <div className="p-3.5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#12151c]/60">
                <div className="h-9 w-full rounded-xl bg-slate-200/80 dark:bg-[#141720]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
