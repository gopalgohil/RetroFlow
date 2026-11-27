'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActionItems } from '@/hooks/useActionItems';
import { ActionItemsSkeleton, ActionItemsCardsSkeleton } from '@/components/dashboard/DashboardSkeletons';
import {
  ActionItemsMetrics,
  ActionItemsFilters,
  ActionItemCard,
  ActionItemsEmptyState,
} from './action-items';
import type { ActionItemsQuickFilter, ActionItemsSortMode } from './action-items';
import type { EnrichedActionItem } from '@/types/project';

interface ActionItemsTabProps {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
  onActionItemsCountChange?: (count: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 20;
const DAY_MS = 86400000;

// Whole days between today and the item's due date (negative = overdue). null when no due date.
const getDueDayDiff = (item: EnrichedActionItem, todayMs: number): number | null => {
  if (!item.dueDate) return null;
  const parts = item.dueDate.split('T')[0].split('-');
  const due =
    parts.length === 3
      ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      : new Date(item.dueDate);
  if (isNaN(due.getTime())) return null;
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - todayMs) / DAY_MS);
};

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  user,
  isAdmin = false,
  isManager = false,
  onActionItemsCountChange,
}) => {
  const rawRole = (user?.role || '').toLowerCase().trim();
  const rawProjectRole = (user?.projectRole || '').toLowerCase().trim();

  const isSuperOrWorkspaceAdmin = Boolean(
    isAdmin ||
    rawRole === 'admin'
  );

  const isProjectOrWorkspaceManager = Boolean(
    !isSuperOrWorkspaceAdmin &&
    (isManager || rawRole === 'manager' || rawProjectRole === 'manager') &&
    !rawProjectRole.includes('lead') &&
    !rawRole.includes('lead') &&
    !rawProjectRole.includes('dev') &&
    !rawProjectRole.includes('qa') &&
    !rawProjectRole.includes('tester')
  );

  const canMarkDone = isSuperOrWorkspaceAdmin || isProjectOrWorkspaceManager;

  const {
    items,
    baseTotalCount,
    filteredItems,
    isLoading,
    isInitialLoading,
    isSearching,
    updatingItemId,
    toastFeedback,
    metrics,
    statusCounts,
    projectOptions,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    setSortBy,
    viewAllTeam,
    setViewAllTeam,
    hasActiveFilters,
    clearAllFilters,
    handleStatusChange,
    handleCycleStatus,
  } = useActionItems({ user, isAdmin, isManager, onActionItemsCountChange, canMarkDone });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<ActionItemsSortMode>('smart');
  const [quickFilter, setQuickFilter] = useState<ActionItemsQuickFilter>(null);
  const [todayMs] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const handleSortChange = useCallback(
    (mode: ActionItemsSortMode) => {
      setSortMode(mode);
      // The hook still does the plain sorts; "smart" is layered on top below.
      setSortBy(mode === 'smart' ? 'newest' : mode);
    },
    [setSortBy]
  );

  // Open items that need attention, scoped to the selected project.
  const attention = useMemo(() => {
    const scoped =
      selectedProject === 'all'
        ? items
        : items.filter(
            (i) =>
              i.projectKey?.toLowerCase() === selectedProject.toLowerCase() ||
              i.projectId?.toLowerCase() === selectedProject.toLowerCase()
          );
    const open = scoped.filter((i) => i.status !== 'done');
    let overdue = 0;
    let dueSoon = 0;
    open.forEach((i) => {
      const diff = getDueDayDiff(i, todayMs);
      if (diff === null) return;
      if (diff < 0) overdue += 1;
      else if (diff <= 7) dueSoon += 1;
    });
    const unassigned = open.filter((i) => !i.assignee?.name).length;
    return { overdue, dueSoon, unassigned };
  }, [items, selectedProject, todayMs]);

  const visibleItems = useMemo(() => {
    let result = filteredItems;
    if (quickFilter) {
      result = result.filter((i) => {
        if (i.status === 'done') return false;
        if (quickFilter === 'unassigned') return !i.assignee?.name;
        const diff = getDueDayDiff(i, todayMs);
        if (diff === null) return false;
        return quickFilter === 'overdue' ? diff < 0 : diff >= 0 && diff <= 7;
      });
    }
    if (sortMode !== 'smart') return result;
    // Most urgent first: open before done, overdue first, then nearest due date, then priority.
    return [...result].sort((a, b) => {
      const doneDiff = Number(a.status === 'done') - Number(b.status === 'done');
      if (doneDiff !== 0) return doneDiff;
      const da = getDueDayDiff(a, todayMs);
      const db = getDueDayDiff(b, todayMs);
      const va = da === null ? Number.MAX_SAFE_INTEGER : da;
      const vb = db === null ? Number.MAX_SAFE_INTEGER : db;
      if (va !== vb) return va - vb;
      return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    });
  }, [filteredItems, quickFilter, sortMode, todayMs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedProject,
    selectedStatus,
    selectedPriority,
    sortMode,
    quickFilter,
    searchQuery,
    viewAllTeam,
    currentLimit,
  ]);

  const totalItems = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = Math.min(currentPage, totalPages);
  const hasPrev = activePage > 1;
  const hasNext = activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  const paginatedItems = useMemo(() => {
    const startIndex = (activePage - 1) * currentLimit;
    return visibleItems.slice(startIndex, startIndex + currentLimit);
  }, [visibleItems, activePage, currentLimit]);

  const handlePageChange = (newPage: number) => {
    if (newPage === activePage || newPage < 1 || newPage > totalPages) return;
    setIsPageLoading(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 180);
  };

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

  const handleResetFiltersWithLoader = useCallback(() => {
    setIsFilterLoading(true);
    setQuickFilter(null);
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

  if (isInitialLoading) {
    return <ActionItemsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Action Items
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Follow-ups committed in sprint retrospectives. Overdue items are shown first.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shrink-0 self-start sm:self-auto">
            {[
              { value: false, label: 'My items' },
              { value: true, label: 'All team items' },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleToggleTeamView(opt.value)}
                aria-pressed={viewAllTeam === opt.value}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  viewAllTeam === opt.value
                    ? 'bg-white dark:bg-[#141720] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ActionItemsMetrics
        metrics={metrics}
        attention={attention}
        activeQuickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
      />

      <ActionItemsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProject={selectedProject}
        onProjectChange={handleProjectFilterChange}
        projectOptions={projectOptions}
        selectedPriority={selectedPriority}
        onPriorityChange={handlePriorityFilterChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusFilterChange}
        metrics={metrics}
        statusCounts={statusCounts}
        hasActiveFilters={hasActiveFilters || quickFilter !== null}
        onResetFilters={handleResetFiltersWithLoader}
        sortMode={sortMode}
        onSortChange={handleSortChange}
      />

      <div className="space-y-3">
        {isLoading || isSearching || isFilterLoading || isPageLoading ? (
          <ActionItemsCardsSkeleton count={Math.min(currentLimit, 8)} />
        ) : visibleItems.length === 0 ? (
          <ActionItemsEmptyState
            totalCount={baseTotalCount}
            hasActiveFilters={hasActiveFilters || quickFilter !== null}
            onResetFilters={handleResetFiltersWithLoader}
          />
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_11rem_10rem_8.5rem] gap-4 px-5 py-2.5 border-b border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Action item</span>
              <span>Assignee</span>
              <span>Due</span>
              <span className="text-right pr-1">Status</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {paginatedItems.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  isUpdating={updatingItemId === item.id}
                  onStatusChange={handleStatusChange}
                  canMarkDone={canMarkDone}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {totalItems > 10 && (
        <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startRange}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{endRange}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong> action items
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rows:</span>
              <select
                value={currentLimit}
                onChange={(e) => setCurrentLimit(Number(e.target.value))}
                className="px-2.5 py-1 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {pageNumbers.map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`min-w-[36px] h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
                  className="px-1 text-slate-400 dark:text-slate-500 font-bold text-sm"
                >
                  ...
                </span>
              )
            )}

            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#12151c] text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-2xl flex items-center gap-2.5 border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastFeedback}</span>
        </div>
      )}
    </div>
  );
};

export default ActionItemsTab;
