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

router.get('/', optionalAuth, projectController.getAllProjects);

router.get('/my/action-items', protect, projectController.getMyActionItems);

router.patch('/my/action-items/:itemId/status', protect, projectController.updateActionItemStatus);

router.get('/:id', optionalAuth, projectController.getProject);

router.post(
  '/',
  optionalAuth,
  validate(createProjectSchema),
  projectController.createProject
);

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

router.post(
  '/:id/sprints/:sprintId/start',
  optionalAuth,
  projectController.startSprint
);

router.post(
  '/:id/sprints/:sprintId/complete',
  optionalAuth,
  projectController.completeSprint
);

router.patch(
  '/:id/sprints/:sprintId/items/:itemId/status',
  optionalAuth,
  validate(updateSprintItemStatusSchema),
  projectController.updateSprintItemStatus
);

router.delete(
  '/:id/sprints/:sprintId/items/:itemId',
  optionalAuth,
  projectController.deleteSprintItem
);

router.delete(
  '/:id/sprints/:sprintId',
  optionalAuth,
  projectController.deleteSprint
);

router.get(
  '/:id/sprints/:sprintId/items',
  optionalAuth,
  projectController.getSprintItems
);

router.get(
  '/:id/sprints',
  optionalAuth,
  projectController.getProjectSprints
);

router.patch(
  '/:id/sprints/:sprintId/dates',
  optionalAuth,
  validate(updateSprintDatesSchema),
  projectController.updateSprintDates
);

router.post(
  '/:id/members',
  optionalAuth,
  validate(addMemberSchema),
  projectController.addMember
);

router.delete('/:id/members/:memberId', optionalAuth, projectController.removeMember);

router.patch('/:id/members/:memberId/role', optionalAuth, projectController.updateMemberRole);

router.post(
  '/:id/invite',
  optionalAuth,
  validate(inviteProjectMembersSchema),
  projectController.inviteMembers
);

router.post('/:id/verify-magic-invite', projectController.verifyMagicInvite);

router.post(
  '/:id/export-action-items',
  optionalAuth,
  validate(exportActionItemsSchema),
  projectController.exportActionItems
);

router.post('/:id/archive', optionalAuth, projectController.archiveProject);
router.patch('/:id/archive', optionalAuth, projectController.archiveProject);

router.delete('/:id', optionalAuth, projectController.deleteProject);

router.get('/:id/retros', optionalAuth, projectController.getProjectRetros);

router.delete('/:id/retros/:retroId', optionalAuth, projectController.deleteProjectRetro);

router.patch('/:id/retros/:retroId', optionalAuth, projectController.updateProjectRetro);

router.post('/admin/trigger-monthly-cron', optionalAuth, projectController.triggerMonthlyRetroCron);

export default router;
