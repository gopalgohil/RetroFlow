import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  exportActionItemsSchema,
} from '../validations/project.validation.js';

const router = Router();

/**
 * @route   GET /api/projects
 * @desc    Get all active projects (seeds Payment Gateway Integration if empty)
 */
router.get('/', optionalAuth, projectController.getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID or key (e.g. /api/projects/proj-pgi or /api/projects/PGI)
 */
router.get('/:id', optionalAuth, projectController.getProject);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 */
router.post(
  '/',
  optionalAuth,
  validate(createProjectSchema),
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project settings or cadence
 */
router.put(
  '/:id',
  optionalAuth,
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @route   POST /api/projects/:id/sprints/:sprintId/start
 * @desc    Start an upcoming sprint
 */
router.post(
  '/:id/sprints/:sprintId/start',
  optionalAuth,
  projectController.startSprint
);

/**
 * @route   POST /api/projects/:id/sprints/:sprintId/complete
 * @desc    Complete an active sprint
 */
router.post(
  '/:id/sprints/:sprintId/complete',
  optionalAuth,
  projectController.completeSprint
);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add a team member to the project
 */
router.post(
  '/:id/members',
  optionalAuth,
  validate(addMemberSchema),
  projectController.addMember
);

/**
 * @route   POST /api/projects/:id/export-action-items
 * @desc    Export retrospective action items into sprint backlog
 */
router.post(
  '/:id/export-action-items',
  optionalAuth,
  validate(exportActionItemsSchema),
  projectController.exportActionItems
);

/**
 * @route   POST /api/projects/:id/archive
 * @desc    Archive or restore project (Soft Delete)
 */
router.post('/:id/archive', optionalAuth, projectController.archiveProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project permanently (Danger Zone)
 */
router.delete('/:id', optionalAuth, projectController.deleteProject);

export default router;
