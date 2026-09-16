/**
 * @file projectApi.ts
 * @description Industry-standard Frontend API Service for Project Management
 * Triggers real HTTP REST API requests observable in the browser DevTools Network Tab.
 */

import { api, ENDPOINTS } from '@/lib/api';
import { Project, CreateProjectPayload, ProjectMemberRole, EnrichedActionItem } from '@/types/project';
import { PaginationMeta } from '@/types/retro';

export interface ApiResponseWrapper<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedProjectsResponse {
  projects: Project[];
  pagination: PaginationMeta;
  counts: { all: number; managed: number };
}

export class ProjectApiService {
  private static inFlightProjectsPromise: Promise<Project[]> | null = null;
  private static cachedProjects: { data: Project[]; timestamp: number } | null = null;
  private static readonly CACHE_TTL_MS = 3000;

  public static clearProjectsCache(): void {
    this.inFlightProjectsPromise = null;
    this.cachedProjects = null;
  }

  /**
   * Fetch all agile projects (RBAC filtered) with single-flight request deduplication
   * Prevents simultaneous components (e.g. ProjectSwitcher) from sending duplicate HTTP requests
   * GET /api/projects?all=true
   */
  static async getProjects(forceRefresh = false): Promise<Project[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedProjects && now - this.cachedProjects.timestamp < this.CACHE_TTL_MS) {
      return this.cachedProjects.data;
    }

    if (this.inFlightProjectsPromise) {
      return this.inFlightProjectsPromise;
    }

    this.inFlightProjectsPromise = (async () => {
      try {
        const res = await api.get<any>(`${ENDPOINTS.PROJECTS}?all=true`);
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        this.cachedProjects = { data: list, timestamp: Date.now() };
        return list;
      } finally {
        this.inFlightProjectsPromise = null;
      }
    })();

    return this.inFlightProjectsPromise;
  }

  /**
   * Fetch paginated projects with dynamic filters and industry-standard pagination metadata
   * GET /api/projects?page=X&limit=Y&filter=Z
   */
  static async getPaginatedProjects(options?: {
    page?: number;
    limit?: number;
    filter?: 'all' | 'managed';
    search?: string;
  }): Promise<PaginatedProjectsResponse> {
    const page = options?.page || 1;
    const limit = options?.limit || 6;
    const filter = options?.filter || 'all';
    const search = options?.search || '';

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      filter,
    });

    if (search.trim()) {
      queryParams.set('search', search.trim());
    }

    const res = await api.get<any>(`${ENDPOINTS.PROJECTS}?${queryParams.toString()}`);

    const projects: Project[] = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];

    const pagination: PaginationMeta = res?.pagination || {
      page,
      limit,
      totalItems: projects.length,
      totalPages: Math.max(1, Math.ceil(projects.length / limit)),
      hasNextPage: false,
      hasPrevPage: page > 1,
    };

    const counts = res?.meta?.counts || {
      all: pagination.totalItems,
      managed: 0,
    };

    return {
      projects,
      pagination,
      counts,
    };
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
    this.clearProjectsCache();
    const res = await api.post<any>(ENDPOINTS.PROJECTS, payload);
    this.clearProjectsCache();
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
    this.clearProjectsCache();
    const res = await api.delete<
      ApiResponseWrapper<{
        deletedProjectId: string;
        deletedKey: string;
        nextProjectId: string | null;
        nextProjectKey: string | null;
      }>
    >(`${ENDPOINTS.PROJECTS}/${idOrKey}`);
    this.clearProjectsCache();
    return res?.data || res;
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

  /**
   * Send project invitation emails to selected or external members
   * POST /api/projects/:id/invite
   */
  static async inviteMembers(
    projectId: string,
    emails: string[],
    message?: string
  ): Promise<{
    success: boolean;
    projectId: string;
    projectKey: string;
    inviteUrl: string;
    invitationsCount: number;
    recipients: Array<{ email: string; status: string; role: string }>;
    message: string;
  }> {
    const res = await api.post<
      ApiResponseWrapper<{
        success: boolean;
        projectId: string;
        projectKey: string;
        inviteUrl: string;
        invitationsCount: number;
        recipients: Array<{ email: string; status: string; role: string }>;
        message: string;
      }>
    >(`${ENDPOINTS.PROJECTS}/${projectId}/invite`, {
      emails,
      message,
    });
    return res.data;
  }

  /**
   * Verify an encrypted project magic invite token and activate genuine developer session
   * POST /api/projects/:id/verify-magic-invite
   */
  static async verifyMagicInvite(projectId: string, token: string): Promise<any> {
    const res = await api.post<any>(`${ENDPOINTS.PROJECTS}/${projectId}/verify-magic-invite`, { token });
    return res.data;
  }

  /**
   * Fetch action items assigned to the current user (or all team items if requested by Admin/Manager)
   * GET /api/projects/my/action-items
   */
  static async getMyActionItems(
    options: { all?: boolean; projectId?: string; status?: string; priority?: string; search?: string } | boolean = false
  ): Promise<EnrichedActionItem[]> {
    const params: Record<string, string> = {};
    if (typeof options === 'boolean') {
      if (options) params.all = 'true';
    } else if (options) {
      if (options.all) params.all = 'true';
      if (options.projectId) params.projectId = options.projectId;
      if (options.status) params.status = options.status;
      if (options.priority) params.priority = options.priority;
      if (options.search) params.search = options.search;
    }

    const res = await api.get<ApiResponseWrapper<EnrichedActionItem[]>>(
      `${ENDPOINTS.PROJECTS}/my/action-items`,
      { params }
    );
    return res.data || [];
  }

  /**
   * Update status of an individual action item
   * PATCH /api/projects/my/action-items/:itemId/status
   */
  static async updateActionItemStatus(
    itemId: string,
    status: 'todo' | 'in_progress' | 'done',
    projectId?: string | null,
    sprintId?: string | null
  ): Promise<any> {
    const res = await api.patch<ApiResponseWrapper<any>>(
      `${ENDPOINTS.PROJECTS}/my/action-items/${itemId}/status`,
      { status }
    );
    return res.data;
  }
}

export default ProjectApiService;
