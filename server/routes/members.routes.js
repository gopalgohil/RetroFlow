import { Router } from 'express';
import membersController from '../controllers/members.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { whitelistMemberSchema, updateMemberRoleSchema } from '../validations/members.validation.js';

const router = Router();

router.get('/', protect, membersController.getMembers);

router.post(
  '/',
  protect,
  validate(whitelistMemberSchema),
  membersController.addWhitelistMember
);
router.post(
  '/whitelist',
  protect,
  validate(whitelistMemberSchema),
  membersController.addWhitelistMember
);

router.patch(
  '/:email/role',
  protect,
  validate(updateMemberRoleSchema),
  membersController.updateMemberRole
);

router.post(
  '/bulk-remove',
  protect,
  membersController.bulkRemoveMembers
);

router.delete(
  '/:email',
  protect,
  membersController.removeWhitelistMember
);
router.delete(
  '/whitelist/:email',
  protect,
  membersController.removeWhitelistMember
);

router.patch(
  '/:email/approve',
  protect,
  membersController.approveMember
);
router.post(
  '/:email/approve',
  protect,
  membersController.approveMember
);
router.post(
  '/approve',
  protect,
  membersController.approveMember
);

router.delete(
  '/:email/reject',
  protect,
  membersController.rejectMember
);
router.patch(
  '/:email/reject',
  protect,
  membersController.rejectMember
);
router.post(
  '/:email/reject',
  protect,
  membersController.rejectMember
);
router.post(
  '/reject',
  protect,
  membersController.rejectMember
);
router.delete(
  '/reject',
  protect,
  membersController.rejectMember
);

export default router;

