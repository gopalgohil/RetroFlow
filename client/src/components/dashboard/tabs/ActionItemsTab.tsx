'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
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

  // Filter transition loading state for smooth skeleton animation on status/filter changes
  const [isFilterLoading, setIsFilterLoading] = React.useState(false);

  const handleStatusFilterChange = React.useCallback(
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

  const handleProjectFilterChange = React.useCallback(
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

  const handlePriorityFilterChange = React.useCallback(
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

  const handleSortFilterChange = React.useCallback(
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

  const handleResetFiltersWithLoader = React.useCallback(() => {
    setIsFilterLoading(true);
    clearAllFilters();
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 320);
  }, [clearAllFilters]);

  const handleToggleTeamView = React.useCallback(
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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#eaf5e3]/60 via-white to-slate-50 dark:from-[#5cb028]/10 dark:via-[#0f172a] dark:to-[#0b0f17] border border-[#cdeac0]/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#5cb028]" />
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
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 self-start lg:self-auto">
            <button
              onClick={() => handleToggleTeamView(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !viewAllTeam
                  ? 'bg-[#5cb028] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Action Items
            </button>
            <button
              onClick={() => handleToggleTeamView(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewAllTeam
                  ? 'bg-[#5cb028] text-white shadow-xs'
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
        {isLoading || isFilterLoading ? (
          <ActionItemsCardsSkeleton count={filteredItems.length > 0 ? Math.min(filteredItems.length, 3) : 3} />
        ) : filteredItems.length === 0 ? (
          <ActionItemsEmptyState
            totalCount={items.length}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFiltersWithLoader}
          />
        ) : (
          filteredItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              isUpdating={updatingItemId === item.id}
              onStatusChange={handleStatusChange}
              onCycleStatus={handleCycleStatus}
            />
          ))
        )}
      </div>

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
