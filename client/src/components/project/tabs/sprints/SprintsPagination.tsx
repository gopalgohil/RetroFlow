'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SprintsPaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
}

/**
 * SprintsPagination:
 * Industry-standard pagination bar displayed when total sprints > 10.
 */
export const SprintsPagination: React.FC<SprintsPaginationProps> = ({
  page,
  limit,
  totalItems,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading,
  onPageChange,
}) => {
  // Only display if more than 1 page exists (threshold > 10)
  if (totalPages <= 1) return null;

  const startSprint = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endSprint = Math.min(page * limit, totalItems);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
      {/* Pagination Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Showing <span className="font-bold text-slate-900 dark:text-white">{startSprint}</span> to{' '}
        <span className="font-bold text-slate-900 dark:text-white">{endSprint}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> sprints
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Number Buttons */}
        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span
              key={`sprint-ellipsis-${idx}`}
              className="px-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={`sprint-page-${p}`}
              type="button"
              onClick={() => onPageChange(Number(p))}
              disabled={isLoading}
              className={`min-w-[32px] h-[32px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                p === page
                  ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black'
                  : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SprintsPagination;
