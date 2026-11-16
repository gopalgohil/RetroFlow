import { Router } from 'express';
import membersController from '../controllers/members.controller.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { whitelistMemberSchema, updateMemberRoleSchema } from '../validations/members.validation.js';

const router = Router();

router.get('/', protect, membersController.getMembers);

router.post(
  '/',
  protect,
  requireAdmin,
  validate(whitelistMemberSchema),
  membersController.addWhitelistMember
);
router.post(
  '/whitelist',
  protect,
  requireAdmin,
  validate(whitelistMemberSchema),
  membersController.addWhitelistMember
);

router.patch(
  '/:email/role',
  protect,
  requireAdmin,
  validate(updateMemberRoleSchema),
  membersController.updateMemberRole
);

router.post(
  '/bulk-remove',
  protect,
  requireAdmin,
  membersController.bulkRemoveMembers
);

router.delete(
  '/:email',
  protect,
  requireAdmin,
  membersController.removeWhitelistMember
);
router.delete(
  '/whitelist/:email',
  protect,
  requireAdmin,
  membersController.removeWhitelistMember
);

router.patch(
  '/:email/approve',
  protect,
  requireAdmin,
  membersController.approveMember
);
router.post(
  '/:email/approve',
  protect,
  requireAdmin,
  membersController.approveMember
);
router.post(
  '/approve',
  protect,
  requireAdmin,
  membersController.approveMember
);

router.delete(
  '/:email/reject',
  protect,
  requireAdmin,
  membersController.rejectMember
);
router.patch(
  '/:email/reject',
  protect,
  requireAdmin,
  membersController.rejectMember
);
router.post(
  '/:email/reject',
  protect,
  requireAdmin,
  membersController.rejectMember
);
router.post(
  '/reject',
  protect,
  requireAdmin,
  membersController.rejectMember
);
router.delete(
  '/reject',
  protect,
  requireAdmin,
  membersController.rejectMember
);

export default router;

