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
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Avg. Attendance Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summary.averageAttendanceRate}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                summary.averageAttendanceRate >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : summary.averageAttendanceRate >= 60
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
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
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.averageAttendanceRate >= 80
                  ? 'bg-emerald-500'
                  : summary.averageAttendanceRate >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, summary.averageAttendanceRate)}%` }}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Across {summary.totalRetros} retrospective sessions
        </p>
      </div>

      {/* Card 2: Total Retros Conducted */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-[#5cb028]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Retros
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalRetros}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Active in <span className="font-semibold text-slate-700">{selectedProjectName}</span>
          </p>
        </div>
        <p className="text-[11px] text-slate-400">
          {summary.totalMembers} active team members evaluated
        </p>
      </div>

      {/* Card 3: Sprint Champion / Top Contributor */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#eaf5e3]/50 via-white to-white border border-[#cdeac0] shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3d8318] flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#5cb028]" />
            Sprint Champion
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#eaf5e3] text-[#3d8318] border border-[#cdeac0]">
            🏆 Top Impact
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
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {summary.topContributor.name}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>{summary.topContributor.attendanceRate}% Attendance</span>
                <span>•</span>
                <span>{summary.topContributor.cardsShared} Cards</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic pt-2">No contributions recorded yet</p>
        )}
        <p className="text-[10px] text-[#3d8318]/80 font-medium">
          Highest feedback and continuous attendance
        </p>
      </div>

      {/* Card 4: Attendance Attention */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Attendance Nudge
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              summary.lowAttendanceCount > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
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
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.lowAttendanceCount}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.lowAttendanceCount > 0
              ? 'Members with <60% attendance rate'
              : 'All members consistently attending!'}
          </p>
        </div>
        <p className="text-[11px] text-slate-400">
          {summary.lowAttendanceCount > 0
            ? 'Recommend scheduling 1-on-1 check-ins'
            : 'Team retrospective engagement is strong'}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsKpiGrid;
