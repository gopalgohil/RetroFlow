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

/**
 * @route   POST /api/retros/:id/verify-magic-invite
 * @desc    Verify encrypted JWT magic invite token for frictionless guest entry
 */
router.post(
  '/:id/verify-magic-invite',
  retroController.verifyMagicInvite
);

/**
 * @route   POST /api/retros/:id/join-participant
 * @desc    Solution 1: Instant No-Password Participant Identity & Session Activation
 */
router.post(
  '/:id/join-participant',
  retroController.joinParticipant
);

/**
 * @route   POST /api/retros/:id/cards
 * @desc    Add a sticky card to retrospective (facilitator or participant)
 */
router.post(
  '/:id/cards',
  optionalAuth,
  retroController.addCard
);

/**
 * @route   PUT /api/retros/:id/cards/:cardId
 * @desc    Update sticky card text
 */
router.put(
  '/:id/cards/:cardId',
  optionalAuth,
  retroController.updateCard
);

/**
 * @route   DELETE /api/retros/:id/cards/:cardId
 * @desc    Delete sticky card
 */
router.delete(
  '/:id/cards/:cardId',
  optionalAuth,
  retroController.deleteCard
);

/**
 * @route   POST /api/retros/:id/cards/:cardId/vote
 * @desc    Upvote sticky card
 */
router.post(
  '/:id/cards/:cardId/vote',
  optionalAuth,
  retroController.voteCard
);

export default router;
