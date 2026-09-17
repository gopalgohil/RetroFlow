'use client';

import React from 'react';
import { CheckSquare, Clock, Flame, CheckCircle2 } from 'lucide-react';

interface ActionItemsMetricsProps {
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    completionRate: number;
  };
}

export const ActionItemsMetrics: React.FC<ActionItemsMetricsProps> = React.memo(({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center shrink-0">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Items</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</p>
        </div>
      </div>

      {/* Metric 2: To Do */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">To Do / Pending</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">{metrics.todo}</p>
        </div>
      </div>

      {/* Metric 3: In Progress */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">In Progress</p>
          <p className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-400">{metrics.inProgress}</p>
        </div>
      </div>

      {/* Metric 4: Done */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#5cb028]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="text-xl sm:text-2xl font-black text-[#3d8318] dark:text-[#5cb028]">{metrics.done}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-extrabold text-[#3d8318] dark:text-[#5cb028]">{metrics.completionRate}%</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">resolved</span>
        </div>
      </div>
    </div>
  );
});

ActionItemsMetrics.displayName = 'ActionItemsMetrics';
