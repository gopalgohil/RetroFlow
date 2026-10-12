'use client';

import React from 'react';

interface ActionItemsEmptyStateProps {
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const ActionItemsEmptyState: React.FC<ActionItemsEmptyStateProps> = React.memo(({
  totalCount,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="p-12 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] text-center space-y-4 max-w-lg mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
        🎯
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {totalCount === 0
            ? 'No Action Items Assigned'
            : 'No Matching Action Items'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {totalCount === 0
            ? 'Great job! You have no pending action items derived from retrospective sessions. Create a retrospective to identify upcoming deliverables.'
            : 'No items match your active search or filter criteria. Try adjusting or clearing your filters.'}
        </p>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="py-2.5 px-5 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 hover:bg-[#cdeac0]/50 dark:hover:bg-[#88c958]/25 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30 text-sm font-bold transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
});

ActionItemsEmptyState.displayName = 'ActionItemsEmptyState';
