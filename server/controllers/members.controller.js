import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import membersService from '../services/members.service.js';
import { isSuperAdmin } from '../config/admin.config.js';

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

    // Disable browser caching to ensure instant updates on role/approval changes
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Developer ${result.email} removed from whitelist successfully`
    );
  });

  /**
   * Bulk remove members from workspace
   * POST /api/members/bulk-remove
   */
  bulkRemoveMembers = asyncHandler(async (req, res) => {
    const { emails } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails list is required for bulk removal.');
    }

    const settled = await Promise.allSettled(
      emails.map((email) => membersService.removeWhitelistMember(req.user._id, email))
    );

    const successful = settled.filter((s) => s.status === 'fulfilled').length;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      { count: successful, total: emails.length },
      `Successfully removed ${successful} contributor(s) from workspace.`
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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Role updated to ${result.projectRole} for ${result.email}`
    );
  });

  /**
   * Approve a pending developer access request
   * PATCH /api/members/:email/approve
   */
  approveMember = asyncHandler(async (req, res) => {
    const isAdmin =
      req.user.role === 'admin' ||
      isSuperAdmin(req.user.email);
    if (!isAdmin) {
      throw ApiError.forbidden('Only workspace administrators can approve access requests.');
    }

    const { role = 'Developer' } = req.body || {};
    const result = await membersService.approveMember(
      req.user._id,
      req.params.email,
      role
    );
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Access approved for ${result.name} (${result.email}) as ${result.projectRole}`
    );
  });

  /**
   * Reject and delete a pending developer access request
   * DELETE /api/members/:email/reject
   */
  rejectMember = asyncHandler(async (req, res) => {
    const isAdmin =
      req.user.role === 'admin' ||
      isSuperAdmin(req.user.email);
    if (!isAdmin) {
      throw ApiError.forbidden('Only workspace administrators can reject access requests.');
    }

    const result = await membersService.rejectMember(
      req.user._id,
      req.params.email
    );
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Registration request for ${result.email} rejected and removed.`
    );
  });
}


export const membersController = new MembersController();
export default membersController;
