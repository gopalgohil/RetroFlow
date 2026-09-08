import RetroBoard from '../models/RetroBoard.js';
import { ApiError } from '../utils/ApiError.js';
import env from '../config/env.js';
import emailService from './email.service.js';
import crypto from 'crypto';

class RetroService {
  /**
   * Create a new custom retrospective session board
   */
  async createRetro(userId, payload) {
    // Ensure every topic has a unique topicId and assigned order
    const formattedTopics = (payload.topics || []).map((t, idx) => ({
      topicId: t.topicId || crypto.randomUUID(),
      title: t.title.trim(),
      description: t.description ? t.description.trim() : '',
      icon: t.icon || 'smile',
      color: t.color || '#10B981',
      order: typeof t.order === 'number' ? t.order : idx,
    }));

    const retro = await RetroBoard.create({
      ...payload,
      topics: formattedTopics,
      createdBy: userId,
    });

    return retro;
  }

  /**
   * Retrieve all retrospective sessions created by or accessible to user
   */
  async getUserRetros(userOrId, filters = {}) {
    let query;
    const userId = typeof userOrId === 'object' ? userOrId._id || userOrId.id : userOrId;
    const userRole = typeof userOrId === 'object' ? userOrId.role : null;
    const userEmail =
      typeof userOrId === 'object' && userOrId.email ? userOrId.email.toLowerCase().trim() : null;

    if (userRole === 'admin' || userEmail === 'gopalgohel249@gmail.com') {
      query = { createdBy: userId };
    } else {
      // Member / Developer: returns retros where developer was invited (approvedMembers) OR created
      query = {
        $or: [
          { createdBy: userId },
          ...(userEmail ? [{ approvedMembers: userEmail }] : []),
        ],
      };
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search) {
      query.title = { $regex: filters.search.trim(), $options: 'i' };
    }

    const retros = await RetroBoard.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return retros;
  }

  /**
   * Get single retrospective by ID or shareToken
   */
  async getRetroByIdOrToken(identifier, userId = null) {
    let query;
    if (identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)) {
      query = { _id: identifier };
    } else {
      query = { shareToken: identifier };
    }

    const retro = await RetroBoard.findOne(query).populate('createdBy', 'name email');

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found.');
    }

    return retro;
  }

  /**
   * Update an existing retrospective session
   */
  async updateRetro(retroId, userId, payload) {
    const retro = await RetroBoard.findOne({ _id: retroId, createdBy: userId });

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found or you do not have permission to edit it.');
    }

    // Format topics if provided in payload
    if (payload.topics) {
      payload.topics = payload.topics.map((t, idx) => ({
        topicId: t.topicId || crypto.randomUUID(),
        title: t.title.trim(),
        description: t.description ? t.description.trim() : '',
        icon: t.icon || 'smile',
        color: t.color || '#10B981',
        order: typeof t.order === 'number' ? t.order : idx,
      }));
    }

    Object.assign(retro, payload);
    await retro.save();

    return retro;
  }

  /**
   * Delete a retrospective session
   */
  async deleteRetro(retroId, userId) {
    const retro = await RetroBoard.findOneAndDelete({ _id: retroId, createdBy: userId });

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found or already deleted.');
    }

    return { id: retroId, deleted: true };
  }

  /**
   * Dispatch an email invitation to a developer/teammate
   */
  async inviteTeammate(retroId, userId, { email, message }) {
    const retro = await RetroBoard.findOne({ _id: retroId, createdBy: userId }).populate('createdBy', 'name email');

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found or you do not have permission to invite teammates.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Whitelist developer automatically if not already listed
    if (!retro.approvedMembers.includes(normalizedEmail)) {
      retro.approvedMembers.push(normalizedEmail);
      await retro.save();
    }

    const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/retro/${retro.shareToken}`;
    const senderName = retro.createdBy?.name || 'Your Agile Facilitator';

    const htmlContent = emailService.getRetroInvitationTemplate({
      retroTitle: retro.title,
      inviteUrl,
      senderName,
      description: retro.description,
      customMessage: message,
      topics: retro.topics,
    });

    console.log(`\n📬 [Retro Invitation Email dispatched to ${normalizedEmail}] for Session "${retro.title}" (${inviteUrl})\n`);

    await emailService.sendEmail({
      to: normalizedEmail,
      subject: `Invitation: Join "${retro.title}" Retrospective on RetroFlow`,
      htmlContent,
    });

    return {
      success: true,
      email: normalizedEmail,
      shareToken: retro.shareToken,
      inviteUrl,
      message: `Invitation email sent successfully to ${normalizedEmail}`,
    };
  }

  /**
   * Add a sticky card to a retrospective
   */
  async addCard(identifier, { topicId, text, author, authorEmail }) {
    if (!topicId || !text?.trim()) {
      throw ApiError.badRequest('Topic ID and text are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { shareToken: identifier };

    const newCard = {
      cardId: crypto.randomUUID(),
      topicId,
      text: text.trim(),
      author: (author || 'Developer').trim(),
      authorEmail: authorEmail || '',
      votes: 1,
      voters: authorEmail ? [authorEmail] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const retro = await RetroBoard.findOneAndUpdate(
      query,
      { $push: { cards: newCard } },
      { new: true }
    );

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found');
    }

    return newCard;
  }

  /**
   * Update sticky card content
   */
  async updateCard(identifier, cardId, { text }) {
    if (!cardId || !text?.trim()) {
      throw ApiError.badRequest('Card ID and text are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier, 'cards.cardId': cardId }
      : { shareToken: identifier, 'cards.cardId': cardId };

    const trimmedText = text.trim();
    const updatedTime = new Date();

    const retro = await RetroBoard.findOneAndUpdate(
      query,
      {
        $set: {
          'cards.$.text': trimmedText,
          'cards.$.updatedAt': updatedTime,
        },
      },
      { new: true }
    );

    if (!retro) {
      throw ApiError.notFound('Card or retrospective session not found');
    }

    return { cardId, text: trimmedText, updatedAt: updatedTime };
  }

  /**
   * Delete a sticky card
   */
  async deleteCard(identifier, cardId) {
    if (!cardId) {
      throw ApiError.badRequest('Card ID is required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { shareToken: identifier };

    const retro = await RetroBoard.findOneAndUpdate(
      query,
      { $pull: { cards: { cardId } } },
      { new: true }
    );

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found');
    }

    return { success: true, cardId };
  }

  /**
   * Vote on a sticky card
   */
  async voteCard(identifier, cardId, voter = null) {
    if (!cardId) {
      throw ApiError.badRequest('Card ID is required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier, 'cards.cardId': cardId }
      : { shareToken: identifier, 'cards.cardId': cardId };

    const retro = await RetroBoard.findOneAndUpdate(
      query,
      {
        $inc: { 'cards.$.votes': 1 },
        ...(voter ? { $addToSet: { 'cards.$.voters': voter } } : {}),
      },
      { new: true }
    );

    if (!retro) {
      throw ApiError.notFound('Card or retrospective session not found');
    }

    const targetCard = retro.cards.find((c) => c.cardId === cardId);
    return { cardId, votes: targetCard ? targetCard.votes : 1 };
  }
}

export const retroService = new RetroService();
export default retroService;
