'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TabSkeleton } from './TabSkeleton';

export const DashboardLayoutSkeleton: React.FC<{ tab?: string }> = ({ tab = 'sessions' }) => {
  return (
    <div className="min-h-screen dark:bg-[#08090a] bg-[#F8FAFC] text-slate-900 dark:text-white flex selection:bg-[#88c958] selection:text-[#08090a] font-sans transition-colors duration-200">
      <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#08090a] border-r border-slate-200/80 dark:border-white/[0.08] hidden lg:flex flex-col">
        <div className="h-16 flex items-center pl-[38px] pr-6 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center cursor-pointer select-none"
            title="Go to Retrospective Sessions"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={140}
              height={42}
              className="h-9 sm:h-[38px] w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        <div className="px-4 pt-12 pb-6 flex-1 overflow-y-auto space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] flex items-center px-3.5 gap-3">
              <div className="w-[18px] h-[18px] rounded-md bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-white/[0.08]" />
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#08090a]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="h-9 w-40 rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="flex items-center gap-2.5 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
            <div className="h-9 w-32 rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />
          </div>
        </header>

        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 xl:px-6 2xl:px-8 py-5 sm:py-6 lg:py-8 w-full space-y-6 sm:space-y-8">
          <TabSkeleton tab={tab} />
        </main>
      </div>
    </div>
  );
};
