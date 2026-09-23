'use client';

import React from 'react';

export type SprintFilterTab = 'all' | 'active' | 'upcoming' | 'completed';

export interface SprintFilterBarProps {
  filter: SprintFilterTab;
  statusCounts: {
    all: number;
    active: number;
    upcoming: number;
    completed: number;
  };
  onFilterChange: (tab: SprintFilterTab) => void;
  disabled?: boolean;
}

/**
 * SprintFilterBar:
 * Segmented filter tabs with category count badges and active indicators.
 */
export const SprintFilterBar: React.FC<SprintFilterBarProps> = ({
  filter,
  statusCounts,
  onFilterChange,
  disabled = false,
}) => {
  const tabs: { id: SprintFilterTab; label: string }[] = [
    { id: 'all', label: `All Sprints (${statusCounts.all})` },
    { id: 'active', label: `Active (${statusCounts.active})` },
    { id: 'upcoming', label: `Upcoming (${statusCounts.upcoming})` },
    { id: 'completed', label: `Completed (${statusCounts.completed})` },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#12151c] p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onFilterChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              filter === tab.id
                ? 'bg-white dark:bg-[#1e222d] text-[#88c958] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SprintFilterBar;
