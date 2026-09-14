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
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{metrics.total}</p>
        </div>
      </div>

      {/* Metric 2: To Do */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To Do / Pending</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700">{metrics.todo}</p>
        </div>
      </div>

      {/* Metric 3: In Progress */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
          <p className="text-xl sm:text-2xl font-black text-sky-700">{metrics.inProgress}</p>
        </div>
      </div>

      {/* Metric 4: Done */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">{metrics.done}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-extrabold text-emerald-600">{metrics.completionRate}%</span>
          <span className="text-[10px] text-slate-400 block font-medium">resolved</span>
        </div>
      </div>
    </div>
  );
});

ActionItemsMetrics.displayName = 'ActionItemsMetrics';
