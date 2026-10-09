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
  canDeleteSprint?: boolean;
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
  canDeleteSprint = false,
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
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingDatesSprint, setEditingDatesSprint] = useState<Sprint | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);
  const [sprintToComplete, setSprintToComplete] = useState<Sprint | null>(null);
  const [sprintToReopen, setSprintToReopen] = useState<Sprint | null>(null);

  // Confirmation dialog state for backlog item deletion
  const [itemToDelete, setItemToDelete] = useState<{
    sprintId: string;
    itemId: string;
    title: string;
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

  const handleDeleteItem = async (sprintId: string, itemId: string) => {
    const updatedSprints = project.sprints.map((sp) => {
      if (sp.id === sprintId) {
        const updatedItems = sp.items.filter((it) => it.id !== itemId);
        const totalPts = updatedItems.reduce(
          (sum, it) => sum + (typeof it.storyPoints === 'number' ? it.storyPoints : 3),
          0
        );
        const completedPts = updatedItems
          .filter((it) => it.status === 'done')
          .reduce(
            (sum, it) => sum + (typeof it.storyPoints === 'number' ? it.storyPoints : 3),
            0
          );

        return {
          ...sp,
          items: updatedItems,
          totalStoryPoints: totalPts,
          completedStoryPoints: completedPts,
        };
      }
      return sp;
    });

    const optimisticProject = { ...project, sprints: updatedSprints };
    onProjectUpdated(optimisticProject);
    setDeletingItemId(itemId);

    try {
      const updated = await ProjectApiService.deleteSprintItem(
        project.id,
        sprintId,
        itemId
      );
      if (updated) onProjectUpdated(updated);
    } catch (err) {
      console.warn('[SprintsTab] API delete item fallback to mock:', err);
      const fallback = ProjectDataService.deleteSprintItem(
        project.id,
        sprintId,
        itemId
      );
      if (fallback) onProjectUpdated(fallback);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleCompleteSprint = async (sprint: Sprint) => {
    try {
      const updated = await ProjectApiService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    }
    setSprintToComplete(null);
  };

  const handleReopenSprint = async (sprint: Sprint) => {
    const updatedSprints = (project.sprints || []).map((s) => {
      if (s.id === sprint.id) {
        return {
          ...s,
          status: 'active' as const,
          daysLeft: project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14,
        };
      }
      return s;
    });
    const optimisticProject = { ...project, sprints: updatedSprints };
    onProjectUpdated(optimisticProject);
    setSprintToReopen(null);

    try {
      const updated = await ProjectApiService.startSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch (err) {
      console.warn('[SprintsTab] API reopen sprint fallback to mock:', err);
      const fallback = ProjectDataService.startSprint(project.id, sprint.id);
      if (fallback) onProjectUpdated(fallback);
    }
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    const updatedSprints = (project.sprints || []).filter((s) => s.id !== sprint.id);
    const optimisticProject = { ...project, sprints: updatedSprints };
    onProjectUpdated(optimisticProject);
    setSprintToDelete(null);

    try {
      const updated = await ProjectApiService.deleteSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch (err) {
      console.warn('[SprintsTab] API delete sprint fallback to mock:', err);
      const fallback = ProjectDataService.deleteSprint(project.id, sprint.id);
      if (fallback) onProjectUpdated(fallback);
    }
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
              canDeleteSprint={canDeleteSprint}
              updatingItemId={updatingItemId}
              deletingItemId={deletingItemId}
              onToggleExpand={toggleExpand}
              onCompleteSprint={(sp) => setSprintToComplete(sp)}
              onReopenSprint={(sp) => setSprintToReopen(sp)}
              onEditDates={(sp) => setEditingDatesSprint(sp)}
              onDeleteSprint={(sp) => setSprintToDelete(sp)}
              onUpdateItemStatus={handleUpdateItemStatus}
              onDeleteItem={(sprintId, itemId) => {
                const sp = project.sprints.find((s) => s.id === sprintId);
                const it = sp?.items.find((i) => i.id === itemId);
                setItemToDelete({ sprintId, itemId, title: it?.title || 'Backlog Item' });
              }}
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

      {/* 4. Complete Sprint Confirmation Dialog */}
      {sprintToComplete && (
        <ConfirmDialog
          isOpen={Boolean(sprintToComplete)}
          onClose={() => setSprintToComplete(null)}
          onConfirm={() => {
            if (sprintToComplete) {
              handleCompleteSprint(sprintToComplete);
            }
          }}
          title={`Complete ${sprintToComplete.name}?`}
          message="Completing this sprint will finish active tracking and mark all current tickets as completed for this sprint cycle."
          confirmLabel="Complete Sprint"
          variant="success"
        />
      )}

      {/* 4.1 Reopen Sprint Confirmation Dialog */}
      {sprintToReopen && (
        <ConfirmDialog
          isOpen={Boolean(sprintToReopen)}
          onClose={() => setSprintToReopen(null)}
          onConfirm={() => {
            if (sprintToReopen) {
              handleReopenSprint(sprintToReopen);
            }
          }}
          title={`Reopen ${sprintToReopen.name}?`}
          message={`Are you sure you want to reopen "${sprintToReopen.name}"? This will reactivate the sprint, restore live countdown tracking, and allow team members to continue updating items.`}
          confirmLabel="Reopen Sprint"
          cancelLabel="Cancel"
          variant="primary"
        />
      )}

      {/* 5. Sprint Deletion Confirmation Dialog (Admin & Manager Only) */}
      {sprintToDelete && (
        <ConfirmDialog
          isOpen={Boolean(sprintToDelete)}
          onClose={() => setSprintToDelete(null)}
          onConfirm={() => {
            if (sprintToDelete) {
              handleDeleteSprint(sprintToDelete);
            }
          }}
          title={`Delete ${sprintToDelete.name}?`}
          message={`Are you sure you want to permanently delete "${sprintToDelete.name}"? ${
            sprintToDelete.items && sprintToDelete.items.length > 0
              ? `This sprint contains ${sprintToDelete.items.length} backlog item(s). `
              : ''
          }This action is irreversible and will remove this sprint from the project.`}
          confirmLabel="Delete Sprint"
          cancelLabel="Cancel"
          variant="danger"
        />
      )}

      {/* 6. Backlog Item Deletion Confirmation Dialog */}
      {itemToDelete && (
        <ConfirmDialog
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete) {
              handleDeleteItem(itemToDelete.sprintId, itemToDelete.itemId);
              setItemToDelete(null);
            }
          }}
          title="Delete Backlog Item?"
          message={`Are you sure you want to delete "${itemToDelete.title}"? This item will be permanently removed from this sprint backlog and from assigned team member action items.`}
          confirmLabel="Delete Item"
          cancelLabel="Cancel"
          variant="danger"
        />
      )}

      {/* 7. Custom Sprint Dates & Cycle Modal */}
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
