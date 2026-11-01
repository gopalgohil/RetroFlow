import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import settingsService from '../services/settings.service.js';

class SettingsController {
  getSettings = asyncHandler(async (req, res) => {
    const settings = await settingsService.getSettings(req.user._id);
    return ApiResponse.ok(res, settings, 'Workspace settings retrieved successfully');
  });

  updateSettings = asyncHandler(async (req, res) => {
    const updated = await settingsService.updateSettings(req.user._id, req.body);
    return ApiResponse.ok(res, updated, 'Workspace settings updated successfully');
  });
}

export const settingsController = new SettingsController();
export default settingsController;
