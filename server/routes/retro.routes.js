import { Router } from 'express';
import retroController from '../controllers/retro.controller.js';
import { protect, optionalAuth, requireManagerOrAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRetroSchema, updateRetroSchema, inviteTeammateSchema } from '../validations/retro.validation.js';

const router = Router();

router.post(
  '/',
  protect,
  validate(createRetroSchema),
  retroController.createRetro
);

router.get(
  '/',
  protect,
  retroController.getUserRetros
);

router.get(
  '/analytics',
  protect,
  requireManagerOrAdmin,
  retroController.getRetroAnalytics
);

router.get(
  '/:id',
  optionalAuth,
  retroController.getRetro
);

router.put(
  '/:id',
  protect,
  validate(updateRetroSchema),
  retroController.updateRetro
);

router.delete(
  '/:id',
  protect,
  retroController.deleteRetro
);

router.post(
  '/:id/invite',
  protect,
  validate(inviteTeammateSchema),
  retroController.inviteTeammate
);

router.post(
  '/:id/verify-magic-invite',
  retroController.verifyMagicInvite
);

router.post(
  '/:id/join-participant',
  retroController.joinParticipant
);

router.post(
  '/:id/cards',
  optionalAuth,
  retroController.addCard
);

router.put(
  '/:id/cards/:cardId',
  optionalAuth,
  retroController.updateCard
);
router.patch(
  '/:id/cards/:cardId',
  optionalAuth,
  retroController.updateCard
);

router.put(
  '/:id/cards/:cardId/move',
  protect,
  retroController.moveCard
);

router.put(
  '/:id/topics/:topicId/reorder-cards',
  protect,
  retroController.reorderCards
);

router.delete(
  '/:id/cards/:cardId',
  optionalAuth,
  retroController.deleteCard
);

router.post(
  '/:id/cards/:cardId/vote',
  optionalAuth,
  retroController.voteCard
);

export default router;
