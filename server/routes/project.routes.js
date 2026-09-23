import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  inviteProjectMembersSchema,
  exportActionItemsSchema,
  updateSprintItemStatusSchema,
  updateSprintDatesSchema,
} from '../validations/project.validation.js';

const router = Router();

/**
 * @route   GET /api/projects
 * @desc    Get all active projects (seeds Payment Gateway Integration if empty)
 */
router.get('/', optionalAuth, projectController.getAllProjects);

/**
 * @route   GET /api/projects/my/action-items
 * @desc    Get action items assigned to the current user
 */
router.get('/my/action-items', protect, projectController.getMyActionItems);

/**
 * @route   PATCH /api/projects/my/action-items/:itemId/status
 * @desc    Update status of an action item
 */
router.patch('/my/action-items/:itemId/status', protect, projectController.updateActionItemStatus);

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
router.patch(
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
 * @route   PATCH /api/projects/:id/sprints/:sprintId/items/:itemId/status
 * @desc    Update status of an individual backlog item in a sprint
 */
router.patch(
  '/:id/sprints/:sprintId/items/:itemId/status',
  optionalAuth,
  validate(updateSprintItemStatusSchema),
  projectController.updateSprintItemStatus
);

/**
 * @route   DELETE /api/projects/:id/sprints/:sprintId/items/:itemId
 * @desc    Delete an individual backlog item from a sprint
 */
router.delete(
  '/:id/sprints/:sprintId/items/:itemId',
  optionalAuth,
  projectController.deleteSprintItem
);

/**
 * @route   GET /api/projects/:id/sprints/:sprintId/items
 * @desc    Get paginated sprint backlog & action items (10 per page default)
 */
router.get(
  '/:id/sprints/:sprintId/items',
  optionalAuth,
  projectController.getSprintItems
);

/**
 * @route   GET /api/projects/:id/sprints
 * @desc    Get paginated sprints for a project (10 per page default)
 */
router.get(
  '/:id/sprints',
  optionalAuth,
  projectController.getProjectSprints
);

/**
 * @route   PATCH /api/projects/:id/sprints/:sprintId/dates
 * @desc    Update custom start/end dates and goal of an individual sprint
 */
router.patch(
  '/:id/sprints/:sprintId/dates',
  optionalAuth,
  validate(updateSprintDatesSchema),
  projectController.updateSprintDates
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
 * @route   DELETE /api/projects/:id/members/:memberId
 * @desc    Remove a team member from the project
 */
router.delete('/:id/members/:memberId', optionalAuth, projectController.removeMember);

/**
 * @route   PATCH /api/projects/:id/members/:memberId/role
 * @desc    Update a team member's role in the project
 */
router.patch('/:id/members/:memberId/role', optionalAuth, projectController.updateMemberRole);

/**
 * @route   POST /api/projects/:id/invite
 * @desc    Send project invitation emails to selected or external members
 */
router.post(
  '/:id/invite',
  optionalAuth,
  validate(inviteProjectMembersSchema),
  projectController.inviteMembers
);

/**
 * @route   POST /api/projects/:id/verify-magic-invite
 * @desc    Verify encrypted project magic invite token and issue genuine developer session
 */
router.post('/:id/verify-magic-invite', projectController.verifyMagicInvite);

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
router.patch('/:id/archive', optionalAuth, projectController.archiveProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project permanently (Danger Zone)
 */
router.delete('/:id', optionalAuth, projectController.deleteProject);

/**
 * @route   DELETE /api/projects/:id/retros/:retroId
 * @desc    Delete retrospective session linked to project
 */
router.delete('/:id/retros/:retroId', optionalAuth, projectController.deleteProjectRetro);

/**
 * @route   PATCH /api/projects/:id/retros/:retroId
 * @desc    Update retrospective session linked to project
 */
router.patch('/:id/retros/:retroId', optionalAuth, projectController.updateProjectRetro);

export default router;
