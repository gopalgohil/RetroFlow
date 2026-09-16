'use client';

import React from 'react';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top 4 KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-32 rounded-3xl bg-slate-100/80 border border-slate-200/60 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-200" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            <div className="h-2 w-full bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>

      {/* Session Trends Skeleton */}
      <div className="h-64 rounded-3xl bg-slate-100/80 border border-slate-200/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      </div>

      {/* Members Table Skeleton */}
      <div className="h-96 rounded-3xl bg-slate-100/80 border border-slate-200/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-8 w-60 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-10 w-full bg-slate-200/70 rounded-xl" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 w-full bg-slate-200/60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
