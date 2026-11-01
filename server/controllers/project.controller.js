import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import projectService from '../services/project.service.js';
import Project from '../models/Project.js';
import { isSuperAdmin } from '../config/admin.config.js';
import { isManagerUser } from '../utils/role.js';
import cronService from '../services/cron.service.js';

class ProjectController {
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

  createProject = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to initialize a project.',
      });
    }

    const userEmail = user.email?.toLowerCase().trim();
    let canCreate = isManagerUser(user);

    if (!canCreate && userEmail) {
      const isExistingManager = await Project.findOne({
        members: { $elemMatch: { email: userEmail, role: { $regex: /^manager$/i } } },
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

  updateProject = asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    return ApiResponse.ok(res, project, 'Project configuration updated successfully');
  });

  startSprint = asyncHandler(async (req, res) => {
    const project = await projectService.startSprint(req.params.id, req.params.sprintId, req.user);
    return ApiResponse.ok(res, project, 'Sprint started successfully');
  });

  completeSprint = asyncHandler(async (req, res) => {
    const project = await projectService.completeSprint(req.params.id, req.params.sprintId, req.user);
    return ApiResponse.ok(res, project, 'Sprint completed successfully');
  });

  updateSprintItemStatus = asyncHandler(async (req, res) => {
    const { status, dueDate } = req.body;
    const project = await projectService.updateSprintItemStatus(
      req.params.id,
      req.params.sprintId,
      req.params.itemId,
      { status, dueDate },
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint item updated successfully');
  });

  deleteSprintItem = asyncHandler(async (req, res) => {
    const project = await projectService.deleteSprintItem(
      req.params.id,
      req.params.sprintId,
      req.params.itemId,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint backlog item deleted successfully');
  });

  deleteSprint = asyncHandler(async (req, res) => {
    const project = await projectService.deleteSprint(
      req.params.id,
      req.params.sprintId,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint deleted successfully');
  });

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

  getProjectSprints = asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;
    const result = await projectService.getProjectSprints(
      req.params.id,
      { page, limit, status, search },
      req.user
    );
    return ApiResponse.ok(res, result, 'Project sprints retrieved successfully');
  });

  getProjectRetros = asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;
    const result = await projectService.getProjectRetros(
      req.params.id,
      { page, limit, search },
      req.user
    );
    return ApiResponse.ok(res, result, 'Project retrospectives retrieved successfully');
  });

  updateSprintDates = asyncHandler(async (req, res) => {
    const project = await projectService.updateSprintDates(
      req.params.id,
      req.params.sprintId,
      req.body,
      req.user
    );
    return ApiResponse.ok(res, project, 'Sprint dates updated successfully');
  });

  addMember = asyncHandler(async (req, res) => {
    const project = await projectService.addMember(req.params.id, req.body, req.user);
    return ApiResponse.created(res, project, 'Team member assigned to project');
  });

  removeMember = asyncHandler(async (req, res) => {
    const project = await projectService.removeMember(req.params.id, req.params.memberId, req.user);
    return ApiResponse.ok(res, project, 'Team member removed from project');
  });

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

  archiveProject = asyncHandler(async (req, res) => {
    const { isArchived } = req.body;
    const project = await projectService.archiveProject(req.params.id, isArchived !== false, req.user);
    return ApiResponse.ok(
      res,
      project,
      `Project ${project.key} ${project.isArchived ? 'archived' : 'restored'} successfully`
    );
  });

  deleteProject = asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id, req.user);
    return ApiResponse.ok(res, result, `Project ${result.deletedKey} permanently deleted`);
  });

  deleteProjectRetro = asyncHandler(async (req, res) => {
    const project = await projectService.deleteProjectRetro(
      req.params.id,
      req.params.retroId,
      req.user
    );
    return ApiResponse.ok(res, project, 'Retrospective session deleted successfully');
  });

  updateProjectRetro = asyncHandler(async (req, res) => {
    const project = await projectService.updateProjectRetro(
      req.params.id,
      req.params.retroId,
      req.body,
      req.user
    );
    return ApiResponse.ok(res, project, 'Retrospective session updated successfully');
  });

  inviteMembers = asyncHandler(async (req, res) => {
    const result = await projectService.inviteMembers(req.params.id, req.body, req.user);
    return ApiResponse.ok(res, result, result.message);
  });

  verifyMagicInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await projectService.verifyMagicInvite(req.params.id, token);
    return ApiResponse.ok(res, result, `Welcome to ${result.project.name}, ${result.user.name}!`);
  });

  getMyActionItems = asyncHandler(async (req, res) => {
    const result = await projectService.getMyActionItems(req.user, req.query);
    if (result && result.pagination) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Assigned action items retrieved successfully',
        data: result.items,
        pagination: result.pagination,
      });
    }
    return ApiResponse.ok(res, result, 'Assigned action items retrieved successfully');
  });

  updateActionItemStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await projectService.updateActionItemStatus(
      req.params.itemId,
      status,
      req.user
    );
    return ApiResponse.ok(res, result, 'Action item status updated successfully');
  });

  triggerMonthlyRetroCron = asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const result = await cronService.runMonthlyRetroJob(io);
    return ApiResponse.ok(res, result, 'Monthly retrospective cron job executed successfully');
  });
}

export const projectController = new ProjectController();
export default projectController;
