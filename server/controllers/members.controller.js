import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import membersService from '../services/members.service.js';

/**
 * Members Controller
 * Thin HTTP adapter mapping requests to MembersService
 */
class MembersController {
  /**
   * Get team members and whitelist roster
   * GET /api/members
   */
  getMembers = asyncHandler(async (req, res) => {
    const members = await membersService.getWorkspaceMembers(req.user._id);
    return ApiResponse.ok(
      res,
      members,
      `Successfully loaded ${members.length} workspace team members`
    );
  });

  /**
   * Add a developer email to workspace whitelist
   * POST /api/members
   */
  addWhitelistMember = asyncHandler(async (req, res) => {
    const result = await membersService.whitelistDeveloper(req.user._id, req.body.email);
    return ApiResponse.ok(
      res,
      result,
      `Developer ${result.email} whitelisted successfully`
    );
  });
}

export const membersController = new MembersController();
export default membersController;
