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
    const retros = await retroService.getUserRetros(req.user, { status, search });
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

  /**
   * Verify an encrypted magic invite token
   * POST /api/retros/:id/verify-magic-invite
   */
  verifyMagicInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await retroService.verifyMagicInvite(req.params.id, token);
    return ApiResponse.ok(res, result, 'Magic invite verified successfully');
  });

  /**
   * Add card to retrospective
   * POST /api/retros/:id/cards
   */
  addCard = asyncHandler(async (req, res) => {
    const card = await retroService.addCard(req.params.id, {
      ...req.body,
      author: req.body.author || req.user?.name,
      authorEmail: req.body.authorEmail || req.user?.email,
    });

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:created', card);
    }

    return ApiResponse.created(res, card, 'Card added successfully');
  });

  /**
   * Update card in retrospective
   * PUT /api/retros/:id/cards/:cardId
   */
  updateCard = asyncHandler(async (req, res) => {
    const updated = await retroService.updateCard(req.params.id, req.params.cardId, req.body);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:updated', updated);
    }

    return ApiResponse.ok(res, updated, 'Card updated successfully');
  });

  /**
   * Delete card from retrospective
   * DELETE /api/retros/:id/cards/:cardId
   */
  deleteCard = asyncHandler(async (req, res) => {
    const result = await retroService.deleteCard(req.params.id, req.params.cardId);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:deleted', { cardId: req.params.cardId });
    }

    return ApiResponse.ok(res, result, 'Card deleted successfully');
  });

  /**
   * Upvote card in retrospective
   * POST /api/retros/:id/cards/:cardId/vote
   */
  voteCard = asyncHandler(async (req, res) => {
    const voter = req.body.voter || req.user?.name || req.user?.email || 'Developer';
    const result = await retroService.voteCard(
      req.params.id,
      req.params.cardId,
      voter
    );

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:voted', result);
    }

    return ApiResponse.ok(res, result, 'Vote recorded');
  });
}

export const retroController = new RetroController();
export default retroController;
