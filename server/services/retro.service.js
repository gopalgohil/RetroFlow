import RetroBoard from '../models/RetroBoard.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import projectService from './project.service.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import env from '../config/env.js';
import emailService from './email.service.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/token.js';


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

    let approvedMembers = Array.isArray(payload.approvedMembers)
      ? payload.approvedMembers.map((e) => e.toLowerCase().trim()).filter(Boolean)
      : [];

    let linkedProject = null;
    if (payload.projectId || payload.projectKey) {
      const idOrKey = payload.projectId || payload.projectKey;
      const isValidObjectId = mongoose.Types.ObjectId.isValid(idOrKey);
      linkedProject = await Project.findOne(
        isValidObjectId
          ? { $or: [{ _id: idOrKey }, { key: String(idOrKey).toUpperCase() }] }
          : { key: String(idOrKey).toUpperCase() }
      );
    }

    let targetSprint = null;
    let sprintLabel = payload.sprintName || null;

    if (linkedProject) {
      // Auto-whitelist all project members for strict project privacy
      const projectMemberEmails = linkedProject.members.map((m) => m.email.toLowerCase().trim());
      approvedMembers = Array.from(new Set([...approvedMembers, ...projectMemberEmails]));

      // Determine sprint number dynamically
      let sprintNum = null;
      if (payload.sprintName) {
        const match = payload.sprintName.match(/\d+/);
        if (match) sprintNum = parseInt(match[0], 10);
      }
      if (!sprintNum && payload.title) {
        const match = payload.title.match(/sprint\s*(\d+)/i);
        if (match) sprintNum = parseInt(match[1], 10);
      }
      if (!sprintNum) {
        sprintNum = (linkedProject.retrospectives?.length || 0) + 1;
      }

      sprintLabel = `Sprint ${sprintNum}`;

      // Check if this sprint exists in linkedProject.sprints
      targetSprint = linkedProject.sprints?.find(
        (s) => s.number === sprintNum || s.name.toLowerCase().startsWith(`sprint ${sprintNum}`)
      );

      if (!targetSprint) {
        // Automatically create individual sprint in the project
        targetSprint = {
          id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
          name: `Sprint ${sprintNum} - Execution & Backlog`,
          number: sprintNum,
          status: linkedProject.sprints.length === 0 ? 'active' : 'upcoming',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          goal: `Sprint ${sprintNum} deliverables and retrospective action items.`,
          daysLeft: linkedProject.cadence === '1_week' ? 7 : linkedProject.cadence === '3_weeks' ? 21 : 14,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          openBlockers: 0,
          items: [],
        };
        linkedProject.sprints.push(targetSprint);
      }
    }

    const retro = await RetroBoard.create({
      ...payload,
      approvedMembers,
      projectId: linkedProject ? linkedProject._id : (payload.projectId || null),
      projectKey: linkedProject ? linkedProject.key : (payload.projectKey || null),
      sprintId: targetSprint ? targetSprint.id : (payload.sprintId || null),
      sprintName: sprintLabel || (linkedProject?.activeSprint ? linkedProject.activeSprint.name.split(' - ')[0] : null),
      isProjectScoped: payload.isProjectScoped !== undefined ? payload.isProjectScoped : !!linkedProject,
      topics: formattedTopics,
      createdBy: userId,
    });

    // If linked to a project, push retro link into project.retrospectives
    if (linkedProject) {
      const exists = linkedProject.retrospectives.some(
        (r) => r.id === retro._id.toString() || r.shareToken === retro.shareToken
      );

      if (!exists) {
        linkedProject.retrospectives.unshift({
          id: retro._id.toString(),
          shareToken: retro.shareToken,
          title: retro.title,
          scheduledDate: retro.scheduledDate
            ? new Date(retro.scheduledDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          status: retro.status || 'active',
          sprintName: sprintLabel || 'Sprint Active',
          topicsCount: retro.topics.length,
          cardsCount: 0,
          actionItemsCount: 0,
          actionItemsExported: false,
        });
      }

      await linkedProject.save();
    }

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
      // Admin has full workspace visibility
      query = {};
    } else {
      // Member / Developer: returns retros where developer was invited (approvedMembers), created,
      // or attached to projects where they are assigned members or lead
      let memberProjectIds = [];
      if (userEmail) {
        try {
          const userProjects = await Project.find({
            $or: [
              { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
              { 'members.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
            ],
          }).select('_id');
          memberProjectIds = userProjects.map((p) => p._id);
        } catch {}
      }

      query = {
        $or: [
          { createdBy: userId },
          ...(userEmail ? [{ approvedMembers: userEmail }] : []),
          ...(memberProjectIds.length > 0 ? [{ projectId: { $in: memberProjectIds } }] : []),
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
   * Helper to construct seed retrospective document from project retro link
   */
  buildSeedRetroData(identifier, retroLink, project, creatorId = null) {
    const isPgi13 = identifier === 'retro-pgi-13' || retroLink?.shareToken === 'retro-pgi-13';
    const isPgi14 = identifier === 'retro-pgi-14' || retroLink?.shareToken === 'retro-pgi-14';
    const isPgi12 = identifier === 'retro-pgi-12' || retroLink?.shareToken === 'retro-pgi-12';

    const title = retroLink?.title || (
      isPgi13 ? 'Sprint 13 Retro: Stripe 3DS V2' :
      isPgi14 ? 'Sprint 14 Mid-Cycle Sync' :
      isPgi12 ? 'Sprint 12 Post-Mortem & Flow' :
      `${project?.name || 'Agile Project'} - Retrospective`
    );

    const sprintName = retroLink?.sprintName || (
      isPgi13 ? 'Sprint 13' :
      isPgi14 ? 'Sprint 14 (Active)' :
      isPgi12 ? 'Sprint 12' :
      'Sprint Retrospective'
    );

    const topics = [
      { topicId: 'topic-1', title: 'What went well? 🚀', description: 'Celebrations, wins, and team velocity achievements', icon: 'smile', color: '#10B981', order: 0 },
      { topicId: 'topic-2', title: 'What could be improved? ⚠️', description: 'Frictions, blockers, delays, or architectural debt', icon: 'frown', color: '#F43F5E', order: 1 },
      { topicId: 'topic-3', title: 'Action Items 🎯', description: 'Concrete backlog deliverables for the upcoming sprint', icon: 'target', color: '#0EA5E9', order: 2 },
    ];

    let cards = [];
    if (isPgi13) {
      cards = [
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-1',
          text: 'Stripe 3DS V2 challenge flow completed and tested cleanly with sandbox issuing banks.',
          author: 'Sarah Jenkins',
          authorEmail: 'sarah.j@retroflow.io',
          votes: 6,
          voters: ['sarah.j@retroflow.io', 'gopalgohel249@gmail.com', 'priya.s@retroflow.io'],
          createdAt: new Date(Date.now() - 12 * 86400000),
          updatedAt: new Date(Date.now() - 12 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-1',
          text: 'Webhook signature validation middleware added with zero false negatives.',
          author: 'Marcus Chen',
          authorEmail: 'marcus.c@retroflow.io',
          votes: 5,
          voters: ['marcus.c@retroflow.io', 'sarah.j@retroflow.io'],
          createdAt: new Date(Date.now() - 11 * 86400000),
          updatedAt: new Date(Date.now() - 11 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-1',
          text: 'Idempotency key caching prevents duplicate customer credit charges under network retries.',
          author: 'Gopal',
          authorEmail: 'gopalgohel249@gmail.com',
          votes: 8,
          voters: ['gopalgohel249@gmail.com', 'priya.s@retroflow.io', 'marcus.c@retroflow.io'],
          createdAt: new Date(Date.now() - 10 * 86400000),
          updatedAt: new Date(Date.now() - 10 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-2',
          text: 'Sandbox environment experienced intermittent 504 timeouts from test card payment gateway.',
          author: 'Priya Sharma',
          authorEmail: 'priya.s@retroflow.io',
          votes: 4,
          voters: ['priya.s@retroflow.io', 'david.m@retroflow.io'],
          createdAt: new Date(Date.now() - 9 * 86400000),
          updatedAt: new Date(Date.now() - 9 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-2',
          text: 'End-to-end integration tests took 18 minutes to run in CI/CD pipeline, slowing down PR reviews.',
          author: 'Marcus Chen',
          authorEmail: 'marcus.c@retroflow.io',
          votes: 7,
          voters: ['marcus.c@retroflow.io', 'sarah.j@retroflow.io', 'david.m@retroflow.io'],
          createdAt: new Date(Date.now() - 8 * 86400000),
          updatedAt: new Date(Date.now() - 8 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-3',
          text: 'Split CI test pipeline into parallel matrix execution to reduce run to under 5 mins.',
          author: 'Marcus Chen',
          authorEmail: 'marcus.c@retroflow.io',
          votes: 5,
          voters: ['marcus.c@retroflow.io', 'gopalgohel249@gmail.com'],
          createdAt: new Date(Date.now() - 7 * 86400000),
          updatedAt: new Date(Date.now() - 7 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-3',
          text: 'Update Stripe webhook secret rotation runbook in engineering documentation.',
          author: 'Sarah Jenkins',
          authorEmail: 'sarah.j@retroflow.io',
          votes: 4,
          voters: ['sarah.j@retroflow.io', 'priya.s@retroflow.io'],
          createdAt: new Date(Date.now() - 6 * 86400000),
          updatedAt: new Date(Date.now() - 6 * 86400000),
        },
      ];
    } else if (isPgi14) {
      cards = [
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-1',
          text: 'Webhook retry queue latency dropped by 45% after Redis connection pool optimizations.',
          author: 'Sarah Jenkins',
          authorEmail: 'sarah.j@retroflow.io',
          votes: 4,
          voters: ['sarah.j@retroflow.io', 'priya.s@retroflow.io'],
          createdAt: new Date(Date.now() - 3 * 86400000),
          updatedAt: new Date(Date.now() - 3 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-2',
          text: 'Need clearer alerting on DLQ (Dead Letter Queue) message overflows in staging.',
          author: 'Priya Sharma',
          authorEmail: 'priya.s@retroflow.io',
          votes: 5,
          voters: ['priya.s@retroflow.io', 'gopalgohel249@gmail.com'],
          createdAt: new Date(Date.now() - 2 * 86400000),
          updatedAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-3',
          text: 'Setup Slack webhook notification channel for unhandled refund failure webhooks.',
          author: 'Gopal',
          authorEmail: 'gopalgohel249@gmail.com',
          votes: 6,
          voters: ['gopalgohel249@gmail.com', 'marcus.c@retroflow.io'],
          createdAt: new Date(Date.now() - 1 * 86400000),
          updatedAt: new Date(Date.now() - 1 * 86400000),
        },
      ];
    } else if (isPgi12) {
      cards = [
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-1',
          text: 'Zero downtime achieved during database migration to multi-currency schema.',
          author: 'Marcus Chen',
          authorEmail: 'marcus.c@retroflow.io',
          votes: 5,
          voters: ['marcus.c@retroflow.io', 'sarah.j@retroflow.io'],
          createdAt: new Date(Date.now() - 20 * 86400000),
          updatedAt: new Date(Date.now() - 20 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-2',
          text: 'Documentation on multi-currency exchange rate rounding rules was missing.',
          author: 'David Miller',
          authorEmail: 'david.m@retroflow.io',
          votes: 3,
          voters: ['david.m@retroflow.io'],
          createdAt: new Date(Date.now() - 19 * 86400000),
          updatedAt: new Date(Date.now() - 19 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-3',
          text: 'Publish currency rounding standard doc in team repository.',
          author: 'David Miller',
          authorEmail: 'david.m@retroflow.io',
          votes: 4,
          voters: ['david.m@retroflow.io', 'gopalgohel249@gmail.com'],
          createdAt: new Date(Date.now() - 18 * 86400000),
          updatedAt: new Date(Date.now() - 18 * 86400000),
        },
      ];
    }

    const memberEmails = new Set();
    if (project?.lead?.email) memberEmails.add(project.lead.email.toLowerCase().trim());
    if (Array.isArray(project?.members)) {
      project.members.forEach((m) => {
        if (m.email) memberEmails.add(m.email.toLowerCase().trim());
      });
    }

    return {
      title,
      description: `Collaborative retrospective session for ${project?.name || 'Project'} (${project?.key || 'Agile'}).`,
      shareToken: retroLink?.shareToken || identifier,
      scheduledDate: retroLink?.scheduledDate ? new Date(retroLink.scheduledDate) : new Date(),
      status: retroLink?.status || 'active',
      approvalRequired: false,
      revealMode: false,
      votingLimit: 5,
      backgroundTheme: 'standard',
      topics,
      approvedMembers: Array.from(memberEmails),
      projectId: project?._id || null,
      projectKey: project?.key || null,
      sprintName,
      isProjectScoped: true,
      createdBy: creatorId || project?.createdBy || null,
      cards,
    };
  }

  /**
   * Get single retrospective by ID or shareToken
   * With resilient auto-provisioning for project-linked and canonical retrospectives
   */
  async getRetroByIdOrToken(identifier, userId = null) {
    let query;
    if (identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)) {
      query = { _id: identifier };
    } else {
      query = { shareToken: identifier };
    }

    let retro = await RetroBoard.findOne(query).populate('createdBy', 'name email');

    // If not found in RetroBoard, check if this retro is registered under any Project
    if (!retro) {
      let linkedProject = await Project.findOne({
        $or: [
          { 'retrospectives.shareToken': identifier },
          { 'retrospectives.id': identifier },
        ],
      });


      if (linkedProject) {
        const retroLink = (linkedProject.retrospectives || []).find(
          (r) => r.shareToken === identifier || r.id === identifier
        );
        let creatorId = linkedProject.createdBy || userId;
        if (!creatorId) {
          const adminUser = await User.findOne({ $or: [{ role: 'admin' }, { email: 'gopalgohel249@gmail.com' }] });
          creatorId = adminUser?._id || null;
        }
        const seedPayload = this.buildSeedRetroData(identifier, retroLink, linkedProject, creatorId);
        retro = await RetroBoard.create(seedPayload);
        retro = await RetroBoard.findById(retro._id).populate('createdBy', 'name email');
      }
    }

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found.');
    }

    const retroObj = retro.toObject();
    if (retro.projectId) {
      try {
        const project = await Project.findById(retro.projectId).select('lead members key name').lean();
        if (project) {
          retroObj.project = project;

          // Auto-whitelist all project members (Developers, QA, Managers) in retro.approvedMembers
          const projectEmails = (project.members || []).map((m) => m.email?.toLowerCase().trim()).filter(Boolean);
          if (project.lead?.email) projectEmails.push(project.lead.email.toLowerCase().trim());

          let updatedApproved = false;
          projectEmails.forEach((email) => {
            if (!retro.approvedMembers.includes(email)) {
              retro.approvedMembers.push(email);
              updatedApproved = true;
            }
          });
          if (updatedApproved) {
            await retro.save();
          }
        }
      } catch {
        // Ignore project fetch error
      }
    } else if (retro.projectKey) {
      try {
        const project = await Project.findOne({ key: retro.projectKey }).select('lead members key name').lean();
        if (project) {
          retroObj.project = project;

          // Auto-whitelist all project members in retro.approvedMembers
          const projectEmails = (project.members || []).map((m) => m.email?.toLowerCase().trim()).filter(Boolean);
          if (project.lead?.email) projectEmails.push(project.lead.email.toLowerCase().trim());

          let updatedApproved = false;
          projectEmails.forEach((email) => {
            if (!retro.approvedMembers.includes(email)) {
              retro.approvedMembers.push(email);
              updatedApproved = true;
            }
          });
          if (updatedApproved) {
            await retro.save();
          }
        }
      } catch {
        // Ignore project fetch error
      }
    }

    return retroObj;
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

    // Generate secure encrypted JWT Magic Token (7-day lifespan)
    const magicToken = jwt.sign(
      {
        email: normalizedEmail,
        shareToken: retro.shareToken,
        retroId: retro._id.toString(),
        role: 'developer',
        purpose: 'retro_magic_invite',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/retro/${retro.shareToken}?invite=${magicToken}`;
    const senderName = retro.createdBy?.name || 'Your Agile Facilitator';

    const htmlContent = emailService.getRetroInvitationTemplate({
      retroTitle: retro.title,
      inviteUrl,
      senderName,
      description: retro.description,
      customMessage: message,
      topics: retro.topics,
      isMagicInvite: true,
      recipientEmail: normalizedEmail,
    });

    console.log(`\n📬 [Retro Magic Invitation Email dispatched to ${normalizedEmail}] for Session "${retro.title}" (${inviteUrl})\n`);

    await emailService.sendEmail({
      to: normalizedEmail,
      subject: `Invitation: Join "${retro.title}" Retrospective (1-Click Magic Entry)`,
      htmlContent,
    });

    return {
      success: true,
      email: normalizedEmail,
      shareToken: retro.shareToken,
      magicToken,
      inviteUrl,
      message: `Invitation email sent successfully to ${normalizedEmail}`,
    };
  }

  /**
   * Verify an encrypted magic invite token and return verified developer profile with active session JWT
   */
  async verifyMagicInvite(shareToken, magicToken) {
    if (!magicToken) {
      throw ApiError.badRequest('Magic invite token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(magicToken, env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired magic invitation link. Please request a new invitation.');
    }

    if (decoded.purpose !== 'retro_magic_invite') {
      throw ApiError.unauthorized('Invalid token purpose.');
    }

    // Verify share token matches
    if (decoded.shareToken !== shareToken) {
      throw ApiError.badRequest('This invitation link is not for this retrospective session.');
    }

    // Find the retrospective
    const retro = await RetroBoard.findOne({ shareToken }).select(
      '_id title shareToken status approvedMembers createdBy projectId projectKey'
    );
    if (!retro) {
      throw ApiError.notFound('Retrospective session not found.');
    }

    const normalizedEmail = decoded.email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw ApiError.badRequest('Invalid token payload: missing email.');
    }

    // Ensure email is whitelisted in approvedMembers
    if (!retro.approvedMembers.includes(normalizedEmail)) {
      retro.approvedMembers.push(normalizedEmail);
      await retro.save();
    }

    let linkedProject = null;
    let assignedRole = 'Developer';

    if (retro.projectId || retro.projectKey) {
      const idOrKey = retro.projectId || retro.projectKey;
      const isValidObjectId = mongoose.Types.ObjectId.isValid(idOrKey);
      linkedProject = await Project.findOne(
        isValidObjectId
          ? { $or: [{ _id: idOrKey }, { key: String(idOrKey).toUpperCase() }] }
          : { key: String(idOrKey).toUpperCase() }
      );

      if (linkedProject) {
        const isLead = linkedProject.lead?.email?.toLowerCase().trim() === normalizedEmail;
        const matchedMember = linkedProject.members?.find(
          (m) => m.email?.toLowerCase().trim() === normalizedEmail
        );

        if (isLead) {
          assignedRole = 'Project Lead';
        } else if (matchedMember) {
          assignedRole = matchedMember.role || 'Developer';
        }
      }
    }

    const guestId = `guest-${crypto.randomUUID().slice(0, 8)}`;
    const guestName = normalizedEmail
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const token = generateToken(
      {
        id: guestId,
        name: guestName,
        email: normalizedEmail,
        role: assignedRole.toLowerCase(),
        isGuest: true,
      },
      '7d'
    );

    return {
      valid: true,
      token,
      email: normalizedEmail,
      name: guestName,
      shareToken: retro.shareToken,
      retroId: retro._id,
      retroTitle: retro.title,
      role: assignedRole,
      isGuest: true,
      project: linkedProject
        ? {
            id: linkedProject._id.toString(),
            key: linkedProject.key,
            name: linkedProject.name,
          }
        : null,
    };
  }

  /**
   * Solution 1: Instant No-Password Participant Identity Activation
   * Enriches guest developer with linked project role and issues genuine 7-day JWT session token
   */
  async joinParticipant(shareToken, { name, email }) {
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Display name is required to join retrospective');
    }

    const trimmedName = name.trim();
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const retro = await RetroBoard.findOne({ shareToken });
    if (!retro) {
      throw ApiError.notFound('Retrospective session not found.');
    }

    let linkedProject = null;
    let assignedRole = 'Developer';

    // If retro is project-scoped, lookup project and matching team member
    if (retro.projectId || retro.projectKey) {
      const idOrKey = retro.projectId || retro.projectKey;
      const isValidObjectId = mongoose.Types.ObjectId.isValid(idOrKey);
      linkedProject = await Project.findOne(
        isValidObjectId
          ? { $or: [{ _id: idOrKey }, { key: String(idOrKey).toUpperCase() }] }
          : { key: String(idOrKey).toUpperCase() }
      );

      if (linkedProject && normalizedEmail) {
        const isLead = linkedProject.lead?.email?.toLowerCase().trim() === normalizedEmail;
        const matchedMember = linkedProject.members?.find(
          (m) => m.email?.toLowerCase().trim() === normalizedEmail
        );

        if (isLead) {
          assignedRole = 'Project Lead';
        } else if (matchedMember) {
          assignedRole = matchedMember.role || 'Developer';
        }
      }
    }

    // Whitelist in retro if email is provided
    if (normalizedEmail && !retro.approvedMembers.includes(normalizedEmail)) {
      retro.approvedMembers.push(normalizedEmail);
      await retro.save();
    }

    const guestId = `guest-${crypto.randomUUID().slice(0, 8)}`;
    const userRole = assignedRole;

    // Issue genuine 7-day JWT session token
    const token = generateToken(
      {
        id: guestId,
        name: trimmedName,
        email: normalizedEmail,
        role: userRole.toLowerCase(),
        isGuest: true,
      },
      '7d'
    );

    const userProfile = {
      id: guestId,
      name: trimmedName,
      email: normalizedEmail,
      role: userRole,
      isGuest: true,
    };

    return {
      token,
      user: userProfile,
      project: linkedProject
        ? {
            id: linkedProject._id.toString(),
            key: linkedProject.key,
            name: linkedProject.name,
          }
        : null,
      retro: {
        id: retro._id.toString(),
        shareToken: retro.shareToken,
        title: retro.title,
        projectId: retro.projectId?.toString() || linkedProject?._id.toString() || null,
        projectKey: retro.projectKey || linkedProject?.key || null,
        sprintName: retro.sprintName || null,
      },
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
      votes: 0,
      voters: [],
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

    if (retro.shareToken) {
      projectService.syncRetroBoardToProjects(retro.shareToken).catch(() => {});
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
   * Move sticky card to another topic/question column
   */
  async moveCard(identifier, cardId, { topicId }) {
    if (!cardId || !topicId) {
      throw ApiError.badRequest('Card ID and target Topic ID are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier, 'cards.cardId': cardId }
      : { shareToken: identifier, 'cards.cardId': cardId };

    const updatedTime = new Date();

    const retro = await RetroBoard.findOneAndUpdate(
      query,
      {
        $set: {
          'cards.$.topicId': topicId,
          'cards.$.updatedAt': updatedTime,
        },
      },
      { new: true }
    );

    if (!retro) {
      throw ApiError.notFound('Card or retrospective session not found');
    }

    return { cardId, topicId, updatedAt: updatedTime };
  }

  /**
   * Reorder sticky cards within a specific topic/question
   */
  async reorderCards(identifier, topicId, cardIds) {
    if (!topicId || !Array.isArray(cardIds)) {
      throw ApiError.badRequest('Topic ID and ordered cardIds array are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { shareToken: identifier };

    const retro = await RetroBoard.findOne(query);
    if (!retro) {
      throw ApiError.notFound('Retrospective session not found');
    }

    const topicCards = (retro.cards || []).filter((c) => c.topicId === topicId);
    const cardMap = new Map();
    topicCards.forEach((c) => {
      cardMap.set(c.cardId, c);
    });

    const orderedTopicCards = [];
    cardIds.forEach((id, idx) => {
      const card = cardMap.get(id);
      if (card) {
        card.order = idx;
        orderedTopicCards.push(card);
        cardMap.delete(id);
      }
    });

    cardMap.forEach((card) => {
      card.order = orderedTopicCards.length;
      orderedTopicCards.push(card);
    });

    let topicIndex = 0;
    retro.cards = retro.cards.map((c) => {
      if (c.topicId === topicId) {
        return orderedTopicCards[topicIndex++] || c;
      }
      return c;
    });

    retro.markModified('cards');
    await retro.save();

    return { topicId, cardIds };
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

    if (retro.shareToken) {
      projectService.syncRetroBoardToProjects(retro.shareToken).catch(() => {});
    }

    return { success: true, cardId };
  }

  /**
   * Toggle Like / Unlike on a sticky card
   */
  async voteCard(identifier, cardId, voter = null) {
    if (!cardId) {
      throw ApiError.badRequest('Card ID is required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { shareToken: identifier };

    const retro = await RetroBoard.findOne(query);
    if (!retro) {
      throw ApiError.notFound('Retrospective session not found');
    }

    const card = retro.cards.find((c) => c.cardId === cardId);
    if (!card) {
      throw ApiError.notFound('Card not found');
    }

    const voterName = (voter || 'Developer').trim();

    if (!Array.isArray(card.voters)) {
      card.voters = [];
    }

    const existingIndex = card.voters.findIndex(
      (v) => v.toLowerCase() === voterName.toLowerCase()
    );

    let hasVoted = false;

    if (existingIndex !== -1) {
      // UNLIKE: Remove vote & voter
      card.voters.splice(existingIndex, 1);
      card.votes = Math.max(0, (card.votes || 1) - 1);
      hasVoted = false;
    } else {
      // LIKE: Add vote & voter
      card.voters.push(voterName);
      card.votes = (card.votes || 0) + 1;
      hasVoted = true;
    }

    await retro.save();

    return {
      cardId,
      votes: card.votes,
      voters: card.voters,
      hasVoted,
      action: hasVoted ? 'liked' : 'unliked',
    };
  }


}

export const retroService = new RetroService();
export default retroService;
