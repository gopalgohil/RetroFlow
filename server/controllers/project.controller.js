import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import projectService from '../services/project.service.js';

class ProjectController {
  /**
   * Get all projects
   * GET /api/projects
   */
  getAllProjects = asyncHandler(async (req, res) => {
    const projects = await projectService.getAllProjects();
    return ApiResponse.ok(res, projects, 'Projects retrieved successfully');
  });

  /**
   * Get single project by ID or key (e.g. /api/projects/proj-pgi or /api/projects/PGI)
   * GET /api/projects/:id
   */
  getProject = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectByIdOrKey(req.params.id);
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
   */
  createProject = asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user?._id);
    return ApiResponse.created(res, project, 'Agile project initialized successfully');
  });

  /**
   * Update project configuration
   * PUT /api/projects/:id
   */
  updateProject = asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body);
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
   * Add a team member to project
   * POST /api/projects/:id/members
   */
  addMember = asyncHandler(async (req, res) => {
    const project = await projectService.addMember(req.params.id, req.body);
    return ApiResponse.created(res, project, 'Team member assigned to project');
  });

  /**
   * Export retrospective action items directly into next sprint backlog
   * POST /api/projects/:id/export-action-items
   */
  exportActionItems = asyncHandler(async (req, res) => {
    const { sprintId, items } = req.body;
    const result = await projectService.exportActionItems(req.params.id, sprintId, items);
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
    const project = await projectService.archiveProject(req.params.id, isArchived !== false);
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
    const result = await projectService.deleteProject(req.params.id);
    return ApiResponse.ok(res, result, `Project ${result.deletedKey} permanently deleted`);
  });
}

export const projectController = new ProjectController();
export default projectController;
