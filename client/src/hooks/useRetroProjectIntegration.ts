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

export function useRetroProjectIntegration(): UseRetroProjectIntegrationReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  const [lastExportedSprint, setLastExportedSprint] = useState<Sprint | null>(null);

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
          id: c.cardId || c.id,
          cardId: c.cardId || c.id,
          title: c.text,
          description: c.description || '',
          storyPoints: typeof c.storyPoints === 'number' ? c.storyPoints : 3,
          priority: c.priority || 'high',
          dueDate: c.dueDate || undefined,
          assignee: c.assignee
            ? {
                name: c.assignee.name,
                email: c.assignee.email,
                avatar: c.assignee.avatar,
              }
            : undefined,
          sourceRetroId: retroId,
          sourceRetroTitle: retroTitle,
        }));

        const result = await ProjectApiService.exportActionItems(
          projectId,
          sprintId,
          itemsToExport
        );

        setIsExporting(false);
        setExportSuccess(true);
        setExportedCount(result.exportedCount);
        setLastExportedSprint(result.targetSprint);

        ProjectApiService.clearProjectsCache();

        ProjectDataService.exportActionItemsToSprint(projectId, sprintId, itemsToExport);

        return {
          success: true,
          count: result.exportedCount,
          sprintName: result.targetSprint?.name || 'Sprint Backlog',
        };
      } catch (err) {
        console.error('[useRetroProjectIntegration] Export API error:', err);
        const fallback = ProjectDataService.exportActionItemsToSprint(
          projectId,
          sprintId,
          actionCards.map((c: any) => ({
            title: c.text,
            description: c.description || '',
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
