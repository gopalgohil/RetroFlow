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
  async getUserRetros(userId, filters = {}) {
    const query = { createdBy: userId };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search) {
      query.title = { $regex: filters.search.trim(), $options: 'i' };
    }

    const retros = await RetroBoard.find(query)
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
}

export const retroService = new RetroService();
export default retroService;
