'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActionItems } from '@/hooks/useActionItems';
import { ActionItemsSkeleton, ActionItemsCardsSkeleton } from '@/components/dashboard/DashboardSkeletons';
import {
  ActionItemsMetrics,
  ActionItemsFilters,
  ActionItemCard,
  ActionItemsEmptyState,
} from './action-items';

interface ActionItemsTabProps {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
  onActionItemsCountChange?: (count: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 8;

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  user,
  isAdmin = false,
  isManager = false,
  onActionItemsCountChange,
}) => {
  const {
    items,
    filteredItems,
    isLoading,
    updatingItemId,
    toastFeedback,
    metrics,
    projectOptions,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    sortBy,
    setSortBy,
    viewAllTeam,
    setViewAllTeam,
    hasActiveFilters,
    clearAllFilters,
    handleStatusChange,
    handleCycleStatus,
  } = useActionItems({ user, isAdmin, isManager, onActionItemsCountChange });

  // Pagination states (8 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  // Filter transition loading state for smooth skeleton animation on status/filter changes
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedProject,
    selectedStatus,
    selectedPriority,
    sortBy,
    searchQuery,
    viewAllTeam,
    currentLimit,
  ]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = Math.min(currentPage, totalPages);
  const hasPrev = activePage > 1;
  const hasNext = activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  // Paginated items slice
  const paginatedItems = useMemo(() => {
    const startIndex = (activePage - 1) * currentLimit;
    return filteredItems.slice(startIndex, startIndex + currentLimit);
  }, [filteredItems, activePage, currentLimit]);

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

  const handleStatusFilterChange = useCallback(
    (newStatus: string) => {
      if (newStatus === selectedStatus) return;
      setIsFilterLoading(true);
      setSelectedStatus(newStatus);
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 320);
    },
    [selectedStatus, setSelectedStatus]
  );

  const handleProjectFilterChange = useCallback(
    (newProj: string) => {
      if (newProj === selectedProject) return;
      setIsFilterLoading(true);
      setSelectedProject(newProj);
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 320);
    },
    [selectedProject, setSelectedProject]
  );

  const handlePriorityFilterChange = useCallback(
    (newPriority: string) => {
      if (newPriority === selectedPriority) return;
      setIsFilterLoading(true);
      setSelectedPriority(newPriority);
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 320);
    },
    [selectedPriority, setSelectedPriority]
  );

  const handleSortFilterChange = useCallback(
    (newSort: 'dueDate' | 'priority' | 'newest') => {
      if (newSort === sortBy) return;
      setIsFilterLoading(true);
      setSortBy(newSort);
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 320);
    },
    [sortBy, setSortBy]
  );

  const handleResetFiltersWithLoader = useCallback(() => {
    setIsFilterLoading(true);
    clearAllFilters();
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 320);
  }, [clearAllFilters]);

  const handleToggleTeamView = useCallback(
    (val: boolean) => {
      if (val === viewAllTeam) return;
      setIsFilterLoading(true);
      setViewAllTeam(val);
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 350);
    },
    [viewAllTeam, setViewAllTeam]
  );

  // Initial tab loading skeleton on reload or mount
  if (isLoading && items.length === 0) {
    return <ActionItemsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#eaf5e3]/60 via-white to-slate-50 dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#12151c] border border-[#cdeac0]/80 dark:border-white/[0.08] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#5cb028] dark:text-[#88c958]" />
              Retrospective Action Engine
            </span>
            {user?.name && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Assigned to <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Retrospective Action Items
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Track, prioritize, and complete commitments derived from your sprint retrospectives. Keep your team aligned and agile deliverables on schedule.
          </p>
        </div>

        {/* Action Toggle (My items vs All Team for Admin/Manager) */}
        {(isAdmin || isManager) && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#12151c] p-1 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs shrink-0 self-start lg:self-auto">
            <button
              onClick={() => handleToggleTeamView(false)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !viewAllTeam
                  ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Action Items
            </button>
            <button
              onClick={() => handleToggleTeamView(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewAllTeam
                  ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Team Items
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Summary KPI Stats Grid */}
      <ActionItemsMetrics metrics={metrics} />

      {/* 3. Filter & Control Toolbar */}
      <ActionItemsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProject={selectedProject}
        onProjectChange={handleProjectFilterChange}
        projectOptions={projectOptions}
        selectedPriority={selectedPriority}
        onPriorityChange={handlePriorityFilterChange}
        sortBy={sortBy}
        onSortChange={handleSortFilterChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusFilterChange}
        metrics={metrics}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFiltersWithLoader}
      />

      {/* 4. Action Items List with Smooth UI Skeleton Loader */}
      <div className="space-y-3">
        {isLoading || isFilterLoading || isPageLoading ? (
          <ActionItemsCardsSkeleton count={Math.min(currentLimit, 8)} />
        ) : filteredItems.length === 0 ? (
          <ActionItemsEmptyState
            totalCount={items.length}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFiltersWithLoader}
          />
        ) : (
          paginatedItems.map((item, idx) => (
            <ActionItemCard
              key={item.id}
              item={item}
              displayIndex={(activePage - 1) * currentLimit + idx + 1}
              isUpdating={updatingItemId === item.id}
              onStatusChange={handleStatusChange}
              onCycleStatus={handleCycleStatus}
            />
          ))
        )}
      </div>

      {/* 5. Enterprise Pagination Footer (after 8 items) */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Range & Limit Selector */}
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{startRange}</strong> to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{endRange}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> action items
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Rows:</span>
              <select
                value={currentLimit}
                onChange={(e) => setCurrentLimit(Number(e.target.value))}
                className="px-2 py-1 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
              >
                <option value={8}>8 per page</option>
                <option value={16}>16 per page</option>
                <option value={24}>24 per page</option>
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

      {/* Floating Toast Feedback */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastFeedback}</span>
        </div>
      )}
    </div>
  );
};

export default ActionItemsTab;
