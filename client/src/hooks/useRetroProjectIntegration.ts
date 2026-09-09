'use client';

import { useState, useCallback, useEffect } from 'react';
import { Project, Sprint } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { RetroCard, StickyCard } from '@/types/retro';

interface ExportOptions {
  projectId: string;
  sprintId: string;
  retroId: string;
  retroTitle: string;
  actionCards: Array<RetroCard | StickyCard | { text: string; id?: string; cardId?: string; author?: string }>;
}

export interface UseRetroProjectIntegrationReturn {
  projects: Project[];
  isExporting: boolean;
  exportSuccess: boolean;
  exportedCount: number;
  lastExportedSprint: Sprint | null;
  getSuggestedSprint: (projectId: string) => Sprint | null;
  exportActionItems: (options: ExportOptions) => Promise<{ success: boolean; count: number; sprintName: string }>;
  resetExportState: () => void;
}

/**
 * Custom Hook: useRetroProjectIntegration
 * Seamless bridge connecting Agile Retrospective Action Items with Project Sprint Backlogs.
 * Dispatches live HTTP requests to /api/projects/:id/export-action-items
 */
export function useRetroProjectIntegration(): UseRetroProjectIntegrationReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  const [lastExportedSprint, setLastExportedSprint] = useState<Sprint | null>(null);

  // Load real projects from REST API
  const loadProjects = useCallback(async () => {
    try {
      const list = await ProjectApiService.getProjects();
      if (list && list.length > 0) {
        setProjects(list);
      } else {
        setProjects(ProjectDataService.getProjects());
      }
    } catch {
      setProjects(ProjectDataService.getProjects());
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, exportSuccess]);

  // Determine suggested target sprint (Next Upcoming Sprint or Active Sprint)
  const getSuggestedSprint = useCallback(
    (projectId: string): Sprint | null => {
      const project = projects.find((p) => p.id === projectId || p.key === projectId);
      if (!project) return null;

      const upcoming = project.sprints?.find((s) => s.status === 'upcoming');
      if (upcoming) return upcoming;

      const active = project.sprints?.find((s) => s.status === 'active');
      if (active) return active;

      return project.sprints?.[0] || null;
    },
    [projects]
  );

  // Main Export Dispatcher (Live REST API Call)
  const exportActionItems = useCallback(
    async ({
      projectId,
      sprintId,
      retroId,
      retroTitle,
      actionCards,
    }: ExportOptions): Promise<{ success: boolean; count: number; sprintName: string }> => {
      setIsExporting(true);
      setExportSuccess(false);

      try {
        const itemsToExport = actionCards.map((c: any) => ({
          title: c.text,
          description: `Action item originated from Retrospective: "${retroTitle}". Commit agreed during sprint review.`,
          storyPoints: typeof c.storyPoints === 'number' ? c.storyPoints : 3,
          priority: c.priority || 'high',
          assignee: c.assignee ? { name: c.assignee.name, avatar: c.assignee.avatar } : undefined,
          sourceRetroId: retroId,
          sourceRetroTitle: retroTitle,
        }));

        // Real REST API POST request -> visible in browser Network tab!
        const result = await ProjectApiService.exportActionItems(
          projectId,
          sprintId,
          itemsToExport
        );

        setIsExporting(false);
        setExportSuccess(true);
        setExportedCount(result.exportedCount);
        setLastExportedSprint(result.targetSprint);

        // Synchronize local cache as well
        ProjectDataService.exportActionItemsToSprint(projectId, sprintId, itemsToExport);

        return {
          success: true,
          count: result.exportedCount,
          sprintName: result.targetSprint?.name || 'Sprint Backlog',
        };
      } catch (err) {
        // Graceful fallback for offline dev
        const fallback = ProjectDataService.exportActionItemsToSprint(
          projectId,
          sprintId,
          actionCards.map((c) => ({
            title: c.text,
            description: `Action item originated from Retrospective: "${retroTitle}".`,
            sourceRetroId: retroId,
            sourceRetroTitle: retroTitle,
          }))
        );

        setIsExporting(false);
        setExportSuccess(true);
        setExportedCount(fallback.addedCount);

        return {
          success: true,
          count: fallback.addedCount,
          sprintName: 'Sprint Backlog',
        };
      }
    },
    []
  );

  const resetExportState = useCallback(() => {
    setIsExporting(false);
    setExportSuccess(false);
    setExportedCount(0);
    setLastExportedSprint(null);
  }, []);

  return {
    projects,
    isExporting,
    exportSuccess,
    exportedCount,
    lastExportedSprint,
    getSuggestedSprint,
    exportActionItems,
    resetExportState,
  };
}

export default useRetroProjectIntegration;
