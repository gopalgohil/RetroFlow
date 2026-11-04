import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import retroService from '../services/retro.service.js';
import { isLeadOrManagerUser } from '../utils/role.js';

class RetroController {
  createRetro = asyncHandler(async (req, res) => {
    if (!isLeadOrManagerUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Developers, QA, and DevOps cannot create retrospective sessions.',
      });
    }

    const retro = await retroService.createRetro(req.user._id, req.body);
    return ApiResponse.created(res, retro, 'Retrospective session created successfully!');
  });

  getUserRetros = asyncHandler(async (req, res) => {
    const { status, search, page, limit, all } = req.query;
    const retros = await retroService.getUserRetros(req.user, { status, search, page, limit, all });
    return ApiResponse.ok(res, retros, 'Retrospectives retrieved successfully');
  });

  getRetro = asyncHandler(async (req, res) => {
    const retro = await retroService.getRetroByIdOrToken(req.params.id, req.user?._id);
    return ApiResponse.ok(res, retro, 'Retrospective session retrieved');
  });

  updateRetro = asyncHandler(async (req, res) => {
    const updated = await retroService.updateRetro(req.params.id, req.user, req.body);
    return ApiResponse.ok(res, updated, 'Retrospective session updated successfully!');
  });

  deleteRetro = asyncHandler(async (req, res) => {
    const result = await retroService.deleteRetro(req.params.id, req.user);
    return ApiResponse.ok(res, result, 'Retrospective session removed successfully.');
  });

  inviteTeammate = asyncHandler(async (req, res) => {
    if (!isLeadOrManagerUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Developers, QA, and DevOps cannot share or invite users to retrospectives.',
      });
    }

    const result = await retroService.inviteTeammate(req.params.id, req.user, req.body);
    return ApiResponse.ok(res, result, result.message);
  });

  verifyMagicInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await retroService.verifyMagicInvite(req.params.id, token);
    return ApiResponse.ok(res, result, 'Magic invite verified successfully');
  });

  joinParticipant = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const result = await retroService.joinParticipant(req.params.id, { name, email });
    return ApiResponse.ok(res, result, 'Participant session activated successfully');
  });

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

  updateCard = asyncHandler(async (req, res) => {
    const updated = await retroService.updateCard(req.params.id, req.params.cardId, req.body, req.user);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:updated', updated);
      try {
        const retroDoc = await RetroBoard.findOne(
          req.params.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(req.params.id)
            ? { _id: req.params.id }
            : { shareToken: req.params.id }
        ).lean();
        if (retroDoc?.cards) {
          io.of('/retro').to(`retro:${req.params.id}`).emit('cards:exported', {
            cards: retroDoc.cards,
          });
        }
      } catch {}
    }

    return ApiResponse.ok(res, updated, 'Card updated successfully');
  });

  moveCard = asyncHandler(async (req, res) => {
    const moved = await retroService.moveCard(req.params.id, req.params.cardId, req.body, req.user);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:moved', moved);
    }

    return ApiResponse.ok(res, moved, 'Card moved successfully');
  });

  reorderCards = asyncHandler(async (req, res) => {
    const { cardIds } = req.body;
    const reordered = await retroService.reorderCards(req.params.id, req.params.topicId, cardIds, req.user);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('cards:reordered', reordered);
    }

    return ApiResponse.ok(res, reordered, 'Cards reordered successfully');
  });

  deleteCard = asyncHandler(async (req, res) => {
    const result = await retroService.deleteCard(req.params.id, req.params.cardId, req.user);

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:deleted', { cardId: req.params.cardId });
      if (result?.shareToken && result.shareToken !== req.params.id) {
        io.of('/retro').to(`retro:${result.shareToken}`).emit('card:deleted', { cardId: req.params.cardId });
      }
    }

    return ApiResponse.ok(res, result, 'Card deleted successfully');
  });

  voteCard = asyncHandler(async (req, res) => {
    const voter = req.body.voter || req.user?.name || 'Developer';
    const voterEmail = req.body.voterEmail || req.user?.email || null;
    const result = await retroService.voteCard(
      req.params.id,
      req.params.cardId,
      voter,
      voterEmail
    );

    const io = req.app.get('io');
    if (io) {
      io.of('/retro').to(`retro:${req.params.id}`).emit('card:voted', result);
    }

    return ApiResponse.ok(res, result, 'Vote recorded');
  });

  getRetroAnalytics = asyncHandler(async (req, res) => {
    const { projectId = 'all', year } = req.query;
    const analytics = await retroService.getRetroAnalytics(req.user, { projectId, year });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return ApiResponse.ok(res, analytics, 'Retrospective analytics loaded successfully');
  });
}

export const retroController = new RetroController();
export default retroController;
