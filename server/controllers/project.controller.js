import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import projectService from '../services/project.service.js';
import Project from '../models/Project.js';

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
        userEmail === 'gopalgohel249@gmail.com' ||
        userEmail?.includes('admin'));

    const projects = await projectService.getAllProjects(user);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: isAdmin
        ? 'Enterprise workspace initiatives retrieved successfully (Full Admin Access)'
        : 'Assigned member projects retrieved successfully',
      data: projects,
      meta: {
        isGlobalView: isAdmin,
        userRole: isAdmin ? 'admin' : (user?.role || 'member'),
        total: projects.length,
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
      userEmail === 'gopalgohel249@gmail.com' ||
      userEmail?.includes('admin');

    const isManagerOrLeadRole =
      userRole === 'manager' ||
      userRole === 'project lead' ||
      userRole === 'lead' ||
      userRole === 'scrum_master';

    let canCreate = isAdmin || isManagerOrLeadRole;

    if (!canCreate && userEmail) {
      // Check if user is a lead or manager in any existing project in the workspace
      const isExistingLeadOrManager = await Project.findOne({
        $or: [
          { 'lead.email': userEmail },
          { members: { $elemMatch: { email: userEmail, role: 'Manager' } } },
        ],
      });

      if (isExistingLeadOrManager) {
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
}

export const projectController = new ProjectController();
export default projectController;
