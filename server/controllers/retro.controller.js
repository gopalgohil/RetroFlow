import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import retroService from '../services/retro.service.js';

class RetroController {
  /**
   * Create custom retrospective
   * POST /api/retros
   */
  createRetro = asyncHandler(async (req, res) => {
    const retro = await retroService.createRetro(req.user._id, req.body);
    return ApiResponse.created(res, retro, 'Retrospective session created successfully!');
  });

  /**
   * Get all user retrospectives
   * GET /api/retros
   */
  getUserRetros = asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const retros = await retroService.getUserRetros(req.user._id, { status, search });
    return ApiResponse.ok(res, retros, 'Retrospectives retrieved successfully');
  });

  /**
   * Get single retrospective by ID or token
   * GET /api/retros/:id
   */
  getRetro = asyncHandler(async (req, res) => {
    const retro = await retroService.getRetroByIdOrToken(req.params.id, req.user?._id);
    return ApiResponse.ok(res, retro, 'Retrospective session retrieved');
  });

  /**
   * Update retrospective session
   * PUT /api/retros/:id
   */
  updateRetro = asyncHandler(async (req, res) => {
    const updated = await retroService.updateRetro(req.params.id, req.user._id, req.body);
    return ApiResponse.ok(res, updated, 'Retrospective session updated successfully!');
  });

  /**
   * Delete retrospective session
   * DELETE /api/retros/:id
   */
  deleteRetro = asyncHandler(async (req, res) => {
    const result = await retroService.deleteRetro(req.params.id, req.user._id);
    return ApiResponse.ok(res, result, 'Retrospective session removed successfully.');
  });

  /**
   * Invite a developer to retrospective session via email
   * POST /api/retros/:id/invite
   */
  inviteTeammate = asyncHandler(async (req, res) => {
    const result = await retroService.inviteTeammate(req.params.id, req.user._id, req.body);
    return ApiResponse.ok(res, result, result.message);
  });
}

export const retroController = new RetroController();
export default retroController;
