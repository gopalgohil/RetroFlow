/**
 * @file projectApi.ts
 * @description Industry-standard Frontend API Service for Project Management
 * Triggers real HTTP REST API requests observable in the browser DevTools Network Tab.
 */

import { api, ENDPOINTS } from '@/lib/api';
import { Project, CreateProjectPayload, ProjectMemberRole } from '@/types/project';

export interface ApiResponseWrapper<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
}

export class ProjectApiService {
  /**
   * Fetch all agile projects (RBAC filtered)
   * GET /api/projects
   */
  static async getProjects(): Promise<Project[]> {
    const res = await api.get<any>(ENDPOINTS.PROJECTS);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Fetch single project by ID or key (e.g. 'PGI' or 'proj-pgi')
   * GET /api/projects/:id
   */
  static async getProjectById(idOrKey: string): Promise<Project> {
    const res = await api.get<any>(`${ENDPOINTS.PROJECTS}/${idOrKey}`);
    return res?.data || res;
  }

  /**
   * Create new project
   * POST /api/projects
   */
  static async createProject(payload: CreateProjectPayload): Promise<Project> {
    const res = await api.post<any>(ENDPOINTS.PROJECTS, payload);
    return res?.data || res;
  }

  /**
   * Update project configuration
   * PUT /api/projects/:id
   */
  static async updateProject(
    idOrKey: string,
    payload: Partial<{
      name: string;
      description: string;
      cadence: string;
      type: string;
      healthStatus: string;
      customCadenceDays: number;
    }>
  ): Promise<Project> {
    const res = await api.put<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${idOrKey}`,
      payload
    );
    return res.data;
  }

  /**
   * Start an upcoming sprint
   * POST /api/projects/:id/sprints/:sprintId/start
   */
  static async startSprint(projectId: string, sprintId: string): Promise<Project> {
    const res = await api.post<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/sprints/${sprintId}/start`
    );
    return res.data;
  }

  /**
   * Complete an active sprint
   * POST /api/projects/:id/sprints/:sprintId/complete
   */
  static async completeSprint(projectId: string, sprintId: string): Promise<Project> {
    const res = await api.post<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/sprints/${sprintId}/complete`
    );
    return res.data;
  }

  /**
   * Update status of an individual backlog item / action item in a sprint
   * PATCH /api/projects/:id/sprints/:sprintId/items/:itemId/status
   */
  static async updateSprintItemStatus(
    projectId: string,
    sprintId: string,
    itemId: string,
    status: 'todo' | 'in_progress' | 'done'
  ): Promise<Project> {
    const res = await api.patch<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/sprints/${sprintId}/items/${itemId}/status`,
      { status }
    );
    return res.data;
  }

  /**
   * Update custom dates and goal of an individual sprint
   * PATCH /api/projects/:id/sprints/:sprintId/dates
   */
  static async updateSprintDates(
    projectId: string,
    sprintId: string,
    payload: { startDate: string; endDate: string; goal?: string; name?: string }
  ): Promise<Project> {
    const res = await api.patch<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/sprints/${sprintId}/dates`,
      payload
    );
    return res.data;
  }

  /**
   * Add a team member with role
   * POST /api/projects/:id/members
   */
  static async addMember(
    projectId: string,
    member: { name: string; email: string; role: ProjectMemberRole }
  ): Promise<Project> {
    const res = await api.post<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/members`,
      member
    );
    return res.data;
  }

  /**
   * Remove a team member from project
   * DELETE /api/projects/:id/members/:memberId
   */
  static async removeMember(projectId: string, memberId: string): Promise<Project> {
    const res = await api.delete<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/members/${memberId}`
    );
    return res.data;
  }

  /**
   * Export action items from retro directly into sprint backlog
   * POST /api/projects/:id/export-action-items
   */
  static async exportActionItems(
    projectId: string,
    sprintId: string,
    items: Array<{
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      storyPoints?: number;
      assignee?: { name: string; avatar?: string };
      sourceRetroId?: string;
      sourceRetroTitle?: string;
    }>
  ): Promise<{ project: Project; exportedCount: number; targetSprint: any }> {
    const res = await api.post<
      ApiResponseWrapper<{ project: Project; exportedCount: number; targetSprint: any }>
    >(`${ENDPOINTS.PROJECTS}/${projectId}/export-action-items`, {
      sprintId,
      items,
    });
    return res.data;
  }

  /**
   * Archive or restore project (Soft Delete)
   * POST /api/projects/:id/archive
   */
  static async archiveProject(idOrKey: string, isArchived: boolean = true): Promise<Project> {
    const res = await api.post<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${idOrKey}/archive`,
      { isArchived }
    );
    return res.data;
  }

  /**
   * Permanently delete project (Hard Delete - Danger Zone)
   * DELETE /api/projects/:id
   */
  static async deleteProject(idOrKey: string): Promise<{
    deletedProjectId: string;
    deletedKey: string;
    nextProjectId: string | null;
    nextProjectKey: string | null;
  }> {
    const res = await api.delete<
      ApiResponseWrapper<{
        deletedProjectId: string;
        deletedKey: string;
        nextProjectId: string | null;
        nextProjectKey: string | null;
      }>
    >(`${ENDPOINTS.PROJECTS}/${idOrKey}`);
    return res.data;
  }

  /**
   * Delete a retrospective session linked to a project
   * DELETE /api/projects/:id/retros/:retroId
   */
  static async deleteProjectRetro(projectId: string, retroId: string): Promise<Project> {
    const res = await api.delete<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/retros/${retroId}`
    );
    return res.data;
  }

  /**
   * Update retrospective session details linked to a project
   * PATCH /api/projects/:id/retros/:retroId
   */
  static async updateProjectRetro(
    projectId: string,
    retroId: string,
    payload: { title?: string; scheduledDate?: string; sprintName?: string }
  ): Promise<Project> {
    const res = await api.patch<ApiResponseWrapper<Project>>(
      `${ENDPOINTS.PROJECTS}/${projectId}/retros/${retroId}`,
      payload
    );
    return res.data;
  }
}

export default ProjectApiService;
