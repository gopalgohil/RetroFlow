import { Router } from 'express';
import settingsController from '../controllers/settings.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../validations/settings.validation.js';

const router = Router();

/**
 * @route   GET /api/settings
 * @desc    Get workspace preferences and agile rules
 * @access  Private
 */
router.get('/', protect, settingsController.getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update workspace preferences
 * @access  Private
 */
router.put(
  '/',
  protect,
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
