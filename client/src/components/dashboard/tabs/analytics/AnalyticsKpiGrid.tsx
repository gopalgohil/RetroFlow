'use client';

import React from 'react';
import { TrendingUp, Calendar, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui';
import { AnalyticsSummary } from './types';

interface AnalyticsKpiGridProps {
  summary: AnalyticsSummary;
  selectedProjectName: string;
}

export const AnalyticsKpiGrid: React.FC<AnalyticsKpiGridProps> = ({
  summary,
  selectedProjectName,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Team Attendance Rate */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3 relative overflow-hidden group hover:border-[#88c958]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Avg. Attendance Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary.averageAttendanceRate}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                summary.averageAttendanceRate >= 80
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : summary.averageAttendanceRate >= 60
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}
            >
              {summary.averageAttendanceRate >= 80
                ? 'Optimal'
                : summary.averageAttendanceRate >= 60
                ? 'Moderate'
                : 'Low'}
            </span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.averageAttendanceRate >= 80
                  ? 'bg-[#88c958]'
                  : summary.averageAttendanceRate >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, summary.averageAttendanceRate)}%` }}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Across {summary.totalRetros} retrospective sessions
        </p>
      </div>

      {/* Card 2: Total Retros Conducted */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3 relative overflow-hidden group hover:border-[#88c958]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Retros
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {summary.totalRetros}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active in <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProjectName}</span>
          </p>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {summary.totalMembers} active team members evaluated
        </p>
      </div>

      {/* Card 3: Top Contributor */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#eaf5e3]/50 via-white to-white dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#12151c] border border-[#cdeac0] dark:border-white/[0.08] shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3d8318] dark:text-[#88c958] flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
            Top Contributor
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30">
            ⭐ Top Impact
          </span>
        </div>
        {summary.topContributor ? (
          <div className="flex items-center gap-3 pt-0.5">
            <UserAvatar
              name={summary.topContributor.name}
              email={summary.topContributor.email}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {summary.topContributor.name}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{summary.topContributor.attendanceRate}% Attendance</span>
                <span>•</span>
                <span>{summary.topContributor.cardsShared} Cards</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-2">No contributions recorded yet</p>
        )}
        <p className="text-[10px] text-[#3d8318]/80 dark:text-[#88c958] font-medium">
          Highest feedback and continuous attendance
        </p>
      </div>

      {/* Card 4: Attendance Attention */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Attendance Attention
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              summary.lowAttendanceCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {summary.lowAttendanceCount > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {summary.lowAttendanceCount}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {summary.lowAttendanceCount > 0
              ? 'Members with <60% attendance rate'
              : 'All members consistently attending!'}
          </p>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {summary.lowAttendanceCount > 0
            ? 'Recommend scheduling 1-on-1 check-ins'
            : 'Team retrospective engagement is strong'}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsKpiGrid;
