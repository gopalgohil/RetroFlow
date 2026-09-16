'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Calendar, ArrowUpRight, MessageSquare, CheckSquare } from 'lucide-react';
import { RetroTrendItem } from './types';

interface AnalyticsSessionTrendsProps {
  trends: RetroTrendItem[];
  selectedProjectName: string;
}

export const AnalyticsSessionTrends: React.FC<AnalyticsSessionTrendsProps> = ({
  trends,
  selectedProjectName,
}) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            Retrospective Session Trends
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {trends.length} recent sessions
        </span>
      </div>

      {/* Grid of Retro Session Cards */}
      {trends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
          {trends.map((retro) => (
            <div
              key={retro.id}
              className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/70 hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {retro.sprintName}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1.5" title={retro.title}>
                    {retro.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(retro.date)}</span>
                  </p>
                </div>

                <Link
                  href={`/retro/${retro.shareToken}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer"
                  title="Open retro board"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Turnout Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600">Turnout</span>
                  <span className="font-bold text-slate-800">
                    {retro.attendeesCount} / {retro.expectedCount} ({retro.attendanceRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      retro.attendanceRate >= 80
                        ? 'bg-emerald-500'
                        : retro.attendanceRate >= 60
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, retro.attendanceRate)}%` }}
                  />
                </div>
              </div>

              {/* Bottom Metadata Badges */}
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{retro.cardsCount} cards</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{retro.actionItemsCount} action items</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-50 text-center space-y-2 border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            No retrospective sessions found for {selectedProjectName}.
          </p>
          <p className="text-[11px] text-slate-400">
            Create a new retro session to begin capturing real-time attendance trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSessionTrends;
