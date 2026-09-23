import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import projectService from '../services/project.service.js';
import Project from '../models/Project.js';
import { isSuperAdmin } from '../config/admin.config.js';

class ProjectController {
  /**
   * Get all projects (RBAC filtered)
   * GET /api/projects
   */
  getAllProjects = asyncHandler(async (req, res) => {
    const user = req.user;
    const userEmail = user?.email?.toLowerCase().trim();
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin =
      Boolean(user) &&
      (userRole === 'admin' ||
        isSuperAdmin(userEmail));

    const { page, limit, filter, search, all } = req.query;

    const result = await projectService.getAllProjects(user, {
      page,
      limit,
      filter,
      search,
      all,
    });

    // High-speed browser caching with background revalidation
    res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=60');

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: isAdmin
        ? 'Enterprise workspace initiatives retrieved successfully (Full Admin Access)'
        : 'Assigned member projects retrieved successfully',
      data: result.projects,
      pagination: result.pagination,
      meta: {
        isGlobalView: isAdmin,
        userRole: isAdmin ? 'admin' : (user?.role || 'member'),
        total: result.pagination.totalItems,
        counts: result.counts,
      },
    });
  });

  /**
   * Get single project by ID or key with RBAC membership validation
   * GET /api/projects/:id
   */
  getProject = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectByIdOrKey(req.params.id, req.user);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project "${req.params.id}" not found`,
      });
    }
    return ApiResponse.ok(res, project, 'Project details retrieved successfully');
  });

  /**
   * Create new project
   * POST /api/projects
   * RBAC Option B: Allowed for Admins, Project Leads, and Managers
   */
  createProject = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to initialize a project.',
      });
    }

    const userEmail = user.email?.toLowerCase().trim();
    const userRole = (user.role || '').toLowerCase();
    const isAdmin =
      userRole === 'admin' ||
      isSuperAdmin(userEmail);

    const userProjectRole = (user.projectRole || '').toLowerCase();
    const isManager =
      userProjectRole === 'manager' ||
      userRole === 'manager' ||
      userRole.includes('manager');

    let canCreate = isAdmin || isManager;

    if (!canCreate && userEmail) {
      // Check if user is assigned Manager in any existing project in the workspace
      const isExistingManager = await Project.findOne({
        members: { $elemMatch: { email: userEmail, role: 'Manager' } },
      });

      if (isExistingManager) {
        canCreate = true;
      }
    }

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message:
          'Permission denied: Only Workspace Admins and Managers can initialize new Agile projects.',
      });
    }

    const project = await projectService.createProject(req.body, user._id);
    return ApiResponse.created(res, project, 'Agile project initialized successfully');
  });

  /**
   * Update project configuration
   * PUT /api/projects/:id
   */
  updateProject = asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    return ApiResponse.ok(res, project, 'Project configuration updated successfully');
  });

  /**
   * Start an upcoming sprint
   * POST /api/projects/:id/sprints/:sprintId/start
   */
  startSprint = asyncHandler(async (req, res) => {
    const project = await projectService.startSprint(req.params.id, req.params.sprintId);
    return ApiResponse.ok(res, project, 'Sprint started successfully');
  });

  /**
   * Complete an active sprint
   * POST /api/projects/:id/sprints/:sprintId/complete
   */
  completeSprint = asyncHandler(async (req, res) => {
    const project = await projectService.completeSprint(req.params.id, req.params.sprintId);
    return ApiResponse.ok(res, project, 'Sprint completed successfully');
  });

  /**
   * Update status of an individual backlog item in a sprint
   * PATCH /api/projects/:id/sprints/:sprintId/items/:itemId/status
   */
  updateSprintItemStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const project = await projectService.updateSprintItemStatus(
      req.params.id,
      req.params.sprintId,
      req.params.itemId,
      status,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint item status updated successfully');
  });

  /**
   * Delete an individual backlog item in a sprint
   * DELETE /api/projects/:id/sprints/:sprintId/items/:itemId
   */
  deleteSprintItem = asyncHandler(async (req, res) => {
    const project = await projectService.deleteSprintItem(
      req.params.id,
      req.params.sprintId,
      req.params.itemId,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint backlog item deleted successfully');
  });

  /**
   * Get paginated backlog items & action items for an individual sprint
   * GET /api/projects/:id/sprints/:sprintId/items
   */
  getSprintItems = asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;
    const result = await projectService.getSprintItems(
      req.params.id,
      req.params.sprintId,
      { page, limit, status, search },
      req.user
    );
    return ApiResponse.ok(res, result, 'Sprint backlog items retrieved successfully');
  });

  /**
   * Get paginated sprints for a project
   * GET /api/projects/:id/sprints
   */
  getProjectSprints = asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;
    const result = await projectService.getProjectSprints(
      req.params.id,
      { page, limit, status, search },
      req.user
    );
    return ApiResponse.ok(res, result, 'Project sprints retrieved successfully');
  });

  /**
   * Update custom dates and goal of an individual sprint
   * PATCH /api/projects/:id/sprints/:sprintId/dates
   */
  updateSprintDates = asyncHandler(async (req, res) => {
    const project = await projectService.updateSprintDates(
      req.params.id,
      req.params.sprintId,
      req.body,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint dates updated successfully');
  });

  /**
   * Add a team member to project
   * POST /api/projects/:id/members
   */
  addMember = asyncHandler(async (req, res) => {
    const project = await projectService.addMember(req.params.id, req.body, req.user);
    return ApiResponse.created(res, project, 'Team member assigned to project');
  });

  /**
   * Remove a team member from project
   * DELETE /api/projects/:id/members/:memberId
   */
  removeMember = asyncHandler(async (req, res) => {
    const project = await projectService.removeMember(req.params.id, req.params.memberId, req.user);
    return ApiResponse.ok(res, project, 'Team member removed from project');
  });

  /**
   * Update a team member's role in project
   * PATCH /api/projects/:id/members/:memberId/role
   */
  updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const project = await projectService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      role,
      req.user
    );
    return ApiResponse.ok(res, project, 'Project member role updated successfully.');
  });

  /**
   * Export retrospective action items directly into next sprint backlog
   * POST /api/projects/:id/export-action-items
   */
  exportActionItems = asyncHandler(async (req, res) => {
    const { sprintId, items } = req.body;
    const result = await projectService.exportActionItems(
      req.params.id,
      sprintId,
      items,
      req.user
    );
    return ApiResponse.ok(
      res,
      result,
      `${result.exportedCount} action items exported to ${result.targetSprint.name}`
    );
  });

  /**
   * Archive or restore project (Soft Delete)
   * POST /api/projects/:id/archive
   */
  archiveProject = asyncHandler(async (req, res) => {
    const { isArchived } = req.body;
    const project = await projectService.archiveProject(req.params.id, isArchived !== false, req.user);
    return ApiResponse.ok(
      res,
      project,
      `Project ${project.key} ${project.isArchived ? 'archived' : 'restored'} successfully`
    );
  });

  /**
   * Delete project permanently (Danger Zone)
   * DELETE /api/projects/:id
   */
  deleteProject = asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id, req.user);
    return ApiResponse.ok(res, result, `Project ${result.deletedKey} permanently deleted`);
  });

  /**
   * Delete a retrospective linked to a project
   * DELETE /api/projects/:id/retros/:retroId
   */
  deleteProjectRetro = asyncHandler(async (req, res) => {
    const project = await projectService.deleteProjectRetro(
      req.params.id,
      req.params.retroId,
      req.user
    );
    return ApiResponse.ok(res, project, 'Retrospective session deleted successfully');
  });

  /**
   * Update retrospective linked to a project
   * PATCH /api/projects/:id/retros/:retroId
   */
  updateProjectRetro = asyncHandler(async (req, res) => {
    const project = await projectService.updateProjectRetro(
      req.params.id,
      req.params.retroId,
      req.body,
      req.user
    );
    return ApiResponse.ok(res, project, 'Retrospective session updated successfully');
  });

  /**
   * Send invitation emails for this project
   * POST /api/projects/:id/invite
   */
  inviteMembers = asyncHandler(async (req, res) => {
    const result = await projectService.inviteMembers(req.params.id, req.body, req.user);
    return ApiResponse.ok(res, result, result.message);
  });

  /**
   * Verify an encrypted magic invite token for project
   * POST /api/projects/:id/verify-magic-invite
   */
  verifyMagicInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await projectService.verifyMagicInvite(req.params.id, token);
    return ApiResponse.ok(res, result, `Welcome to ${result.project.name}, ${result.user.name}!`);
  });

  /**
   * Get action items assigned to the current user (or all team items if requested by Admin/Manager)
   * GET /api/projects/my/action-items
   */
  getMyActionItems = asyncHandler(async (req, res) => {
    const items = await projectService.getMyActionItems(req.user, req.query);
    return ApiResponse.ok(res, items, 'Assigned action items retrieved successfully');
  });

  /**
   * Update action item status
   * PATCH /api/projects/my/action-items/:itemId/status
   */
  updateActionItemStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await projectService.updateActionItemStatus(
      req.params.itemId,
      status,
      req.user
    );
    return ApiResponse.ok(res, result, 'Action item status updated successfully');
  });
}

export const projectController = new ProjectController();
export default projectController;
