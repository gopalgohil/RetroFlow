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
    <div className="p-12 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
        🎯
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {totalCount === 0
            ? 'No Action Items Assigned'
            : 'No Matching Action Items'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {totalCount === 0
            ? 'Great job! You have no pending action items derived from retrospective sessions. Create a retrospective to identify upcoming deliverables.'
            : 'No items match your active search or filter criteria. Try adjusting or clearing your filters.'}
        </p>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="py-2 px-4 rounded-xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 hover:bg-[#cdeac0]/50 dark:hover:bg-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30 text-xs font-bold transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
});

ActionItemsEmptyState.displayName = 'ActionItemsEmptyState';
