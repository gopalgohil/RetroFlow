import mongoose from 'mongoose';
import RetroBoard from '../models/RetroBoard.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import projectService from './project.service.js';
import emailService from './email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken, verifyToken } from '../utils/token.js';
import crypto from 'crypto';
import { isSuperAdmin, getSuperAdminEmail } from '../config/admin.config.js';
import jwt from 'jsonwebtoken';


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
    const userId = typeof userOrId === 'object' ? userOrId._id || userOrId.id : userOrId;
    const userRole = typeof userOrId === 'object' ? userOrId.role : null;
    const userEmail =
      typeof userOrId === 'object' && userOrId.email ? userOrId.email.toLowerCase().trim() : null;

    const conditions = [];

    if (userRole === 'admin' || isSuperAdmin(userEmail)) {
      // Admin has full workspace visibility
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

      conditions.push({
        $or: [
          { createdBy: userId },
          ...(userEmail ? [{ approvedMembers: userEmail }] : []),
          ...(memberProjectIds.length > 0 ? [{ projectId: { $in: memberProjectIds } }] : []),
        ],
      });
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push({ status: filters.status });
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: 'i' };
      conditions.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { projectKey: searchRegex },
          { sprintName: searchRegex },
          { 'topics.title': searchRegex },
        ],
      });
    }

    const finalQuery =
      conditions.length === 0
        ? {}
        : conditions.length === 1
        ? conditions[0]
        : { $and: conditions };

    // Enterprise Backend Pagination
    if (filters.page || (filters.limit && String(filters.limit).toLowerCase() !== 'all')) {
      const pageNum = Math.max(1, parseInt(filters.page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 9));
      const skip = (pageNum - 1) * limitNum;

      const [totalItems, retros] = await Promise.all([
        RetroBoard.countDocuments(finalQuery),
        RetroBoard.find(finalQuery)
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
      ]);

      const totalPages = Math.ceil(totalItems / limitNum) || 1;

      return {
        retros,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      };
    }

    const retros = await RetroBoard.find(finalQuery)
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
          voters: ['sarah.j@retroflow.io', getSuperAdminEmail(), 'priya.s@retroflow.io'],
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
          authorEmail: getSuperAdminEmail(),
          votes: 8,
          voters: [getSuperAdminEmail(), 'priya.s@retroflow.io', 'marcus.c@retroflow.io'],
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
          voters: ['marcus.c@retroflow.io', getSuperAdminEmail()],
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
          voters: ['priya.s@retroflow.io', getSuperAdminEmail()],
          createdAt: new Date(Date.now() - 2 * 86400000),
          updatedAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          cardId: crypto.randomUUID(),
          topicId: 'topic-3',
          text: 'Setup Slack webhook notification channel for unhandled refund failure webhooks.',
          author: 'Gopal',
          authorEmail: getSuperAdminEmail(),
          votes: 6,
          voters: [getSuperAdminEmail(), 'marcus.c@retroflow.io'],
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
          voters: ['david.m@retroflow.io', getSuperAdminEmail()],
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
      votingLimit: 1,
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
          const adminUser = await User.findOne({ $or: [{ role: 'admin' }, { email: getSuperAdminEmail() }] });
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
  async updateRetro(retroId, currentUser, payload) {
    let query;
    if (typeof retroId === 'string' && retroId.length === 24 && /^[0-9a-fA-F]{24}$/.test(retroId)) {
      query = { _id: retroId };
    } else {
      query = { $or: [{ _id: retroId }, { shareToken: retroId }] };
    }

    let retro = await RetroBoard.findOne(query);

    // If not found in RetroBoard, check if registered under any Project and auto-provision
    if (!retro) {
      const linkedProject = await Project.findOne({
        $or: [
          { 'retrospectives.shareToken': retroId },
          { 'retrospectives.id': retroId },
        ],
      });

      if (linkedProject) {
        const retroLink = (linkedProject.retrospectives || []).find(
          (r) => r.shareToken === retroId || r.id === retroId
        );
        let creatorId = linkedProject.createdBy || (currentUser?._id || currentUser);
        if (!creatorId) {
          const adminUser = await User.findOne({ $or: [{ role: 'admin' }, { email: getSuperAdminEmail() }] });
          creatorId = adminUser?._id || null;
        }
        const seedPayload = this.buildSeedRetroData(retroId, retroLink, linkedProject, creatorId);
        retro = await RetroBoard.create(seedPayload);
      }
    }

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found.');
    }

    // Role & permission resolution
    const userId = (currentUser?._id || currentUser || '').toString();
    const userRole = (currentUser?.role || '').toLowerCase();
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userProjectRole = currentUser?.projectRole;

    const isAdmin =
      userRole === 'admin' ||
      isSuperAdmin(userEmail);

    const isManager =
      userProjectRole === 'Manager' ||
      userProjectRole === 'Project Lead' ||
      userRole === 'manager' ||
      userRole.includes('manager');

    const isCreator =
      retro.createdBy &&
      (retro.createdBy.toString() === userId ||
       (retro.createdBy._id && retro.createdBy._id.toString() === userId));

    let hasProjectPermission = false;
    if (retro.projectId || retro.projectKey) {
      try {
        const project = await Project.findOne(
          retro.projectId ? { _id: retro.projectId } : { key: retro.projectKey }
        ).lean();

        if (project) {
          const isProjectLead = project.lead?.email?.toLowerCase().trim() === userEmail;
          const isProjectMgr = project.members?.some(
            (m) => m.email?.toLowerCase().trim() === userEmail && (m.role === 'Manager' || m.role === 'Project Lead')
          );
          const isProjectMember = project.members?.some(
            (m) => m.email?.toLowerCase().trim() === userEmail
          );
          if (isProjectLead || isProjectMgr || isProjectMember) {
            hasProjectPermission = true;
          }
        }
      } catch (err) {
        console.warn('[updateRetro] Project permission check error:', err);
      }
    }

    const isApprovedParticipant =
      retro.approvedMembers && userEmail &&
      retro.approvedMembers.map((e) => e.toLowerCase().trim()).includes(userEmail);

    if (!isAdmin && !isManager && !isCreator && !hasProjectPermission && !isApprovedParticipant) {
      throw ApiError.forbidden('Retrospective session not found or you do not have permission to edit it.');
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

      // When a topic column is deleted, clean up orphaned cards attached to that deleted topic column
      const updatedTopicIds = new Set(payload.topics.map((t) => t.topicId));
      if (Array.isArray(retro.cards)) {
        retro.cards = retro.cards.filter((card) => updatedTopicIds.has(card.topicId));
      }
    }

    Object.assign(retro, payload);
    await retro.save();

    // Sync project retrospectives array if this session is project-linked
    if (retro.projectId || retro.projectKey) {
      try {
        await Project.updateOne(
          retro.projectId
            ? { _id: retro.projectId, 'retrospectives.id': retro._id.toString() }
            : { key: retro.projectKey, 'retrospectives.id': retro._id.toString() },
          {
            $set: {
              'retrospectives.$.title': retro.title,
              'retrospectives.$.scheduledDate': retro.scheduledDate,
              'retrospectives.$.status': retro.status,
            },
          }
        );
      } catch {}
    }

    return retro;
  }

  /**
   * Delete a retrospective session (Admins, Managers, or Session Creator)
   */
  async deleteRetro(retroId, currentUser) {
    const userId = currentUser?._id || currentUser;
    const userRole = (currentUser?.role || '').toLowerCase();
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userProjectRole = currentUser?.projectRole;

    const isAdmin =
      userRole === 'admin' ||
      isSuperAdmin(userEmail);

    const isManager =
      userProjectRole === 'Manager' ||
      userRole === 'manager' ||
      userRole.includes('manager');

    let deleteQuery;
    if (typeof retroId === 'string' && retroId.length === 24 && /^[0-9a-fA-F]{24}$/.test(retroId)) {
      deleteQuery = { _id: retroId };
    } else {
      deleteQuery = { $or: [{ _id: retroId }, { shareToken: retroId }] };
    }

    let retro;
    if (isAdmin || isManager) {
      // Workspace Admins and Managers can delete any retro session
      retro = await RetroBoard.findOneAndDelete(deleteQuery);
    } else {
      // Regular facilitators can only delete sessions they created
      retro = await RetroBoard.findOneAndDelete({ ...deleteQuery, createdBy: userId });
    }

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found or you do not have permission to delete it.');
    }

    return { id: retroId, deleted: true };
  }

  /**
   * Dispatch an email invitation to a developer/teammate
   */
  async inviteTeammate(retroId, currentUser, { email, message }) {
    let query;
    if (typeof retroId === 'string' && retroId.length === 24 && /^[0-9a-fA-F]{24}$/.test(retroId)) {
      query = { _id: retroId };
    } else {
      query = { $or: [{ _id: retroId }, { shareToken: retroId }] };
    }

    const retro = await RetroBoard.findOne(query).populate('createdBy', 'name email');

    if (!retro) {
      throw ApiError.notFound('Retrospective session not found or you do not have permission to invite teammates.');
    }

    const userId = (currentUser?._id || currentUser || '').toString();
    const userRole = (currentUser?.role || '').toLowerCase();
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userProjectRole = currentUser?.projectRole;

    const isAdmin = userRole === 'admin' || isSuperAdmin(userEmail);
    const isManager =
      userProjectRole === 'Manager' ||
      userProjectRole === 'Project Lead' ||
      userRole === 'manager' ||
      userRole.includes('manager');

    const isCreator =
      retro.createdBy &&
      (retro.createdBy.toString() === userId ||
       (retro.createdBy._id && retro.createdBy._id.toString() === userId));

    let hasProjectPermission = false;
    if (retro.projectId || retro.projectKey) {
      try {
        const project = await Project.findOne(
          retro.projectId ? { _id: retro.projectId } : { key: retro.projectKey }
        ).lean();

        if (project) {
          const isProjectLead = project.lead?.email?.toLowerCase().trim() === userEmail;
          const isProjectMgr = project.members?.some(
            (m) => m.email?.toLowerCase().trim() === userEmail && (m.role === 'Manager' || m.role === 'Project Lead')
          );
          if (isProjectLead || isProjectMgr) {
            hasProjectPermission = true;
          }
        }
      } catch (err) {}
    }

    if (!isAdmin && !isManager && !isCreator && !hasProjectPermission) {
      throw ApiError.forbidden('Retrospective session not found or you do not have permission to invite teammates.');
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
    const senderName = retro.createdBy?.name || 'Your Workspace Admin';

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

    // Whitelist and record attendee in retro if email is provided
    if (normalizedEmail) {
      if (!Array.isArray(retro.attendees)) {
        retro.attendees = [];
      }
      const existingAttendee = retro.attendees.find(
        (a) => a.email?.toLowerCase().trim() === normalizedEmail
      );
      if (existingAttendee) {
        existingAttendee.lastActiveAt = new Date();
        existingAttendee.name = trimmedName || existingAttendee.name;
        existingAttendee.role = assignedRole || existingAttendee.role;
      } else {
        retro.attendees.push({
          userId: `guest-${crypto.randomUUID().slice(0, 8)}`,
          name: trimmedName,
          email: normalizedEmail,
          role: assignedRole,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        });
      }

      if (!retro.approvedMembers.includes(normalizedEmail)) {
        retro.approvedMembers.push(normalizedEmail);
      }
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
   * Update sticky card content (Author only)
   */
  async updateCard(identifier, cardId, { text }, user = null) {
    if (!cardId || !text?.trim()) {
      throw ApiError.badRequest('Card ID and text are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier, 'cards.cardId': cardId }
      : { shareToken: identifier, 'cards.cardId': cardId };

    if (user) {
      const existing = await RetroBoard.findOne(query, { 'cards.$': 1 }).lean();
      if (!existing || !existing.cards || existing.cards.length === 0) {
        throw ApiError.notFound('Card or retrospective session not found');
      }
      const targetCard = existing.cards[0];
      const targetEmail = (targetCard.authorEmail || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      const targetAuthor = (targetCard.author || '').toLowerCase().trim();
      const userName = (user.name || '').toLowerCase().trim();

      const isAuthor =
        Boolean(userEmail && targetEmail && userEmail === targetEmail) ||
        Boolean(!targetEmail && targetAuthor && userName && userName === targetAuthor);

      if (!isAuthor) {
        throw ApiError.forbidden('Permission denied: Only the original author can edit this feedback.');
      }
    }

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
   * Move sticky card to another topic/question column (Admin and Manager only)
   */
  async moveCard(identifier, cardId, { topicId }, user = null) {
    if (!cardId || !topicId) {
      throw ApiError.badRequest('Card ID and target Topic ID are required');
    }

    const boardQuery =
      identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
        ? { _id: identifier }
        : { shareToken: identifier };

    // Verify session exists and check authorization if user identity is present
    const existingBoard = await RetroBoard.findOne(boardQuery).populate('projectId').lean();
    if (!existingBoard) {
      throw ApiError.notFound('Retrospective session not found');
    }

    if (user) {
      const email = (user.email || '').toLowerCase().trim();
      const role = (user.role || '').toLowerCase().trim();
      const projectRole = (user.projectRole || '').toLowerCase().trim();

      const isWsAdmin =
        role === 'admin' ||
        isSuperAdmin(email);

      let isManagerOrAdmin =
        isWsAdmin ||
        role === 'manager' ||
        role.includes('lead') ||
        role.includes('manager') ||
        projectRole === 'manager' ||
        projectRole.includes('lead');

      if (!isManagerOrAdmin && existingBoard.createdBy) {
        const createdById =
          typeof existingBoard.createdBy === 'object'
            ? String(existingBoard.createdBy._id || existingBoard.createdBy.id || '')
            : String(existingBoard.createdBy);
        const createdByEmail =
          typeof existingBoard.createdBy === 'object'
            ? (existingBoard.createdBy.email || '').toLowerCase().trim()
            : '';
        if (
          (user._id && createdById === String(user._id)) ||
          (user.id && createdById === String(user.id)) ||
          (email && createdByEmail === email)
        ) {
          isManagerOrAdmin = true;
        }
      }

      const linkedProject = (existingBoard.projectId && typeof existingBoard.projectId === 'object')
        ? existingBoard.projectId
        : ((existingBoard.project && typeof existingBoard.project === 'object') ? existingBoard.project : null);

      if (!isManagerOrAdmin && linkedProject) {
        const leadEmail = (linkedProject.lead?.email || '').toLowerCase().trim();
        if (leadEmail && leadEmail === email) {
          isManagerOrAdmin = true;
        }
        if (Array.isArray(linkedProject.members)) {
          const member = linkedProject.members.find(
            (m) => (m.email || '').toLowerCase().trim() === email
          );
          if (member) {
            const mRole = (member.role || '').toLowerCase().trim();
            if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
              isManagerOrAdmin = true;
            }
          }
        }
      }

      if (!isManagerOrAdmin) {
        throw ApiError.forbidden(
          'Permission denied: Only Admin and Manager can move cards between questions.'
        );
      }
    }

    const query =
      identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
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
      throw ApiError.notFound('Card not found in retrospective session');
    }

    return { cardId, topicId, updatedAt: updatedTime };
  }

  /**
   * Reorder sticky cards within a specific topic/question (Admin and Manager only)
   */
  async reorderCards(identifier, topicId, cardIds, user = null) {
    if (!topicId || !Array.isArray(cardIds)) {
      throw ApiError.badRequest('Topic ID and ordered cardIds array are required');
    }

    const query = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { shareToken: identifier };

    const retro = await RetroBoard.findOne(query).populate('projectId');
    if (!retro) {
      throw ApiError.notFound('Retrospective session not found');
    }

    if (user) {
      const email = (user.email || '').toLowerCase().trim();
      const role = (user.role || '').toLowerCase().trim();
      const projectRole = (user.projectRole || '').toLowerCase().trim();

      const isWsAdmin =
        role === 'admin' ||
        isSuperAdmin(email);

      let isManagerOrAdmin =
        isWsAdmin ||
        role === 'manager' ||
        role.includes('lead') ||
        role.includes('manager') ||
        projectRole === 'manager' ||
        projectRole.includes('lead');

      if (!isManagerOrAdmin && retro.createdBy) {
        const createdById =
          typeof retro.createdBy === 'object'
            ? String(retro.createdBy._id || retro.createdBy.id || '')
            : String(retro.createdBy);
        const createdByEmail =
          typeof retro.createdBy === 'object'
            ? (retro.createdBy.email || '').toLowerCase().trim()
            : '';
        if (
          (user._id && createdById === String(user._id)) ||
          (user.id && createdById === String(user.id)) ||
          (email && createdByEmail === email)
        ) {
          isManagerOrAdmin = true;
        }
      }

      const linkedProject = (retro.projectId && typeof retro.projectId === 'object')
        ? retro.projectId
        : ((retro.project && typeof retro.project === 'object') ? retro.project : null);

      if (!isManagerOrAdmin && linkedProject) {
        const leadEmail = (linkedProject.lead?.email || '').toLowerCase().trim();
        if (leadEmail && leadEmail === email) {
          isManagerOrAdmin = true;
        }
        if (Array.isArray(linkedProject.members)) {
          const member = linkedProject.members.find(
            (m) => (m.email || '').toLowerCase().trim() === email
          );
          if (member) {
            const mRole = (member.role || '').toLowerCase().trim();
            if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
              isManagerOrAdmin = true;
            }
          }
        }
      }

      if (!isManagerOrAdmin) {
        throw ApiError.forbidden(
          'Permission denied: Only Admin and Manager can reorder cards.'
        );
      }
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
   * Delete a sticky card (Author or Manager/Admin only)
   */
  async deleteCard(identifier, cardId, user = null) {
    if (!cardId) {
      throw ApiError.badRequest('Card ID is required');
    }

    const cardQuery = identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier, 'cards.cardId': cardId }
      : { shareToken: identifier, 'cards.cardId': cardId };

    if (user) {
      const existing = await RetroBoard.findOne(cardQuery, { createdBy: 1, projectId: 1, projectKey: 1, 'cards.$': 1 })
        .populate('projectId')
        .lean();

      if (!existing || !existing.cards || existing.cards.length === 0) {
        throw ApiError.notFound('Card or retrospective session not found');
      }

      const targetCard = existing.cards[0];
      const targetEmail = (targetCard.authorEmail || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      const targetAuthor = (targetCard.author || '').toLowerCase().trim();
      const userName = (user.name || '').toLowerCase().trim();

      const isAuthor =
        Boolean(userEmail && targetEmail && userEmail === targetEmail) ||
        Boolean(!targetEmail && targetAuthor && userName && userName === targetAuthor);

      const email = userEmail;
      const role = (user.role || '').toLowerCase().trim();
      const projectRole = (user.projectRole || '').toLowerCase().trim();
      let isManagerOrAdmin =
        role === 'admin' ||
        isSuperAdmin(email) ||
        role === 'manager' ||
        role.includes('lead') ||
        role.includes('manager') ||
        projectRole === 'manager' ||
        projectRole.includes('lead');

      if (!isManagerOrAdmin && existing.createdBy) {
        const createdById = typeof existing.createdBy === 'object' ? String(existing.createdBy._id || existing.createdBy.id || '') : String(existing.createdBy);
        const createdByEmail = typeof existing.createdBy === 'object' ? (existing.createdBy.email || '').toLowerCase().trim() : '';
        if ((user._id && createdById === String(user._id)) || (user.id && createdById === String(user.id)) || (email && createdByEmail === email)) {
          isManagerOrAdmin = true;
        }
      }

      const linkedProject = (existing.projectId && typeof existing.projectId === 'object')
        ? existing.projectId
        : ((existing.project && typeof existing.project === 'object') ? existing.project : null);

      if (!isManagerOrAdmin && linkedProject) {
        const leadEmail = (linkedProject.lead?.email || '').toLowerCase().trim();
        if (leadEmail && leadEmail === email) {
          isManagerOrAdmin = true;
        }
        if (Array.isArray(linkedProject.members)) {
          const member = linkedProject.members.find(
            (m) => (m.email || '').toLowerCase().trim() === email
          );
          if (member) {
            const mRole = (member.role || '').toLowerCase().trim();
            if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
              isManagerOrAdmin = true;
            }
          }
        }
      }

      if (!isAuthor && !isManagerOrAdmin) {
        throw ApiError.forbidden('Permission denied: Only the original author or manager can delete this card.');
      }
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
  async voteCard(identifier, cardId, voter = null, voterEmail = null) {
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
    const normalizedEmail = (voterEmail || '').toLowerCase().trim();
    const normalizedName = voterName.toLowerCase().trim();

    // Safe matcher to identify this specific user's votes uniquely (Fixes Bug 6 voter conflict)
    const isThisVoter = (v) => {
      const vLower = (v || '').toLowerCase().trim();
      if (normalizedEmail && vLower === normalizedEmail) return true;
      if (normalizedEmail && vLower.includes(normalizedEmail)) return true;
      if (normalizedName && vLower === normalizedName) return true;
      return false;
    };

    if (!Array.isArray(card.voters)) {
      card.voters = [];
    }

    const existingIndex = card.voters.findIndex(isThisVoter);

    let hasVoted = false;

    if (existingIndex !== -1) {
      // UNLIKE: Remove vote & voter
      card.voters.splice(existingIndex, 1);
      card.votes = Math.max(0, (card.votes || 1) - 1);
      hasVoted = false;
    } else {
      // LIKE: Strictly 1 vote per card per participant (cannot vote multiple times on the same card, but can vote on other cards)
      const voterIdentifier = normalizedEmail || voterName;
      card.voters.push(voterIdentifier);
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

  /**
   * Dedicated Retrospective Attendance & Participation Analytics for Managers & Admins
   * Multi-Project filtering, sprint attendance trends, and member-by-member engagement metrics
   */
  async getRetroAnalytics(user, { projectId = 'all' } = {}) {
    const userEmail = (user.email || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || isSuperAdmin(userEmail);

    // 1. Fetch available projects for dropdown filter
    const allProjects = await Project.find(
      isAdmin
        ? {}
        : {
            $or: [
              { createdBy: user._id },
              { 'lead.email': userEmail },
              { members: { $elemMatch: { email: userEmail, role: { $regex: /manager|lead/i } } } },
            ],
          },
      'name key members lead retrospectives'
    ).lean();

    // If manager has no directly assigned project, allow viewing all workspace projects for high-level oversight
    const projectsList = allProjects.length > 0
      ? allProjects
      : await Project.find({}, 'name key members lead retrospectives').lean();

    // Helper to calculate deduplicated members count for a project
    const getProjectUniqueMemberCount = (p) => {
      const emailSet = new Set();
      if (Array.isArray(p.members)) {
        p.members.forEach((m) => {
          if (m.email) emailSet.add(m.email.toLowerCase().trim());
        });
      }
      if (p.lead?.email) {
        emailSet.add(p.lead.email.toLowerCase().trim());
      }
      return emailSet.size > 0 ? emailSet.size : (p.members?.length || 0);
    };

    const formattedProjects = projectsList.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      key: p.key,
      memberCount: getProjectUniqueMemberCount(p),
    }));

    // 2. Determine project scope filter
    let targetProject = null;
    if (projectId && projectId !== 'all') {
      targetProject =
        projectsList.find(
          (p) => p._id.toString() === projectId || p.key.toUpperCase() === projectId.toUpperCase()
        ) || null;
    }

    // 3. Fetch scoped retrospective sessions
    const retroQuery = {};
    if (targetProject) {
      retroQuery.$or = [
        { projectId: targetProject._id },
        { projectKey: targetProject.key },
      ];
    } else {
      // All Projects scope: fetch all project-linked retros or retros created by admin/workspace
      const projectIds = projectsList.map((p) => p._id);
      const projectKeys = projectsList.map((p) => p.key);
      retroQuery.$or = [
        { projectId: { $in: projectIds } },
        { projectKey: { $in: projectKeys } },
        { isProjectScoped: true },
        ...(isAdmin ? [{}] : [{ createdBy: user._id }]),
      ];
    }

    const retros = await RetroBoard.find(retroQuery)
      .sort({ scheduledDate: -1, createdAt: -1 })
      .lean();

    // 4. Aggregate unique team members within the selected scope
    const memberMap = new Map(); // email -> memberObject

    const registerMember = (email, name, role, avatar) => {
      if (!email) return;
      const normalized = email.toLowerCase().trim();
      if (!memberMap.has(normalized)) {
        memberMap.set(normalized, {
          email: normalized,
          name: name || normalized.split('@')[0],
          role: role || 'Developer',
          avatar: avatar || (name ? name.slice(0, 2).toUpperCase() : normalized[0].toUpperCase()),
          retrosAttended: 0,
          cardsShared: 0,
          votesCast: 0,
          actionItemsCount: 0,
          lastAttendedTitle: null,
          lastAttendedDate: null,
          attendedRetroIds: new Set(),
        });
      } else {
        const existing = memberMap.get(normalized);
        if (name && (!existing.name || existing.name === existing.email.split('@')[0])) {
          existing.name = name;
        }
        if (role && role !== 'Developer') {
          existing.role = role;
        }
      }
    };

    // Register project members based on scope
    const projectsInScope = targetProject ? [targetProject] : projectsList;
    projectsInScope.forEach((proj) => {
      if (proj.lead?.email) {
        registerMember(proj.lead.email, proj.lead.name, 'Project Lead', proj.lead.avatar);
      }
      if (Array.isArray(proj.members)) {
        proj.members.forEach((m) => {
          registerMember(m.email, m.name, m.role, m.avatar);
        });
      }
    });

    // Also register any registered users or authors from retros
    retros.forEach((r) => {
      if (Array.isArray(r.attendees)) {
        r.attendees.forEach((att) => {
          registerMember(att.email, att.name, att.role, att.avatar);
        });
      }
      if (Array.isArray(r.cards)) {
        r.cards.forEach((c) => {
          if (c.authorEmail) {
            registerMember(c.authorEmail, c.author);
          }
        });
      }
    });

    // 5. Analyze each retrospective session (Trend & Attendance computation)
    const retroTrends = retros.map((r) => {
      const attendeesSet = new Set();

      // Explicit attendees array
      if (Array.isArray(r.attendees)) {
        r.attendees.forEach((att) => {
          if (att.email) attendeesSet.add(att.email.toLowerCase().trim());
        });
      }

      // Backward compatibility: Card authors & voters count as attended
      if (Array.isArray(r.cards)) {
        r.cards.forEach((c) => {
          if (c.authorEmail) attendeesSet.add(c.authorEmail.toLowerCase().trim());
          if (Array.isArray(c.voters)) {
            c.voters.forEach((v) => {
              if (v && v.includes('@')) attendeesSet.add(v.toLowerCase().trim());
            });
          }
        });
      }

      // Approved members fallback
      if (attendeesSet.size === 0 && Array.isArray(r.approvedMembers)) {
        r.approvedMembers.forEach((em) => {
          if (em) attendeesSet.add(em.toLowerCase().trim());
        });
      }

      const attendeesCount = attendeesSet.size;

      // Expected members in linked project or total team
      let expectedCount = 0;
      if (r.projectId || r.projectKey) {
        const linkedP = projectsList.find(
          (p) =>
            (r.projectId && p._id.toString() === r.projectId.toString()) ||
            (r.projectKey && p.key.toUpperCase() === r.projectKey.toUpperCase())
        );
        if (linkedP) {
          expectedCount = getProjectUniqueMemberCount(linkedP);
        }
      }
      if (expectedCount === 0) {
        expectedCount = Math.max(attendeesCount, memberMap.size, 1);
      }

      const attendanceRate = Math.min(
        100,
        Math.round((attendeesCount / Math.max(expectedCount, 1)) * 100)
      );

      const cardsCount = r.cards?.length || 0;
      const actionItemsCount = (r.cards || []).filter((c) => {
        const topic = (r.topics || []).find((t) => t.topicId === c.topicId);
        return topic?.title?.toLowerCase().includes('action') || c.status === 'done';
      }).length;

      // Update individual member attendance records
      attendeesSet.forEach((email) => {
        if (memberMap.has(email)) {
          const m = memberMap.get(email);
          if (!m.attendedRetroIds.has(r._id.toString())) {
            m.attendedRetroIds.add(r._id.toString());
            m.retrosAttended += 1;
            if (
              !m.lastAttendedDate ||
              new Date(r.scheduledDate || r.createdAt) > new Date(m.lastAttendedDate)
            ) {
              m.lastAttendedTitle = r.title;
              m.lastAttendedDate = r.scheduledDate || r.createdAt;
            }
          }
        }
      });

      // Update card contributions & votes
      if (Array.isArray(r.cards)) {
        r.cards.forEach((c) => {
          const authorEmail = c.authorEmail?.toLowerCase()?.trim();
          const authorName = c.author?.toLowerCase()?.trim();
          if (authorEmail && memberMap.has(authorEmail)) {
            memberMap.get(authorEmail).cardsShared += 1;
          } else if (authorName) {
            for (const m of memberMap.values()) {
              if (
                m.name?.toLowerCase()?.trim() === authorName ||
                m.email?.split('@')[0]?.toLowerCase()?.trim() === authorName
              ) {
                m.cardsShared += 1;
                break;
              }
            }
          }

          if (Array.isArray(c.voters)) {
            c.voters.forEach((v) => {
              const vStr = v?.toLowerCase()?.trim();
              if (!vStr) return;
              if (memberMap.has(vStr)) {
                memberMap.get(vStr).votesCast += 1;
              } else {
                for (const m of memberMap.values()) {
                  const mName = m.name?.toLowerCase()?.trim();
                  const mEmailUser = m.email?.split('@')[0]?.toLowerCase()?.trim();
                  if (mName === vStr || mEmailUser === vStr) {
                    m.votesCast += 1;
                    break;
                  }
                }
              }
            });
          }
        });
      }

      return {
        id: r._id.toString(),
        shareToken: r.shareToken,
        title: r.title,
        sprintName: r.sprintName || 'Sprint Cycle',
        date: r.scheduledDate || r.createdAt,
        attendeesCount,
        expectedCount,
        attendanceRate,
        cardsCount,
        actionItemsCount,
      };
    });

    // 6. Member Breakdown Aggregation
    const totalRetrosCount = retros.length;
    const memberAnalytics = Array.from(memberMap.values())
      .map((m) => {
        const eligibleRetros = Math.max(totalRetrosCount, 1);
        const rate =
          totalRetrosCount > 0
            ? Math.min(100, Math.round((m.retrosAttended / eligibleRetros) * 100))
            : 0;

        let status = 'Active';
        if (rate >= 85) status = 'Consistent';
        else if (rate < 60) status = 'Low Attendance';

        return {
          email: m.email,
          name: m.name,
          avatar: m.avatar,
          role: m.role,
          retrosAttended: m.retrosAttended,
          totalEligibleRetros: totalRetrosCount,
          attendanceRate: rate,
          cardsShared: m.cardsShared,
          votesCast: m.votesCast,
          actionItemsCount: m.actionItemsCount,
          lastAttendedTitle: m.lastAttendedTitle || 'None yet',
          lastAttendedDate: m.lastAttendedDate,
          status,
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate || b.cardsShared - a.cardsShared);

    // 7. Top KPI Summary
    const averageAttendanceRate =
      retroTrends.length > 0
        ? Math.round(
            retroTrends.reduce((acc, r) => acc + r.attendanceRate, 0) / retroTrends.length
          )
        : 0;

    const lowAttendanceCount = memberAnalytics.filter((m) => m.attendanceRate < 60).length;

    const topContributor =
      memberAnalytics.length > 0
        ? memberAnalytics.reduce((prev, curr) => {
            const prevScore =
              prev.retrosAttended * 10 + prev.cardsShared * 2 + prev.votesCast;
            const currScore =
              curr.retrosAttended * 10 + curr.cardsShared * 2 + curr.votesCast;
            return currScore > prevScore ? curr : prev;
          }, memberAnalytics[0])
        : null;

    return {
      projects: formattedProjects,
      selectedProjectId: projectId,
      selectedProjectName: targetProject ? targetProject.name : 'All Projects',
      summary: {
        averageAttendanceRate,
        totalRetros: totalRetrosCount,
        totalMembers: memberAnalytics.length,
        lowAttendanceCount,
        topContributor: topContributor
          ? {
              name: topContributor.name,
              email: topContributor.email,
              avatar: topContributor.avatar,
              role: topContributor.role,
              retrosAttended: topContributor.retrosAttended,
              attendanceRate: topContributor.attendanceRate,
              cardsShared: topContributor.cardsShared,
            }
          : null,
      },
      retroTrends,
      memberAnalytics,
    };
  }
}

export const retroService = new RetroService();
export default retroService;
