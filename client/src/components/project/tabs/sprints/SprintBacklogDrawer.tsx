'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sprint, BacklogItem } from '@/types/project';
import { PaginationMeta } from '@/types/retro';
import { ProjectApiService } from '@/services/projectApi';
import { SprintBacklogListSkeleton } from './SprintBacklogListSkeleton';
import { SprintBacklogItemRow } from './SprintBacklogItemRow';

export interface SprintBacklogDrawerProps {
  projectId: string;
  sprint: Sprint;
  updatingItemId: string | null;
  deletingItemId?: string | null;
  canManageProject?: boolean;
  onUpdateItemStatus: (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => Promise<void>;
  onDeleteItem?: (sprintId: string, itemId: string) => Promise<void> | void;
}

/**
 * SprintBacklogDrawer:
 * Isolated backlog container for a sprint with local 10-item pagination,
 * smooth skeleton transitions, and status updates.
 */
export const SprintBacklogDrawer: React.FC<SprintBacklogDrawerProps> = ({
  projectId,
  sprint,
  updatingItemId,
  deletingItemId = null,
  canManageProject = false,
  onUpdateItemStatus,
  onDeleteItem,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [paginatedItems, setPaginatedItems] = useState<BacklogItem[]>(() =>
    (sprint.items || []).slice(0, 10)
  );
  const [pagination, setPagination] = useState<PaginationMeta>(() => {
    const total = sprint.items?.length || 0;
    const totalPages = Math.ceil(total / 10) || 1;
    return {
      page: 1,
      limit: 10,
      totalItems: total,
      totalPages,
      hasNextPage: totalPages > 1,
      hasPrevPage: false,
    };
  });
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);

  // Sync when sprint.items in parent updates (e.g. ticket status updated or new action items exported)
  useEffect(() => {
    const total = sprint.items?.length || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    if (!isLoadingPage) {
      if (currentPage === 1) {
        setPaginatedItems((sprint.items || []).slice(0, limit));
        setPagination({
          page: 1,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: totalPages > 1,
          hasPrevPage: false,
        });
      } else if (currentPage > totalPages) {
        setCurrentPage(1);
        setPaginatedItems((sprint.items || []).slice(0, limit));
        setPagination({
          page: 1,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: totalPages > 1,
          hasPrevPage: false,
        });
      } else {
        const start = (currentPage - 1) * limit;
        setPaginatedItems((sprint.items || []).slice(start, start + limit));
        setPagination({
          page: currentPage,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        });
      }
    }
  }, [sprint.items, limit, isLoadingPage, currentPage]);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage || isLoadingPage) {
      return;
    }

    setIsLoadingPage(true);
    setCurrentPage(newPage);

    const startTime = Date.now();
    try {
      // Real backend API dispatch with Observable Network Call
      const res = await ProjectApiService.getSprintItems(projectId, sprint.id, {
        page: newPage,
        limit,
      });

      // Maintain smooth skeleton visibility for at least 350ms so transitions are pleasant
      const elapsed = Date.now() - startTime;
      if (elapsed < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
      }

      if (res?.items) {
        setPaginatedItems(res.items);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        const start = (newPage - 1) * limit;
        setPaginatedItems((sprint.items || []).slice(start, start + limit));
      }
    } catch (err) {
      console.warn('[SprintBacklogDrawer] Backend pagination fallback to local slice:', err);
      const elapsed = Date.now() - startTime;
      if (elapsed < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
      }
      const start = (newPage - 1) * limit;
      setPaginatedItems((sprint.items || []).slice(start, start + limit));
      setPagination({
        page: newPage,
        limit,
        totalItems: sprint.items.length,
        totalPages: Math.ceil(sprint.items.length / limit) || 1,
        hasNextPage: newPage < Math.ceil(sprint.items.length / limit),
        hasPrevPage: newPage > 1,
      });
    } finally {
      setIsLoadingPage(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = pagination.totalPages;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (currentPage >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total);
      }
    }
    return pages;
  };

  const totalItems = sprint.items?.length || 0;
  const startItem = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, totalItems);

  return (
    <div className="border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#12151c]/60 p-5 space-y-3">
      {/* Drawer Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#88c958]" />
          Sprint Backlog Stories & Action Items ({totalItems})
        </span>
        <div className="flex items-center gap-2">
          {isLoadingPage && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#88c958] font-bold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading page {currentPage}...
            </span>
          )}
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Total Items: {totalItems}
          </span>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0e1015] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08]">
          No tickets assigned to this sprint yet. Export action items from a retro session or add backlog items.
        </div>
      ) : (
        <>
          {/* Action Items List with Skeleton Loader when switching pages */}
          {isLoadingPage ? (
            <SprintBacklogListSkeleton
              count={
                pagination.totalItems
                  ? Math.min(
                      limit,
                      Math.max(2, pagination.totalItems - (currentPage - 1) * limit)
                    )
                  : 5
              }
            />
          ) : (
            <div className="space-y-2">
              {paginatedItems.map((item) => (
                <SprintBacklogItemRow
                  key={item.id}
                  sprintId={sprint.id}
                  item={item}
                  isUpdating={updatingItemId === item.id}
                  isDeleting={deletingItemId === item.id}
                  canManageProject={canManageProject}
                  onUpdateStatus={onUpdateItemStatus}
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </div>
          )}

          {/* Industry-standard Pagination Bar (Appears when items > 10) */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
              {/* Pagination Info */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {startItem}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {endItem}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {totalItems}
                </span>{' '}
                backlog items
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || isLoadingPage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Previous</span>
                </button>

                {/* Number Buttons */}
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => handlePageChange(Number(p))}
                      disabled={isLoadingPage}
                      className={`min-w-[30px] h-[30px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        p === currentPage
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || isLoadingPage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <span className="hidden sm:inline text-[11px]">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SprintBacklogDrawer;
