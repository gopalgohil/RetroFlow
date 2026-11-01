import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import membersService from '../services/members.service.js';
import { isSuperAdmin } from '../config/admin.config.js';

class MembersController {
  getMembers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const result = await membersService.getWorkspaceMembers(req.user._id, {
      page,
      limit,
      search,
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return ApiResponse.ok(
      res,
      result,
      `Successfully loaded ${result.members.length} of ${result.pagination.totalItems} workspace team members`
    );
  });

  addWhitelistMember = asyncHandler(async (req, res) => {
    const result = await membersService.whitelistDeveloper(req.user._id, req.body.email);
    return ApiResponse.ok(
      res,
      result,
      `Developer ${result.email} whitelisted successfully`
    );
  });

  removeWhitelistMember = asyncHandler(async (req, res) => {
    const result = await membersService.removeWhitelistMember(req.user._id, req.params.email);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Developer ${result.email} removed from whitelist successfully`
    );
  });

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

  approveMember = asyncHandler(async (req, res) => {
    const isAdmin =
      req.user.role === 'admin' ||
      isSuperAdmin(req.user.email);
    if (!isAdmin) {
      throw ApiError.forbidden('Only workspace administrators can approve access requests.');
    }

    const targetEmail = req.params.email || req.body?.email || req.body?.id || req.body?.userId;
    if (!targetEmail) {
      throw ApiError.badRequest('User email or identifier is required.');
    }

    const { role = 'Developer' } = req.body || {};
    const result = await membersService.approveMember(
      req.user._id,
      targetEmail,
      role
    );
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Access approved for ${result.name} (${result.email}) as ${result.projectRole}`
    );
  });

  rejectMember = asyncHandler(async (req, res) => {
    const isAdmin =
      req.user.role === 'admin' ||
      isSuperAdmin(req.user.email);
    if (!isAdmin) {
      throw ApiError.forbidden('Only workspace administrators can reject access requests.');
    }

    const targetEmail = req.params.email || req.body?.email || req.body?.id || req.body?.userId;
    if (!targetEmail) {
      throw ApiError.badRequest('User email or identifier is required.');
    }

    const result = await membersService.rejectMember(
      req.user._id,
      targetEmail
    );
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(
      res,
      result,
      `Registration request for ${result.email} rejected.`
    );
  });
}

export const membersController = new MembersController();
export default membersController;
