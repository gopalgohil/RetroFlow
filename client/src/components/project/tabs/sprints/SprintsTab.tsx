'use client';

import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { Project, Sprint } from '@/types/project';
import { PaginationMeta } from '@/types/retro';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { ConfirmDialog } from '@/components/ui';
import { EditSprintDatesModal } from '@/components/project/EditSprintDatesModal';
import { SprintCardsSkeleton } from '@/components/dashboard/DashboardSkeletons';
import {
  SprintFilterBar,
  SprintFilterTab,
} from './SprintFilterBar';
import { SprintCard } from './SprintCard';
import { SprintsPagination } from './SprintsPagination';

export interface SprintsTabProps {
  project: Project;
  onProjectUpdated: (updated: Project) => void;
  canManageProject?: boolean;
}

/**
 * SprintsTab:
 * Clean, production-grade orchestrator component for project sprints.
 * Adheres to modular Single Responsibility Principle with isolated subcomponents.
 */
export const SprintsTab: React.FC<SprintsTabProps> = ({
  project,
  onProjectUpdated,
  canManageProject = true,
}) => {
  const [filter, setFilter] = useState<SprintFilterTab>('all');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [sprintPage, setSprintPage] = useState<number>(1);
  const [sprintLimit] = useState<number>(10);
  const [isSprintPageLoading, setIsSprintPageLoading] = useState<boolean>(false);

  // Expanded sprint cards
  const [expandedSprintIds, setExpandedSprintIds] = useState<string[]>(() => {
    const active = (project.sprints || []).find((s) => s.status === 'active')?.id || project.sprints?.[0]?.id;
    return active ? [active] : [];
  });
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [editingDatesSprint, setEditingDatesSprint] = useState<Sprint | null>(null);

  // Reusable confirmation dialog state for sprint start/complete
  const [confirmSprint, setConfirmSprint] = useState<{
    sprint: Sprint;
    action: 'start' | 'complete';
  } | null>(null);

  const allSprints = project.sprints || [];
  const currentFilteredSprints = allSprints.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const [paginatedSprints, setPaginatedSprints] = useState<Sprint[]>(() =>
    currentFilteredSprints.slice(0, 10)
  );

  const [sprintPagination, setSprintPagination] = useState<PaginationMeta>(() => {
    const total = currentFilteredSprints.length;
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

  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    active: number;
    upcoming: number;
    completed: number;
  }>({
    all: allSprints.length,
    active: allSprints.filter((s) => s.status === 'active').length,
    upcoming: allSprints.filter((s) => s.status === 'upcoming').length,
    completed: allSprints.filter((s) => s.status === 'completed').length,
  });

  // Keep state synchronized with project prop updates (e.g. status updates, date changes)
  useEffect(() => {
    const freshAll = project.sprints || [];
    const freshFiltered = freshAll.filter((s) => {
      if (filter === 'all') return true;
      return s.status === filter;
    });

    setStatusCounts({
      all: freshAll.length,
      active: freshAll.filter((s) => s.status === 'active').length,
      upcoming: freshAll.filter((s) => s.status === 'upcoming').length,
      completed: freshAll.filter((s) => s.status === 'completed').length,
    });

    if (!isSprintPageLoading && !isFilterLoading) {
      const total = freshFiltered.length;
      const totalPages = Math.ceil(total / sprintLimit) || 1;
      const validPage = sprintPage > totalPages ? 1 : sprintPage;
      if (validPage !== sprintPage) setSprintPage(validPage);

      const start = (validPage - 1) * sprintLimit;
      setPaginatedSprints(freshFiltered.slice(start, start + sprintLimit));
      setSprintPagination({
        page: validPage,
        limit: sprintLimit,
        totalItems: total,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      });
    }
  }, [project.sprints, filter, sprintLimit, isSprintPageLoading, isFilterLoading, sprintPage]);

  const handleFilterChange = async (tab: SprintFilterTab) => {
    if (tab === filter) return;
    setIsFilterLoading(true);
    setFilter(tab);
    setSprintPage(1);

    const startTime = Date.now();
    try {
      const res = await ProjectApiService.getProjectSprints(project.id, {
        page: 1,
        limit: sprintLimit,
        status: tab,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise((r) => setTimeout(r, 300 - elapsed));
      }

      if (res && res.sprints) {
        setPaginatedSprints(res.sprints);
        if (res.pagination) setSprintPagination(res.pagination);
        if (res.statusCounts) setStatusCounts(res.statusCounts);
      } else {
        const filtered = (project.sprints || []).filter((s) => (tab === 'all' ? true : s.status === tab));
        setPaginatedSprints(filtered.slice(0, sprintLimit));
        setSprintPagination({
          page: 1,
          limit: sprintLimit,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / sprintLimit) || 1,
          hasNextPage: filtered.length > sprintLimit,
          hasPrevPage: false,
        });
      }
    } catch {
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise((r) => setTimeout(r, 300 - elapsed));
      }
      const filtered = (project.sprints || []).filter((s) => (tab === 'all' ? true : s.status === tab));
      setPaginatedSprints(filtered.slice(0, sprintLimit));
      setSprintPagination({
        page: 1,
        limit: sprintLimit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / sprintLimit) || 1,
        hasNextPage: filtered.length > sprintLimit,
        hasPrevPage: false,
      });
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleSprintPageChange = async (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > sprintPagination.totalPages ||
      newPage === sprintPage ||
      isSprintPageLoading
    ) {
      return;
    }

    setIsSprintPageLoading(true);
    setSprintPage(newPage);

    const startTime = Date.now();
    try {
      const res = await ProjectApiService.getProjectSprints(project.id, {
        page: newPage,
        limit: sprintLimit,
        status: filter,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < 350) {
        await new Promise((r) => setTimeout(r, 350 - elapsed));
      }

      if (res && res.sprints) {
        setPaginatedSprints(res.sprints);
        if (res.pagination) setSprintPagination(res.pagination);
        if (res.statusCounts) setStatusCounts(res.statusCounts);
      } else {
        const filtered = (project.sprints || []).filter((s) => (filter === 'all' ? true : s.status === filter));
        const start = (newPage - 1) * sprintLimit;
        setPaginatedSprints(filtered.slice(start, start + sprintLimit));
      }
    } catch {
      const elapsed = Date.now() - startTime;
      if (elapsed < 350) {
        await new Promise((r) => setTimeout(r, 350 - elapsed));
      }
      const filtered = (project.sprints || []).filter((s) => (filter === 'all' ? true : s.status === filter));
      const start = (newPage - 1) * sprintLimit;
      setPaginatedSprints(filtered.slice(start, start + sprintLimit));
      setSprintPagination({
        page: newPage,
        limit: sprintLimit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / sprintLimit) || 1,
        hasNextPage: newPage < Math.ceil(filtered.length / sprintLimit),
        hasPrevPage: newPage > 1,
      });
    } finally {
      setIsSprintPageLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSprintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdateItemStatus = async (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => {
    const updatedSprints = project.sprints.map((sp) => {
      if (sp.id === sprintId) {
        const updatedItems = sp.items.map((it) =>
          it.id === itemId ? { ...it, status: newStatus } : it
        );
        const completedPts = updatedItems
          .filter((it) => it.status === 'done')
          .reduce((sum, it) => sum + (it.storyPoints || 3), 0);

        return {
          ...sp,
          items: updatedItems,
          completedStoryPoints: completedPts,
        };
      }
      return sp;
    });

    const optimisticProject = { ...project, sprints: updatedSprints };
    onProjectUpdated(optimisticProject);
    setUpdatingItemId(itemId);

    try {
      const updated = await ProjectApiService.updateSprintItemStatus(
        project.id,
        sprintId,
        itemId,
        newStatus
      );
      if (updated) onProjectUpdated(updated);
    } catch (err) {
      console.warn('[SprintsTab] API update fallback to mock:', err);
      const fallback = ProjectDataService.updateSprintItemStatus(
        project.id,
        sprintId,
        itemId,
        newStatus
      );
      if (fallback) onProjectUpdated(fallback);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      const updated = await ProjectApiService.startSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.startSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    }
    setConfirmSprint(null);
  };

  const handleCompleteSprint = async (sprint: Sprint) => {
    try {
      const updated = await ProjectApiService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    }
    setConfirmSprint(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Filter Bar */}
      <SprintFilterBar
        filter={filter}
        statusCounts={statusCounts}
        onFilterChange={handleFilterChange}
        disabled={isFilterLoading || isSprintPageLoading}
      />

      {/* 2. Sprints List or Skeleton Loader */}
      {isSprintPageLoading || isFilterLoading ? (
        <SprintCardsSkeleton count={Math.min(sprintLimit, 3)} />
      ) : paginatedSprints.length === 0 ? (
        allSprints.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#88c958]/15 flex items-center justify-center text-[#88c958] mb-3 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Sprints Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              No sprints have been created for this project yet. Sprints will appear here when planned or linked with a retrospective session.
            </p>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#12151c] flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">No {filter} Sprints</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              No sprints found matching the selected filter. Try selecting &quot;All Sprints&quot; to view the entire timeline.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {paginatedSprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              projectId={project.id}
              sprint={sprint}
              isExpanded={expandedSprintIds.includes(sprint.id)}
              canManageProject={canManageProject}
              updatingItemId={updatingItemId}
              onToggleExpand={toggleExpand}
              onStartSprint={(sp) => setConfirmSprint({ sprint: sp, action: 'start' })}
              onCompleteSprint={(sp) => setConfirmSprint({ sprint: sp, action: 'complete' })}
              onEditDates={(sp) => setEditingDatesSprint(sp)}
              onUpdateItemStatus={handleUpdateItemStatus}
            />
          ))}
        </div>
      )}

      {/* 3. Industry-Standard Sprints Pagination (Appears ONLY when sprints > 10) */}
      {!isSprintPageLoading && !isFilterLoading && (
        <SprintsPagination
          page={sprintPagination.page}
          limit={sprintPagination.limit}
          totalItems={sprintPagination.totalItems}
          totalPages={sprintPagination.totalPages}
          hasNextPage={sprintPagination.hasNextPage}
          hasPrevPage={sprintPagination.hasPrevPage}
          isLoading={isSprintPageLoading}
          onPageChange={handleSprintPageChange}
        />
      )}

      {/* 4. Reusable Confirmation Dialog for Start / Complete */}
      {confirmSprint && (
        <ConfirmDialog
          isOpen={Boolean(confirmSprint)}
          onClose={() => setConfirmSprint(null)}
          onConfirm={() =>
            confirmSprint.action === 'start'
              ? handleStartSprint(confirmSprint.sprint)
              : handleCompleteSprint(confirmSprint.sprint)
          }
          title={
            confirmSprint.action === 'start'
              ? `Start ${confirmSprint.sprint.name}?`
              : `Complete ${confirmSprint.sprint.name}?`
          }
          message={
            confirmSprint.action === 'start'
              ? 'Starting this sprint will initiate active tracking, burndown counters, and mark any currently active sprint as completed.'
              : 'Completing this sprint will complete current tickets and prepare open items to roll over into the next sprint.'
          }
          confirmLabel={confirmSprint.action === 'start' ? 'Start Sprint' : 'Complete Sprint'}
          variant={confirmSprint.action === 'start' ? 'primary' : 'success'}
        />
      )}

      {/* 5. Custom Sprint Dates & Cycle Modal */}
      <EditSprintDatesModal
        isOpen={Boolean(editingDatesSprint)}
        onClose={() => setEditingDatesSprint(null)}
        sprint={editingDatesSprint}
        projectId={project.id}
        onSprintUpdated={(up) => onProjectUpdated(up)}
      />
    </div>
  );
};

export default SprintsTab;
