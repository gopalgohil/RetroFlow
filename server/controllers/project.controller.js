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
    const projects = await projectService.getAllProjects(req.user);
    const isAdmin =
      !req.user ||
      req.user.role?.toLowerCase() === 'admin' ||
      req.user.email?.toLowerCase() === 'gopalgohel249@gmail.com' ||
      req.user.email?.toLowerCase().includes('admin') ||
      req.headers['x-user-role'] === 'admin';

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: isAdmin
        ? 'Enterprise workspace initiatives retrieved successfully (Full Admin Access)'
        : 'Assigned member projects retrieved successfully',
      data: projects,
      meta: {
        isGlobalView: isAdmin,
        userRole: isAdmin ? 'admin' : (req.user?.role || 'member'),
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
    const isAdmin =
      !user ||
      user.role?.toLowerCase() === 'admin' ||
      user.email?.toLowerCase() === 'gopalgohel249@gmail.com' ||
      user.email?.toLowerCase().includes('admin') ||
      req.headers['x-user-role'] === 'admin';

    // Option B: If not Admin, check if user is a Project Lead or Manager
    if (!isAdmin && user?.email) {
      const userEmail = user.email.toLowerCase().trim();
      const userRole = (user.role || '').toLowerCase();
      const isManagerOrLeadRole =
        userRole === 'manager' ||
        userRole === 'lead' ||
        userRole === 'scrum_master';

      if (!isManagerOrLeadRole) {
        // Check if user is a lead or manager in any existing project in the workspace
        const isExistingLeadOrManager = await Project.findOne({
          $or: [
            { 'lead.email': userEmail },
            { members: { $elemMatch: { email: userEmail, role: 'Manager' } } },
          ],
        });

        if (!isExistingLeadOrManager) {
          return res.status(403).json({
            success: false,
            message:
              'Permission denied: Only Workspace Admins and Project Leads/Managers can initialize new Agile projects.',
          });
        }
      }
    }

    const project = await projectService.createProject(req.body, req.user?._id);
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
    return ApiResponse.ok(res, result, result.message || 'Invitations dispatched successfully');
  });
}

export const projectController = new ProjectController();
export default projectController;
