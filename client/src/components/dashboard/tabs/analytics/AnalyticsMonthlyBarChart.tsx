'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Layers,
  Award,
  Info,
} from 'lucide-react';
import { MonthlyRetroBarData, YearAnalyticsSummary } from './types';

interface AnalyticsMonthlyBarChartProps {
  monthlyTrends?: MonthlyRetroBarData[];
  selectedYear: number;
  selectedProjectName: string;
  yearSummary?: YearAnalyticsSummary;
}

export const AnalyticsMonthlyBarChart: React.FC<AnalyticsMonthlyBarChartProps> = ({
  monthlyTrends = [],
  selectedYear,
  selectedProjectName,
  yearSummary,
}) => {
  // View mode switcher: 'retros' | 'tasks' | 'completed' | 'rate'
  const [activeMetric, setActiveMetric] = useState<'retros' | 'tasks' | 'completed'>('retros');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyRetroBarData | null>(null);

  // Compute metric value for each month
  const getMetricValue = (m: MonthlyRetroBarData) => {
    switch (activeMetric) {
      case 'retros':
        return m.retrosCount;
      case 'tasks':
        return m.totalTasks;
      case 'completed':
        return m.completedTasks;
      default:
        return m.retrosCount;
    }
  };

  // Determine dynamic max scale for Y-axis with nice headroom
  const maxScaleValue = useMemo(() => {
    let max = 4;
    monthlyTrends.forEach((m) => {
      const val = getMetricValue(m);
      if (val > max) max = val;
    });
    // If max is small (e.g. 1-4), scale up to 4 or 5 for clean intervals
    if (max <= 4) return 4;
    if (max <= 8) return 8;
    if (max <= 12) return 12;
    if (max <= 20) return 20;
    return Math.ceil(max * 1.2);
  }, [monthlyTrends, activeMetric]);

  // Generate 4 Y-axis scale ticks (from max down to 0)
  const yAxisTicks = useMemo(() => {
    const t4 = maxScaleValue;
    const t3 = Math.round(maxScaleValue * 0.75);
    const t2 = Math.round(maxScaleValue * 0.5);
    const t1 = Math.round(maxScaleValue * 0.25);
    const t0 = 0;
    return [t4, t3, t2, t1, t0];
  }, [maxScaleValue]);

  // Aggregate year summary metrics if not provided directly
  const computedYearSummary = useMemo(() => {
    if (yearSummary) return yearSummary;
    let totalRetros = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    monthlyTrends.forEach((m) => {
      totalRetros += m.retrosCount;
      totalTasks += m.totalTasks;
      completedTasks += m.completedTasks;
      pendingTasks += m.pendingTasks;
    });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      year: selectedYear,
      totalRetros,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
    };
  }, [yearSummary, monthlyTrends, selectedYear]);

  // Peak month determination
  const peakMonth = useMemo(() => {
    if (monthlyTrends.length === 0) return null;
    let peak = monthlyTrends[0];
    monthlyTrends.forEach((m) => {
      if (getMetricValue(m) > getMetricValue(peak)) {
        peak = m;
      }
    });
    return getMetricValue(peak) > 0 ? peak : null;
  }, [monthlyTrends, activeMetric]);

  const currentMonthIndex = new Date().getMonth();
  const currentCalendarYear = new Date().getFullYear();

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-6">
      {/* 1. Header Bar: Title, Project Tag, and Metric Toggle Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Retrospective & Action Item Trends ({selectedYear})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
              {selectedProjectName}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monthly distribution of retrospectives and action items created by workspace managers & admins.
          </p>
        </div>

        {/* Minimalist Pill Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('retros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'retros'
                ? 'bg-white dark:bg-[#181c24] text-[#3d8318] dark:text-[#88c958] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Retros ({computedYearSummary.totalRetros})
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'tasks'
                ? 'bg-white dark:bg-[#181c24] text-[#3d8318] dark:text-[#88c958] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Action Items ({computedYearSummary.totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'completed'
                ? 'bg-white dark:bg-[#181c24] text-[#3d8318] dark:text-[#88c958] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Completed ({computedYearSummary.completedTasks})
          </button>
        </div>
      </div>

      {/* 2. Clean Minimalist Bar Chart (Matching Image 2 Reference in RetroFlow Green Theme) */}
      <div className="relative pt-6 pb-2">
        {/* Main Chart Area with Right-side Y-Axis Scale */}
        <div className="relative h-[250px] sm:h-[280px] flex">
          {/* Chart Columns Area */}
          <div className="relative flex-1 h-full">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
              <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
              <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
              <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
              <div className="border-b border-slate-100 dark:border-white/[0.06] w-full" />
              <div className="border-b border-slate-200 dark:border-white/[0.12] w-full" />
            </div>

            {/* 12 Month Bar Columns */}
            <div className="absolute inset-0 grid grid-cols-12 gap-1 sm:gap-2 items-end z-10 px-1 sm:px-2">
              {monthlyTrends.map((monthData, idx) => {
                const val = getMetricValue(monthData);
                const isCurrentMonth = selectedYear === currentCalendarYear && idx === currentMonthIndex;
                const isHovered = hoveredMonth?.monthIndex === idx;

                // Height calculation bounded between 0% and 100%
                const heightPct = val > 0 ? Math.min(100, Math.round((val / maxScaleValue) * 100)) : 0;

                return (
                  <div
                    key={monthData.month}
                    onMouseEnter={() => setHoveredMonth(monthData)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="relative flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* The Clean Solid Bar (Matching Image 2 in Theme Green) */}
                    <div className="w-full flex items-end justify-center h-full">
                      {val > 0 ? (
                        <div
                          className={`w-4 sm:w-6 md:w-8 max-w-[34px] rounded-t-lg transition-all duration-300 relative group-hover:brightness-110 group-hover:shadow-md ${
                            isHovered
                              ? 'bg-[#52a122] dark:bg-[#92d461] shadow-sm'
                              : 'bg-[#5cb028] dark:bg-[#88c958]'
                          }`}
                          style={{
                            height: `${Math.max(6, heightPct)}%`,
                          }}
                        >
                          {/* Value tag if tall enough */}
                          {heightPct >= 28 && (
                            <div className="absolute top-2 inset-x-0 flex justify-center">
                              <span className="text-[10px] font-black text-white/95 select-none leading-none">
                                {val}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Subtle zero-indicator marker at base */
                        <div className="w-2.5 sm:w-3.5 h-1 rounded-full bg-slate-200/50 dark:bg-white/[0.06]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Y-Axis Scale Column (Matching Image 2) */}
          <div className="w-8 sm:w-12 h-full flex flex-col justify-between items-end pl-2 sm:pl-3 pb-0 pointer-events-none select-none text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
            {yAxisTicks.map((tickVal, tIdx) => (
              <span key={tIdx} className="translate-y-[-50%] leading-none">
                {tickVal}
              </span>
            ))}
          </div>
        </div>

        {/* Clean X-Axis Month Labels */}
        <div className="flex pt-3 border-t border-slate-200 dark:border-white/[0.12]">
          <div className="flex-1 grid grid-cols-12 gap-1 sm:gap-2 px-1 sm:px-2">
            {monthlyTrends.map((monthData, idx) => {
              const isCurrentMonth = selectedYear === currentCalendarYear && idx === currentMonthIndex;
              const isHovered = hoveredMonth?.monthIndex === idx;

              return (
                <div key={monthData.month} className="flex flex-col items-center justify-center">
                  <span
                    className={`text-[10px] sm:text-xs font-bold transition-colors select-none ${
                      isCurrentMonth
                        ? 'text-[#3d8318] dark:text-[#88c958] font-black'
                        : isHovered
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {monthData.month}
                  </span>
                  {isCurrentMonth && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5cb028] dark:bg-[#88c958] mt-1" />
                  )}
                </div>
              );
            })}
          </div>
          {/* Spacer to align with right Y-axis */}
          <div className="w-8 sm:w-12" />
        </div>
      </div>

      {/* 3. Interactive Floating Month Details Card */}
      <div className="min-h-[72px] p-4 rounded-2xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] transition-all duration-200">
        {hoveredMonth ? (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {hoveredMonth.monthFull} {selectedYear}
                </h4>
                {hoveredMonth.monthIndex === currentMonthIndex && selectedYear === currentCalendarYear && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958]">
                    Current Month
                  </span>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="text-[#3d8318] dark:text-[#88c958]">
                  {hoveredMonth.retrosCount} Retros
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {hoveredMonth.completedTasks} Done
                </span>
                <span>•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {hoveredMonth.pendingTasks} Pending
                </span>
                <span>•</span>
                <span className="text-slate-900 dark:text-white font-black">
                  {hoveredMonth.completionRate}% Done
                </span>
              </div>
            </div>

            {/* Sessions list in this hovered month if present */}
            {hoveredMonth.sessions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[11px] font-bold text-slate-400">Retros:</span>
                {hoveredMonth.sessions.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958]" />
                    <span className="truncate max-w-[200px]">{s.title}</span>
                    <span className="text-[10px] text-slate-400">({s.completedCount}/{s.tasksCount} action items done)</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 h-full py-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Hover over any month to view retrospective details and action item status.</span>
            </div>
            {peakMonth && getMetricValue(peakMonth) > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 font-bold text-[#3d8318] dark:text-[#88c958] shrink-0">
                <Award className="w-4 h-4 text-[#5cb028]" />
                <span>Highest Month: {peakMonth.monthFull} ({getMetricValue(peakMonth)} Action Items)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom High-Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
        {/* Metric 1: Year Retros */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual Retros</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {computedYearSummary.totalRetros} Sessions in {selectedYear}
            </p>
          </div>
        </div>

        {/* Metric 2: Completed vs Pending Action Items */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action Items</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {computedYearSummary.totalTasks} Action Items ({computedYearSummary.completedTasks} Done • {computedYearSummary.pendingTasks} Pending)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMonthlyBarChart;
