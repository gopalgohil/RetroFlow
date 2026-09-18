'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Calendar,
  ArrowUpRight,
  MessageSquare,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { RetroTrendItem } from './types';

interface AnalyticsSessionTrendsProps {
  trends: RetroTrendItem[];
  selectedProjectName: string;
}

const DEFAULT_ITEMS_PER_PAGE = 9;

export const SessionTrendCardsSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/70 dark:border-white/[0.06] space-y-3 animate-pulse"
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-slate-200/80 dark:bg-white/[0.08] rounded-md" />
              <div className="h-4 w-3/4 bg-slate-200/80 dark:bg-white/[0.08] rounded-md" />
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-white/[0.04] rounded" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-white/[0.08]" />
          </div>

          {/* Turnout bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <div className="h-3 w-14 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
              <div className="h-3 w-20 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
            </div>
            <div className="h-2 w-full bg-slate-200/80 dark:bg-white/[0.06] rounded-full" />
          </div>

          {/* Bottom metadata */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-3 w-16 bg-slate-200/80 dark:bg-white/[0.06] rounded" />
            <div className="h-3 w-24 bg-slate-200/80 dark:bg-white/[0.06] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsSessionTrends: React.FC<AnalyticsSessionTrendsProps> = ({
  trends,
  selectedProjectName,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  // Reset to page 1 whenever trends list or limit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [trends.length, selectedProjectName, currentLimit]);

  const totalItems = trends.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = Math.min(currentPage, totalPages);
  const hasPrev = activePage > 1;
  const hasNext = activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  // Paginated slice
  const paginatedTrends = useMemo(() => {
    const startIndex = (activePage - 1) * currentLimit;
    return trends.slice(startIndex, startIndex + currentLimit);
  }, [trends, activePage, currentLimit]);

  const handlePageChange = (newPage: number) => {
    if (newPage === activePage || newPage < 1 || newPage > totalPages) return;
    setIsPageLoading(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 180);
  };

  // Page numbers with ellipsis windowing
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (activePage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages];
  }, [totalPages, activePage]);

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
    <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Retrospective Session Trends
          </h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {totalItems > 0
            ? `Showing ${startRange}–${endRange} of ${totalItems} sessions`
            : '0 sessions'}
        </span>
      </div>

      {/* Grid of Retro Session Cards or Skeleton */}
      {isPageLoading ? (
        <SessionTrendCardsSkeleton count={Math.min(currentLimit, 9)} />
      ) : paginatedTrends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
          {paginatedTrends.map((retro) => (
            <div
              key={retro.id}
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#12151c] hover:bg-white dark:hover:bg-[#151922] border border-slate-200/70 dark:border-white/[0.06] hover:border-[#88c958]/40 dark:hover:border-[#88c958]/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3d8318] dark:text-[#88c958] bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 px-2 py-0.5 rounded-md inline-block">
                    {retro.sprintName}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-1.5" title={retro.title}>
                    {retro.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{formatDate(retro.date)}</span>
                  </p>
                </div>

                <Link
                  href={`/retro/${retro.shareToken}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#88c958] hover:bg-[#eaf5e3] dark:hover:bg-[#88c958]/20 transition-colors shrink-0 cursor-pointer"
                  title="Open retro board"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Turnout Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Turnout</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {retro.attendeesCount} / {retro.expectedCount} ({retro.attendanceRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      retro.attendanceRate >= 80
                        ? 'bg-[#88c958]'
                        : retro.attendanceRate >= 60
                        ? 'bg-[#88c958]/80'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, retro.attendanceRate)}%` }}
                  />
                </div>
              </div>

              {/* Bottom Metadata Badges */}
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                  <span>{retro.cardsCount} cards</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-[#88c958]" />
                  <span>{retro.actionItemsCount} action items</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#12151c]/50 text-center space-y-2 border border-dashed border-slate-200 dark:border-white/[0.08]">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            No retrospective sessions found for {selectedProjectName}.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Create a new retro session to begin capturing real-time attendance trends.
          </p>
        </div>
      )}

      {/* Enterprise Pagination Footer */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Range & Limit Selector */}
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{startRange}</strong> to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{endRange}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> sessions
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Rows:</span>
              <select
                value={currentLimit}
                onChange={(e) => setCurrentLimit(Number(e.target.value))}
                className="px-2 py-1 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
              >
                <option value={9}>9 per page</option>
                <option value={18}>18 per page</option>
                <option value={27}>27 per page</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#12151c] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Number Pills */}
            {pageNumbers.map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    p === activePage
                      ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black'
                      : 'bg-slate-50 dark:bg-[#12151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-slate-400 dark:text-slate-500 font-bold"
                >
                  ...
                </span>
              )
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#12151c] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSessionTrends;

