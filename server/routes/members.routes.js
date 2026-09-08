import { Router } from 'express';
import membersController from '../controllers/members.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { whitelistMemberSchema } from '../validations/members.validation.js';

const router = Router();

/**
 * @route   GET /api/members
 * @desc    Get all workspace members and whitelisted emails
 * @access  Private (Authenticated facilitator/member)
 */
router.get('/', protect, membersController.getMembers);

/**
 * @route   POST /api/members
 * @desc    Whitelist developer email to workspace
 * @access  Private (Authenticated facilitator)
 */
router.post(
  '/',
  protect,
  validate(whitelistMemberSchema),
  membersController.addWhitelistMember
);

export default router;
