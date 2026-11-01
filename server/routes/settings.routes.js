import { Router } from 'express';
import settingsController from '../controllers/settings.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../validations/settings.validation.js';

const router = Router();

router.get('/', protect, settingsController.getSettings);

router.put(
  '/',
  protect,
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
