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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const result = await membersService.getWorkspaceMembers(req.user._id, {
      page,
      limit,
      search,
    });

    // Enable browser micro-caching with stale-while-revalidate
    res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=60');

    return ApiResponse.ok(
      res,
      result,
      `Successfully loaded ${result.members.length} of ${result.pagination.totalItems} workspace team members`
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

  /**
   * Remove a developer email from workspace whitelist
   * DELETE /api/members/:email
   */
  removeWhitelistMember = asyncHandler(async (req, res) => {
    const result = await membersService.removeWhitelistMember(req.user._id, req.params.email);
    return ApiResponse.ok(
      res,
      result,
      `Developer ${result.email} removed from whitelist successfully`
    );
  });

  /**
   * Update a member's role
   * PATCH /api/members/:email/role
   */
  updateMemberRole = asyncHandler(async (req, res) => {
    const result = await membersService.updateMemberRole(
      req.user._id,
      req.params.email,
      req.body.role
    );
    return ApiResponse.ok(
      res,
      result,
      `Role updated to ${result.projectRole} for ${result.email}`
    );
  });
}


export const membersController = new MembersController();
export default membersController;
