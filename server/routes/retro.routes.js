import { Router } from 'express';
import retroController from '../controllers/retro.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRetroSchema, updateRetroSchema, inviteTeammateSchema } from '../validations/retro.validation.js';

const router = Router();

/**
 * @route   POST /api/retros
 * @desc    Create a custom retrospective session board
 */
router.post(
  '/',
  protect,
  validate(createRetroSchema),
  retroController.createRetro
);

/**
 * @route   GET /api/retros
 * @desc    Get all retrospectives for the authenticated user
 */
router.get(
  '/',
  protect,
  retroController.getUserRetros
);

/**
 * @route   GET /api/retros/:id
 * @desc    Get single retrospective by ID or shareToken (accessible to invited teammates)
 */
router.get(
  '/:id',
  optionalAuth,
  retroController.getRetro
);

/**
 * @route   PUT /api/retros/:id
 * @desc    Update retrospective topics, order, or settings
 */
router.put(
  '/:id',
  protect,
  validate(updateRetroSchema),
  retroController.updateRetro
);

/**
 * @route   DELETE /api/retros/:id
 * @desc    Delete retrospective session
 */
router.delete(
  '/:id',
  protect,
  retroController.deleteRetro
);

/**
 * @route   POST /api/retros/:id/invite
 * @desc    Invite a developer or teammate to retrospective session via email
 */
router.post(
  '/:id/invite',
  protect,
  validate(inviteTeammateSchema),
  retroController.inviteTeammate
);

export default router;
