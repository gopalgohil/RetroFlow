import React from 'react';
import { ProjectDetailSkeleton } from '@/components/project/ProjectSkeletons';

export default function ProjectLoading() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Placeholder Skeleton */}
      <aside className="w-64 bg-slate-900 shrink-0 hidden lg:flex flex-col border-r border-slate-800 animate-pulse">
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-2.5 w-16 bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-slate-800/60" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-44 rounded-xl bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded-xl bg-slate-100" />
            <div className="w-9 h-9 rounded-xl bg-slate-100" />
          </div>
        </header>

        {/* Component-matched Project Detail Skeleton (Banner + Overview tab) */}
        <ProjectDetailSkeleton activeTab="overview" />
      </div>
    </div>
  );
}
