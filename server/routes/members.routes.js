import { Router } from 'express';
import membersController from '../controllers/members.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { whitelistMemberSchema, updateMemberRoleSchema } from '../validations/members.validation.js';

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

/**
 * @route   PATCH /api/members/:email/role
 * @desc    Update a member's project role in workspace
 * @access  Private (Authenticated facilitator)
 */
router.patch(
  '/:email/role',
  protect,
  validate(updateMemberRoleSchema),
  membersController.updateMemberRole
);

/**
 * @route   DELETE /api/members/:email
 * @desc    Remove developer email from workspace whitelist
 * @access  Private (Authenticated facilitator)
 */
router.delete(
  '/:email',
  protect,
  membersController.removeWhitelistMember
);

export default router;

