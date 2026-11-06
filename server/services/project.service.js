import mongoose from 'mongoose';
import Project from '../models/Project.js';
import RetroBoard from '../models/RetroBoard.js';
import User from '../models/User.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import emailService from './email.service.js';
import { generateToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { isSuperAdmin, getSuperAdminEmail } from '../config/admin.config.js';
import { getRetroNamespace } from '../sockets/retro.socket.js';

function matchesAssignee(assigneeEmail, assigneeName, targetEmail, targetName, contextText = '') {
  const tEmail = (targetEmail || '').toLowerCase().trim();
  const tName = (targetName || '').toLowerCase().trim();
  if (!tEmail && !tName) return false;

  const aEmail = (assigneeEmail || '').toLowerCase().trim();
  const aName = (assigneeName || '').toLowerCase().trim();

  if (aEmail && tEmail && aEmail === tEmail) return true;

  const tHandle = tEmail.includes('@') ? tEmail.split('@')[0] : tEmail;
  const aHandle = aEmail.includes('@') ? aEmail.split('@')[0] : aEmail;

  if (aHandle && tHandle && aHandle === tHandle) return true;
  if (aName && tHandle && aName === tHandle) return true;
  if (tName && aHandle && tName === aHandle) return true;

  if (aName && tName && aName === tName) return true;

  const aWords = aName.split(/\s+/).filter(Boolean);
  const tWords = tName.split(/\s+/).filter(Boolean);
  if (aWords.length >= 2 && tWords.length >= 2) {
    if (aName === tName) return true;
    if (aWords[0] === tWords[0] && aWords[aWords.length - 1] === tWords[tWords.length - 1]) {
      return true;
    }
  }

  if (contextText) {
    const textLower = contextText.toLowerCase();
    if (tHandle && (textLower.includes(`@${tHandle}`) || textLower.includes(`@ ${tHandle}`))) {
      return true;
    }
    if (tName && tName.length >= 4 && (textLower.includes(`@${tName}`) || textLower.includes(`@ ${tName}`))) {
      return true;
    }
  }

  return false;
}

function getNextMonthlySprintDates(refDate = new Date()) {
  const ref = new Date(refDate);
  // Check if there are days remaining in the current month of refDate (e.g. >= 7 days for bi-weekly/2nd sprint)
  const currentMonthEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
  const nextDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1));
  const daysRemainingInMonth = Math.ceil((currentMonthEnd.getTime() - nextDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let nextStart;
  let nextEnd;

  if (daysRemainingInMonth >= 7) {
    // There are at least 7 days left in the current month, start next sprint next day through month end
    nextStart = nextDay;
    nextEnd = currentMonthEnd;
  } else {
    // Month is complete or less than a week remaining, transition cleanly into next month
    nextStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
    nextEnd = new Date(Date.UTC(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, 0));
  }

  const totalDays = Math.max(1, Math.ceil((nextEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24)));
  const now = new Date();
  const rawDiff = Math.ceil((nextEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(1, Math.min(totalDays, rawDiff));

  return {
    startDate: nextStart.toISOString().split('T')[0],
    endDate: nextEnd.toISOString().split('T')[0],
    daysLeft,
  };
}

class ProjectService {
  async getAllProjects(currentUser = null, options = {}) {

    const {
      page = 1,
      limit = 8,
      filter = 'all',
      search = '',
      all = false,
    } = options;

    const userEmail = currentUser?.email?.toLowerCase().trim();
    const userRole = (currentUser?.role || '').toLowerCase();

    const isAdmin = Boolean(
      currentUser &&
      (userRole === 'admin' || isSuperAdmin(userEmail))
    );

    let baseQuery = { isArchived: { $ne: true } };

    if (!isAdmin && userEmail) {
      baseQuery = {
        isArchived: { $ne: true },
        $or: [
          { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { 'members.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          ...(currentUser._id ? [{ createdBy: currentUser._id }] : []),
        ],
      };
    }

    let managedQuery = {
      isArchived: { $ne: true },
    };

    if (userEmail) {
      managedQuery = {
        isArchived: { $ne: true },
        $or: [
          { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          {
            members: {
              $elemMatch: {
                email: { $regex: new RegExp(`^${userEmail}$`, 'i') },
                role: 'Manager',
              },
            },
          },
        ],
      };
    }

    if (!isAdmin && userEmail) {
      managedQuery = {
        $and: [
          baseQuery,
          {
            $or: [
              { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
              {
                members: {
                  $elemMatch: {
                    email: { $regex: new RegExp(`^${userEmail}$`, 'i') },
                    role: 'Manager',
                  },
                },
              },
            ],
          },
        ],
      };
    }

    let archivedQuery = { isArchived: true };
    if (!isAdmin && userEmail) {
      archivedQuery = {
        isArchived: true,
        $or: [
          { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { 'members.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          ...(currentUser._id ? [{ createdBy: currentUser._id }] : []),
        ],
      };
    }

    let targetQuery = filter === 'archived' ? archivedQuery : filter === 'managed' ? managedQuery : baseQuery;

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { key: searchRegex },
          { description: searchRegex },
          { 'lead.name': searchRegex },
          { 'lead.email': searchRegex },
          { 'members.name': searchRegex },
          { 'members.email': searchRegex },
        ],
      };

      targetQuery = {
        $and: [targetQuery, searchFilter],
      };
    }

    const isAll = all === true || all === 'true' || String(limit).toLowerCase() === 'all' || Number(limit) === 0;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = isAll ? 1000 : Math.min(50, Math.max(1, parseInt(limit, 10) || 8));
    const skip = (pageNum - 1) * limitNum;

    const [allCount, managedCount, archivedCount, totalItems, rawProjects] = await Promise.all([
      Project.countDocuments(baseQuery),
      Project.countDocuments(managedQuery),
      Project.countDocuments(archivedQuery),
      Project.countDocuments(targetQuery),
      isAll
        ? Project.find(targetQuery).sort({ createdAt: -1 })
        : Project.find(targetQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    const syncedProjects = await Promise.all(
      rawProjects.map(async (p) => {
        await this.syncProjectRetrospectives(p);
        const id = p._id.toString();
        const activeSprint = p.sprints?.find((s) => s.status === 'active') || p.sprints?.[0] || null;
        return {
          ...(p.toObject ? p.toObject() : p),
          id,
          activeSprint,
        };
      })
    );

    const totalPages = isAll ? 1 : Math.ceil(totalItems / limitNum) || 1;

    return {
      projects: syncedProjects,
      pagination: {
        page: isAll ? 1 : pageNum,
        limit: isAll ? totalItems : limitNum,
        totalItems,
        totalPages,
        hasNextPage: isAll ? false : pageNum < totalPages,
        hasPrevPage: isAll ? false : pageNum > 1,
      },
      counts: {
        all: allCount,
        managed: managedCount,
        archived: archivedCount,
      },
    };
  }

  async syncProjectRetrospectives(project) {
    if (!project || !project.retrospectives || project.retrospectives.length === 0) {
      return project;
    }

    try {
      const shareTokens = project.retrospectives.map((r) => r.shareToken).filter(Boolean);
      const idStrings = project.retrospectives
        .map((r) => r.id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      const retroBoards = await RetroBoard.find({
        $or: [
          { shareToken: { $in: shareTokens } },
          { _id: { $in: idStrings } },
        ],
      }).lean();

      const boardMap = new Map();
      retroBoards.forEach((b) => {
        if (b.shareToken) boardMap.set(b.shareToken, b);
        if (b._id) boardMap.set(b._id.toString(), b);
      });

      let hasChanges = false;
      project.sprints = Array.isArray(project.sprints) ? project.sprints : [];

      const prevRetroCount = project.retrospectives.length;
      project.retrospectives = project.retrospectives.filter((retroItem) => {
        const liveBoard = boardMap.get(retroItem.shareToken) || boardMap.get(retroItem.id);
        return Boolean(liveBoard);
      });

      if (project.retrospectives.length !== prevRetroCount) {
        hasChanges = true;
      }

      for (const retroItem of project.retrospectives) {
        const liveBoard = boardMap.get(retroItem.shareToken) || boardMap.get(retroItem.id);
        if (liveBoard) {
          const totalCards = Array.isArray(liveBoard.cards) ? liveBoard.cards.length : 0;
          const actionTopics = (liveBoard.topics || []).filter((t) => {
            const title = (t.title || '').toLowerCase();
            return (
              title.includes('action') ||
              title.includes('deliverable') ||
              title.includes('task') ||
              t.topicId === 'topic-3'
            );
          });
          const actionTopicIds = new Set(actionTopics.map((t) => t.topicId));

          const actionCards = Array.isArray(liveBoard.cards)
            ? liveBoard.cards.filter((c) => actionTopicIds.has(c.topicId) && !c.isSprintRemoved)
            : [];
          const actionItemsCount = actionCards.length;

          const topicsCount = (liveBoard.topics || []).length;

          if (liveBoard.startDate && (!retroItem.startDate || retroItem.startDate !== new Date(liveBoard.startDate).toISOString().split('T')[0])) {
            retroItem.startDate = new Date(liveBoard.startDate).toISOString().split('T')[0];
            hasChanges = true;
          } else if (!liveBoard.startDate && retroItem.startDate) {
            liveBoard.startDate = new Date(retroItem.startDate);
            await liveBoard.save();
          }

          if (liveBoard.endDate && (!retroItem.endDate || retroItem.endDate !== new Date(liveBoard.endDate).toISOString().split('T')[0])) {
            retroItem.endDate = new Date(liveBoard.endDate).toISOString().split('T')[0];
            hasChanges = true;
          } else if (!liveBoard.endDate && retroItem.endDate) {
            liveBoard.endDate = new Date(retroItem.endDate);
            await liveBoard.save();
          } else if (!liveBoard.endDate && !retroItem.endDate && (liveBoard.startDate || retroItem.startDate)) {
            const sDate = new Date(liveBoard.startDate || retroItem.startDate);
            if (!isNaN(sDate.getTime())) {
              const endOfMonth = new Date(Date.UTC(sDate.getFullYear(), sDate.getMonth() + 1, 0)).toISOString().split('T')[0];
              retroItem.endDate = endOfMonth;
              liveBoard.endDate = new Date(endOfMonth);
              await liveBoard.save();
              hasChanges = true;
            }
          }

          if (
            retroItem.cardsCount !== totalCards ||
            retroItem.actionItemsCount !== actionItemsCount ||
            retroItem.topicsCount !== topicsCount
          ) {
            retroItem.cardsCount = totalCards;
            retroItem.actionItemsCount = actionItemsCount;
            retroItem.topicsCount = topicsCount;
            hasChanges = true;
          }

          let sprintNum = 1;
          const sMatch = (retroItem.sprintName || retroItem.title || '').match(/\d+/);
          if (sMatch) sprintNum = parseInt(sMatch[0], 10);

          let sprint = project.sprints.find(
            (s) => s.number === sprintNum || s.name.toLowerCase().startsWith(`sprint ${sprintNum}`)
          );

          if (!sprint) {
            const cadenceDays = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
            sprint = {
              id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
              name: `Sprint ${sprintNum} - Execution & Backlog`,
              number: sprintNum,
              status: project.sprints.length === 0 ? 'active' : 'upcoming',
              startDate: retroItem.startDate || (liveBoard.startDate ? new Date(liveBoard.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              endDate: retroItem.endDate || (liveBoard.endDate ? new Date(liveBoard.endDate).toISOString().split('T')[0] : new Date(Date.now() + cadenceDays * 86400000).toISOString().split('T')[0]),
              goal: `${retroItem.title || `Sprint ${sprintNum}`} deliverables and retrospective action items.`,
              daysLeft: cadenceDays,
              totalStoryPoints: 0,
              completedStoryPoints: 0,
              openBlockers: 0,
              items: [],
            };
            project.sprints.push(sprint);
            hasChanges = true;
          }

          sprint.items = sprint.items || [];
          let sprintItemsChanged = false;

          const activeCardIds = new Set(actionCards.map((c) => c.cardId));
          const activeCardTitles = new Set(
            actionCards.map((c) => (c.text || '').toLowerCase().trim()).filter(Boolean)
          );

          // Clean up cards from retro sprint if they were deleted from the retro board
          const prevCount = sprint.items.length;
          sprint.items = sprint.items.filter((it) => {
            const cleanId = (it.id || '').replace(/^act-/, '');
            const cardTitle = (it.title || '').toLowerCase().trim();

            const isFromThisRetro = Boolean(
              it.sourceRetroId &&
              (it.sourceRetroId === retroItem.id ||
                it.sourceRetroId === retroItem.shareToken ||
                (liveBoard._id && it.sourceRetroId === liveBoard._id.toString()) ||
                (liveBoard.shareToken && it.sourceRetroId === liveBoard.shareToken))
            );

            if (!isFromThisRetro) return true;

            const isStillActiveActionCard =
              activeCardIds.has(cleanId) ||
              activeCardIds.has(it.id) ||
              activeCardTitles.has(cardTitle);

            return isStillActiveActionCard;
          });

          if (sprint.items.length !== prevCount) {
            sprintItemsChanged = true;
          }

          // Process action cards from retro: route each card to its target sprint
          for (const card of actionCards) {
            const cardTitle = (card.text || '').trim();
            if (!cardTitle) continue;

            const cleanCardId = card.cardId;

            // Determine target sprint for this card
            let targetSprint = null;
            if (card.assignedSprintName) {
              targetSprint = project.sprints.find(
                (s) => s.name?.toLowerCase().trim() === card.assignedSprintName.toLowerCase().trim()
              );
            }
            if (!targetSprint && card.assignedSprintId) {
              targetSprint = project.sprints.find((s) => s.id === card.assignedSprintId);
            }

            // If target sprint is completed and item is not done, route to the current active sprint
            if (targetSprint && targetSprint.status === 'completed' && card.status !== 'done') {
              const activeOrUpcoming =
                project.sprints.find((s) => s.status === 'active' && s.id !== targetSprint.id) ||
                project.sprints.find((s) => s.status === 'upcoming');
              if (activeOrUpcoming) {
                targetSprint = activeOrUpcoming;
              }
            }

            if (!targetSprint) {
              if (sprint.status !== 'completed') {
                targetSprint = sprint;
              } else {
                targetSprint =
                  project.sprints.find((s) => s.status === 'active' && s.id !== sprint.id) ||
                  project.sprints.find((s) => s.status === 'upcoming') ||
                  project.sprints.find((s) => s.number === sprintNum + 1);
              }
            }

            if (!targetSprint) continue;
            targetSprint.items = targetSprint.items || [];

            // Prevent same card appearing in other sprints
            project.sprints.forEach((sp) => {
              if (sp.id !== targetSprint.id && Array.isArray(sp.items)) {
                const initLen = sp.items.length;
                sp.items = sp.items.filter((it) => {
                  const itCleanId = (it.id || '').replace(/^act-/, '');
                  if (cleanCardId && (itCleanId === cleanCardId || it.cardId === cleanCardId)) return false;
                  if (it.title && it.title.toLowerCase().trim() === cardTitle.toLowerCase()) return false;
                  return true;
                });
                if (sp.items.length !== initLen) {
                  sp.totalStoryPoints = sp.items.reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
                  sp.completedStoryPoints = sp.items
                    .filter((it) => it.status === 'done')
                    .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
                  hasChanges = true;
                }
              }
            });

            const existingItem = targetSprint.items.find(
              (it) =>
                it.id === cleanCardId ||
                it.id === `act-${cleanCardId}` ||
                it.cardId === cleanCardId ||
                ((it.sourceRetroId === retroItem.id ||
                  it.sourceRetroId === retroItem.shareToken ||
                  (liveBoard._id && it.sourceRetroId === liveBoard._id.toString()) ||
                  (liveBoard.shareToken && it.sourceRetroId === liveBoard.shareToken)) &&
                  it.title.toLowerCase().trim() === cardTitle.toLowerCase())
            );

            let assigneeName = card.assignedTo?.name || card.author || 'Assigned Member';
            let assigneeEmail = card.assignedTo?.email || card.authorEmail || undefined;
            const mentionMatch = cardTitle.match(/@([a-zA-Z0-9._-]+)/);
            if (mentionMatch) {
              const handle = mentionMatch[1].toLowerCase().trim();
              const member = (project.members || []).find(
                (m) =>
                  (m.email && m.email.toLowerCase().includes(handle)) ||
                  (m.name && m.name.toLowerCase().includes(handle))
              );
              if (member) {
                assigneeName = member.name;
                assigneeEmail = member.email;
              } else {
                assigneeName = mentionMatch[1].trim();
              }
            }

            const candidateMembers = [...(project.members || [])];
            if (project.lead) candidateMembers.push(project.lead);

            const matchedMember = candidateMembers.find((m) => {
              const mEmail = (m.email || '').toLowerCase().trim();
              const mName = (m.name || '').toLowerCase().trim();
              const mHandle = mEmail.split('@')[0];
              const qName = (assigneeName || '').toLowerCase().trim();
              const qEmail = (assigneeEmail || '').toLowerCase().trim();

              if (qEmail && mEmail === qEmail) return true;
              if (qName) {
                if (mName === qName) return true;
                if (mHandle === qName) return true;
                if (mEmail === qName) return true;
                const mWords = mName.split(/\s+/);
                if (mWords.some((w) => w === qName)) return true;
              }
              return false;
            });

            if (matchedMember) {
              if (matchedMember.name) assigneeName = matchedMember.name;
              if (matchedMember.email) assigneeEmail = matchedMember.email;
            }

            const projectManager =
              project.members?.find(
                (m) =>
                  (m.role || '').toLowerCase().includes('manager') ||
                  (m.role || '').toLowerCase().includes('lead')
              ) || project.lead;
            const managerName =
              (card.givenBy && card.givenBy !== 'Admin')
                ? card.givenBy
                : projectManager?.name || project.lead?.name || 'Project Manager';

            const getInitials = (str) => {
              if (!str) return 'U';
              const parts = str.trim().split(/\s+/);
              if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              return str.slice(0, 2).toUpperCase();
            };

            if (existingItem) {
              let changed = false;
              if (assigneeName && (!existingItem.assignee?.name || existingItem.assignee.name !== assigneeName || existingItem.assignee.name.includes('@') || existingItem.assignee.avatar?.length < 2)) {
                existingItem.assignee = {
                  ...(existingItem.assignee || {}),
                  name: assigneeName,
                  email: assigneeEmail || existingItem.assignee?.email,
                  avatar: getInitials(assigneeName),
                };
                changed = true;
              }
              if (!existingItem.givenBy || existingItem.givenBy === 'Admin') {
                existingItem.givenBy = managerName;
                existingItem.managerName = managerName;
                changed = true;
              }
              if (card.status && existingItem.status !== card.status) {
                existingItem.status = card.status;
                changed = true;
              }
              if (card.dueDate && existingItem.dueDate !== card.dueDate) {
                existingItem.dueDate = card.dueDate;
                changed = true;
              }
              if (card.priority && existingItem.priority !== card.priority) {
                existingItem.priority = card.priority;
                changed = true;
              }
              if (changed) {
                hasChanges = true;
              }
            } else if (card.isExportedToActionItems || card.assignedSprintName || (card.assignedTo && card.assignedTo.name)) {
              targetSprint.items.push({
                id: `act-${cleanCardId || crypto.randomUUID().slice(0, 8)}`,
                cardId: cleanCardId,
                title: cardTitle,
                description: '',
                type: 'action_item',
                priority: card.priority || 'high',
                status: card.status || 'todo',
                dueDate: card.dueDate || targetSprint.endDate || null,
                storyPoints: 3,
                assignee: {
                  name: assigneeName,
                  email: assigneeEmail,
                  avatar: getInitials(assigneeName),
                },
                givenBy: managerName,
                managerName: managerName,
                sourceRetroId: retroItem.id || retroItem.shareToken || liveBoard._id?.toString(),
                sourceRetroTitle: retroItem.title || liveBoard.title,
                createdAt: card.createdAt || new Date(),
              });
              targetSprint.totalStoryPoints = targetSprint.items.reduce(
                (acc, it) => acc + (Number(it.storyPoints) || 0),
                0
              );
              targetSprint.completedStoryPoints = targetSprint.items
                .filter((it) => it.status === 'done')
                .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
              retroItem.actionItemsExported = true;
              hasChanges = true;
            }
          }

          if (sprintItemsChanged) {
            sprint.totalStoryPoints = sprint.items.reduce(
              (acc, it) => acc + (Number(it.storyPoints) || 0),
              0
            );
            sprint.completedStoryPoints = sprint.items
              .filter((it) => it.status === 'done')
              .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
            retroItem.actionItemsExported = true;
            hasChanges = true;
          }
        }
      }

      if (hasChanges && project._id) {
        await Project.updateOne(
          { _id: project._id },
          {
            $set: {
              retrospectives: project.retrospectives,
              sprints: project.sprints,
            },
          }
        ).catch(() => { });
      }
    } catch (err) {
      console.warn('[ProjectService] Error syncing retrospectives metrics:', err.message);
    }

    return project;
  }

  async syncRetroBoardToProjects(shareTokenOrId, retroNamespace = null) {
    if (!shareTokenOrId) return null;
    try {
      const query = mongoose.Types.ObjectId.isValid(shareTokenOrId) && shareTokenOrId.length === 24
        ? { $or: [{ _id: shareTokenOrId }, { shareToken: shareTokenOrId }] }
        : { shareToken: shareTokenOrId };

      const board = await RetroBoard.findOne(query).lean();
      if (!board) return null;

      const totalCards = Array.isArray(board.cards) ? board.cards.length : 0;
      const actionTopics = (board.topics || []).filter((t) => {
        const title = (t.title || '').toLowerCase();
        return (
          title.includes('action') ||
          title.includes('deliverable') ||
          title.includes('task') ||
          t.topicId === 'topic-3'
        );
      });
      const actionTopicIds = new Set(actionTopics.map((t) => t.topicId));
      const actionItemsCount = Array.isArray(board.cards)
        ? board.cards.filter((c) => actionTopicIds.has(c.topicId)).length
        : 0;
      const topicsCount = (board.topics || []).length;

      const identifierConditions = [];
      if (board.shareToken) identifierConditions.push({ 'retrospectives.shareToken': board.shareToken });
      if (board._id) {
        identifierConditions.push({ 'retrospectives.id': board._id.toString() });
        identifierConditions.push({ 'retrospectives.id': board.id });
      }

      if (identifierConditions.length > 0) {
        await Project.updateMany(
          { $or: identifierConditions },
          {
            $set: {
              'retrospectives.$[elem].cardsCount': totalCards,
              'retrospectives.$[elem].actionItemsCount': actionItemsCount,
              'retrospectives.$[elem].topicsCount': topicsCount,
            },
          },
          {
            arrayFilters: [
              {
                $or: [
                  ...(board.shareToken ? [{ 'elem.shareToken': board.shareToken }] : []),
                  ...(board._id ? [{ 'elem.id': board._id.toString() }] : []),
                  ...(board.id ? [{ 'elem.id': board.id }] : []),
                ],
              },
            ],
          }
        ).catch(() => { });
      }

      try {
        const matchingProjects = await Project.find({
          $or: [
            ...(identifierConditions.length > 0 ? identifierConditions : []),
            ...(board.projectId ? [{ _id: board.projectId }] : []),
            ...(board.projectKey ? [{ key: board.projectKey.toUpperCase() }] : []),
          ],
        });
        for (const proj of matchingProjects) {
          await this.syncProjectRetrospectives(proj);
        }
      } catch (projSyncErr) {
        console.warn('[ProjectService] Error live-syncing project sprints from retro:', projSyncErr.message);
      }

      const payload = {
        shareToken: board.shareToken,
        cardsCount: totalCards,
        actionItemsCount,
        topicsCount,
      };

      if (retroNamespace) {
        retroNamespace.emit('retro:metrics_updated', payload);
      }

      return payload;
    } catch (err) {
      console.warn('[ProjectService] Error in syncRetroBoardToProjects:', err.message);
      return null;
    }
  }

  async syncCardAssigneeToSprint(retroIdentifier, cardId, assignedTo) {
    if (!cardId) return null;
    try {
      const retroQuery = mongoose.Types.ObjectId.isValid(retroIdentifier) && retroIdentifier.length === 24
        ? { $or: [{ _id: retroIdentifier }, { shareToken: retroIdentifier }] }
        : { shareToken: retroIdentifier };

      const retro = await RetroBoard.findOne(retroQuery).lean();
      if (!retro) return null;

      const card = retro.cards?.find(
        (c) => c.cardId === cardId || (c._id && c._id.toString() === cardId)
      );
      if (!card) return null;

      const normText = (card.text || '').toLowerCase().trim();

      const projects = await Project.find({
        $or: [
          ...(retro.projectId ? [{ _id: retro.projectId }] : []),
          { 'sprints.items.cardId': cardId },
          { 'sprints.items.title': card.text },
        ],
      });

      for (const project of projects) {
        let modified = false;
        for (const sprint of project.sprints || []) {
          for (const item of sprint.items || []) {
            if (
              item.cardId === cardId ||
              (item.title && item.title.toLowerCase().trim() === normText)
            ) {
              item.assignee = (assignedTo && assignedTo.name) ? {
                name: assignedTo.name || '',
                email: assignedTo.email || '',
                avatar: assignedTo.avatar || (assignedTo.name ? assignedTo.name.slice(0, 2).toUpperCase() : ''),
              } : undefined;
              item.updatedAt = new Date();
              modified = true;

              try {
                const retroNamespace = getRetroNamespace();
                if (retroNamespace) {
                  retroNamespace.emit('sprint:item_updated', {
                    projectId: project._id?.toString() || project.id,
                    sprintId: sprint.id,
                    item,
                  });
                }
              } catch { }
            }
          }
        }
        if (modified) {
          project.markModified('sprints');
          await project.save();
        }
      }
    } catch (err) {
      console.warn('[syncCardAssigneeToSprint] Sync warning:', err?.message || err);
    }
  }

  async getProjectByIdOrKey(idOrKey, currentUser = null) {
    if (!idOrKey) return null;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(idOrKey) && idOrKey.match(/^[0-9a-fA-F]{24}$/)) {
      project = await Project.findById(idOrKey);
    }

    if (!project) {
      project = await Project.findOne({ key: idOrKey.toUpperCase() });
    }

    if (!project) return null;

    await this.syncProjectRetrospectives(project);

    if (project.sprints && Array.isArray(project.sprints)) {
      const projectManager =
        project.members?.find(
          (m) =>
            (m.role || '').toLowerCase().includes('manager') ||
            (m.role || '').toLowerCase().includes('lead')
        ) || project.lead;
      const defaultManagerName = projectManager?.name || project.lead?.name || 'Project Manager';

      project.sprints.forEach((s) => {
        if (s.status === 'completed') {
          s.daysLeft = 0;
        } else if (s.startDate && s.endDate && s.status === 'active') {
          const sEnd = new Date(s.endDate).getTime();
          const sStart = new Date(s.startDate).getTime();
          const totalDays = Math.max(1, Math.ceil((sEnd - sStart) / (1000 * 60 * 60 * 24)));
          const rawRemaining = Math.ceil((sEnd - Date.now()) / (1000 * 60 * 60 * 24));
          s.daysLeft = Math.max(0, Math.min(totalDays, rawRemaining));
        } else if (s.startDate && s.endDate && s.status === 'upcoming') {
          const sEnd = new Date(s.endDate).getTime();
          const sStart = new Date(s.startDate).getTime();
          s.daysLeft = Math.max(1, Math.ceil((sEnd - sStart) / (1000 * 60 * 60 * 24)));
        }

        if (Array.isArray(s.items)) {
          s.items.forEach((it) => {
            if (!it.givenBy || it.givenBy === 'Admin') {
              it.givenBy = defaultManagerName;
              it.managerName = defaultManagerName;
            } else if (!it.managerName) {
              it.managerName = it.givenBy;
            }
            if (it.status === 'done') {
              if (!it.completedAt) {
                it.completedAt = it.createdAt || new Date();
              }
              if (!it.completedBy) {
                it.completedBy = it.givenBy || defaultManagerName;
              }
            }
          });
        }
      });
    }

    const isAdmin = Boolean(
      currentUser &&
      (currentUser.role?.toLowerCase() === 'admin' ||
        isSuperAdmin(currentUser.email?.toLowerCase()))
    );

    if (isAdmin) {
      return project;
    }

    if (!currentUser) {
      const error = new Error('Authentication required to access project.');
      error.statusCode = 401;
      throw error;
    }

    const email = currentUser.email?.toLowerCase().trim();
    const isLead = project.lead?.email?.toLowerCase().trim() === email;
    const isMember = project.members?.some((m) => m.email?.toLowerCase().trim() === email);
    const isCreator =
      currentUser._id && project.createdBy?.toString() === currentUser._id.toString();

    if (!isLead && !isMember && !isCreator) {
      const error = new Error('Access Denied: You are not assigned to this project workspace.');
      error.statusCode = 403;
      throw error;
    }

    return project;
  }

  assertCanManage(project, currentUser) {
    if (!currentUser) {
      const error = new Error('Access Denied: You must be logged in as a Manager, Project Lead, or Workspace Admin.');
      error.statusCode = 403;
      throw error;
    }

    const isAdmin =
      currentUser.role?.toLowerCase() === 'admin' ||
      isSuperAdmin(currentUser.email?.toLowerCase());

    if (isAdmin) return;

    const email = currentUser.email?.toLowerCase().trim();
    const isLead = project.lead?.email?.toLowerCase().trim() === email;
    const isCreator = currentUser._id && project.createdBy?.toString() === currentUser._id.toString();
    const memberRecord = project.members?.find((m) => m.email?.toLowerCase().trim() === email);

    const projectRole = (memberRecord?.role || '').toLowerCase();
    const isProjectManager = projectRole === 'manager' || projectRole.includes('manager');
    const isProjectLead = projectRole === 'project lead' || projectRole.includes('lead');

    if (!isLead && !isProjectManager && !isProjectLead && !isCreator) {
      const error = new Error('Access Denied: Only Project Lead, Managers, or Workspace Admins can perform this action in this project.');
      error.statusCode = 403;
      throw error;
    }
  }

  async createProject(payload, userId = null) {
    const key = payload.key.toUpperCase().trim();
    const existing = await Project.findOne({ key });
    if (existing) {
      throw new Error(`Project key "${key}" already exists. Please choose a distinct key.`);
    }

    let creatorUser = null;
    let validUserId = null;
    if (userId && typeof userId === 'object' && userId._id) {
      creatorUser = userId;
      validUserId = userId._id;
    } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      validUserId = userId;
      creatorUser = await User.findById(userId).lean();
    }

    const leadName = payload.lead?.name?.trim() || creatorUser?.name || 'Project Lead';
    const leadEmail = payload.lead?.email?.toLowerCase().trim() || creatorUser?.email || getSuperAdminEmail();
    const leadRole = payload.lead?.role || 'Manager';
    const leadAvatar =
      payload.lead?.avatar ||
      leadName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      'PL';
    const leadId = payload.lead?.id || `lead-${Date.now()}`;

    const otherMembers = (payload.members || []).filter(
      (m) => m.email?.toLowerCase().trim() !== leadEmail
    );

    const creatorEmail = creatorUser?.email?.toLowerCase().trim();

    const members = [
      {
        id: `m-lead-${Date.now()}`,
        name: leadName,
        email: leadEmail,
        role: leadRole,
        avatar: leadAvatar,
        joinedAt: new Date(),
      },
      ...otherMembers.map((m, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        name: m.name,
        email: m.email,
        role: m.role || 'Developer',
        avatar: m.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        joinedAt: new Date(),
      })),
    ];

    if (
      creatorEmail &&
      creatorEmail !== leadEmail &&
      !members.some((m) => m.email?.toLowerCase().trim() === creatorEmail)
    ) {
      members.push({
        id: `m-creator-${Date.now()}`,
        name: creatorUser.name || 'Project Manager',
        email: creatorEmail,
        role: creatorUser.projectRole || 'Manager',
        avatar: (creatorUser.name || 'PM').slice(0, 2).toUpperCase(),
        joinedAt: new Date(),
      });
    }

    const project = await Project.create({
      name: payload.name.trim(),
      key,
      description: payload.description?.trim() || '',
      type: payload.type || 'scrum',
      healthStatus: 'on_track',
      cadence: payload.cadence || '2_weeks',
      customCadenceDays: payload.customCadenceDays || 14,
      autoMonthlyRetro: payload.autoMonthlyRetro !== undefined ? !!payload.autoMonthlyRetro : true,
      lead: {
        id: leadId,
        name: leadName,
        email: leadEmail,
        avatar: leadAvatar,
      },
      members,
      sprints: [],
      retrospectives: [],
      velocityHistory: [],
      createdBy: validUserId || (mongoose.Types.ObjectId.isValid(userId) ? userId : null),
    });

    try {
      const managerEmails = members
        .filter((m) => {
          const r = (m.role || '').toLowerCase();
          return r === 'manager' || r.includes('lead');
        })
        .map((m) => m.email?.toLowerCase().trim())
        .filter(Boolean);

      if (managerEmails.length > 0) {
        await User.updateMany(
          { email: { $in: managerEmails }, role: { $ne: 'admin' } },
          { $set: { projectRole: 'Manager' } }
        );
      }
    } catch (err) {
      console.error('[createProject] Failed to sync manager role to User:', err);
    }

    return project;
  }

  async updateProject(idOrKey, payload, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    if (payload.name) project.name = payload.name.trim();
    if (payload.description !== undefined) project.description = payload.description.trim();
    if (payload.cadence) project.cadence = payload.cadence;
    if (payload.type) project.type = payload.type;
    if (payload.healthStatus) project.healthStatus = payload.healthStatus;
    if (payload.customCadenceDays) project.customCadenceDays = payload.customCadenceDays;
    if (payload.autoMonthlyRetro !== undefined) project.autoMonthlyRetro = !!payload.autoMonthlyRetro;

    await project.save();
    return project;
  }

  async startSprint(idOrKey, sprintId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const targetSprint = project.sprints.find((s) => s.id === sprintId);
    if (!targetSprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    const targetNum = targetSprint.number || 1;

    project.sprints.forEach((s) => {
      if (s.id === sprintId) {
        s.status = 'active';
        s.daysLeft = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
      } else if (s.status === 'active') {
        // If the other active sprint is a FUTURE sprint (e.g. Sprint 3 when reopening Sprint 2),
        // mark it 'upcoming', NOT 'completed'!
        if ((s.number || 0) > targetNum) {
          s.status = 'upcoming';
        } else {
          s.status = 'completed';
          s.daysLeft = 0;

          // Rollover incomplete items to target sprint
          const incompleteItems = (s.items || []).filter((i) => i.status !== 'done');
          const doneItems = (s.items || []).filter((i) => i.status === 'done');
          s.items = doneItems;
          s.completedStoryPoints = doneItems.reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
          s.totalStoryPoints = s.completedStoryPoints;

          if (incompleteItems.length > 0) {
            const existingIds = new Set((targetSprint.items || []).map((it) => it.id));
            const existingTitles = new Set((targetSprint.items || []).map((it) => (it.title || '').toLowerCase().trim()));
            const uniqueRollover = incompleteItems.filter(
              (it) => !existingIds.has(it.id) && !existingTitles.has((it.title || '').toLowerCase().trim())
            );
            targetSprint.items = [...(targetSprint.items || []), ...uniqueRollover];
          }
        }
      }
    });

    project.markModified('sprints');
    await project.save();
    return project;
  }

  async completeSprint(idOrKey, sprintId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    let completedSprint = null;
    project.sprints.forEach((s) => {
      if (s.id === sprintId) {
        s.status = 'completed';
        s.daysLeft = 0;
        completedSprint = s;
      }
    });

    if (!completedSprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    // Incomplete items from the completed sprint roll over to next sprint
    const incompleteItems = (completedSprint.items || []).filter((i) => i.status !== 'done');
    const doneItems = (completedSprint.items || []).filter((i) => i.status === 'done');
    completedSprint.items = doneItems;
    completedSprint.completedStoryPoints = doneItems.reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
    completedSprint.totalStoryPoints = completedSprint.completedStoryPoints;

    // Calculate Next Sprint Dates (Next Month 1st -> Next Month Last Day)
    const refDate = completedSprint.endDate ? new Date(completedSprint.endDate) : new Date();
    const nextDates = getNextMonthlySprintDates(refDate);

    const nextNum = (completedSprint.number || 0) + 1;
    // Check if next sprint already exists (either by number nextNum or status upcoming)
    let nextSprint = project.sprints.find((s) => s.number === nextNum && s.id !== completedSprint.id) ||
      project.sprints.find((s) => s.status === 'upcoming');

    if (nextSprint) {
      nextSprint.status = 'active';
      nextSprint.startDate = nextSprint.startDate || nextDates.startDate;
      nextSprint.endDate = nextSprint.endDate || nextDates.endDate;
      nextSprint.daysLeft = nextDates.daysLeft;
    } else {
      nextSprint = {
        id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
        name: `Sprint ${nextNum} - Execution & Backlog`,
        number: nextNum,
        status: 'active',
        startDate: nextDates.startDate,
        endDate: nextDates.endDate,
        goal: `Sprint ${nextNum} deliverables and retrospective action items.`,
        daysLeft: nextDates.daysLeft,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        openBlockers: 0,
        items: [],
      };
      project.sprints.push(nextSprint);
    }

    // Locate the actual subdocument in project.sprints to ensure Mongoose change tracking
    const targetSprintDoc = project.sprints.find((s) => s.id === nextSprint.id) || nextSprint;

    if (incompleteItems.length > 0) {
      const rolledOver = incompleteItems.map((item) => {
        const itemObj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        return {
          ...itemObj,
          // Preserve the original deadline so overdue items are clearly identifiable
          dueDate: itemObj.dueDate || targetSprintDoc.endDate || null,
        };
      });

      // Avoid duplicating items already present in target sprint
      const existingIds = new Set((targetSprintDoc.items || []).map((it) => it.id));
      const existingTitles = new Set((targetSprintDoc.items || []).map((it) => (it.title || '').toLowerCase().trim()));
      const uniqueRollover = rolledOver.filter(
        (it) => !existingIds.has(it.id) && !existingTitles.has((it.title || '').toLowerCase().trim())
      );

      targetSprintDoc.items = [...(targetSprintDoc.items || []), ...uniqueRollover];

      // Sync retro board cards to point to the new rolled-over sprint
      for (const item of rolledOver) {
        if (item.sourceRetroId) {
          try {
            const retroQuery = mongoose.isValidObjectId(item.sourceRetroId)
              ? { _id: item.sourceRetroId }
              : { shareToken: item.sourceRetroId };
            const retro = await RetroBoard.findOne(retroQuery);
            if (retro) {
              const normTitle = (item.title || '').toLowerCase().trim();
              const matchedCard = retro.cards.find(
                (c) => c.cardId === item.cardId || c.cardId === item.id || (c.text && c.text.toLowerCase().trim() === normTitle)
              );
              if (matchedCard) {
                matchedCard.assignedSprintName = targetSprintDoc.name;
                matchedCard.updatedAt = new Date();
                await retro.save();
              }
            }
          } catch (rErr) {
            console.warn('[completeSprint] Retro board sprint name rollover update note:', rErr?.message || rErr);
          }
        }
      }
    }

    targetSprintDoc.totalStoryPoints = (targetSprintDoc.items || []).reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
    targetSprintDoc.completedStoryPoints = (targetSprintDoc.items || []).filter((i) => i.status === 'done').reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);

    // Deduplicate any accidental duplicate sprints with identical sprint numbers
    const seenNumbers = new Set();
    project.sprints = project.sprints.filter((s) => {
      if (!s.number) return true;
      if (seenNumbers.has(s.number)) {
        const primary = project.sprints.find((p) => p.number === s.number && p.id !== s.id);
        if (primary && Array.isArray(s.items) && s.items.length > 0) {
          const primaryIds = new Set(primary.items.map((i) => i.id));
          s.items.forEach((it) => {
            if (!primaryIds.has(it.id)) primary.items.push(it);
          });
        }
        return false;
      }
      seenNumbers.add(s.number);
      return true;
    });

    project.activeSprint = targetSprintDoc;
    project.markModified('sprints');

    await project.save();
    return project;
  }

  async updateSprintItemStatus(idOrKey, sprintId, itemId, payload, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    const item = sprint.items.find(
      (i) => i.id === itemId || (i._id && i._id.toString() === itemId)
    );
    if (!item) throw new Error(`Item with ID ${itemId} not found in sprint ${sprint.name}`);

    const status = typeof payload === 'string' ? payload : payload?.status;
    const dueDate = typeof payload === 'object' ? payload?.dueDate : undefined;

    if (currentUser && status) {
      let isManager = false;
      try {
        this.assertCanManage(project, currentUser);
        isManager = true;
      } catch {
        isManager = false;
      }

      const userEmail = currentUser.email?.toLowerCase().trim();
      const userName = currentUser.name?.toLowerCase().trim();
      const assigneeEmail = item.assignee?.email?.toLowerCase().trim();
      const assigneeName = item.assignee?.name?.toLowerCase().trim();

      const isAssignee = Boolean(
        item.assignee && (
          (userEmail && assigneeEmail && userEmail === assigneeEmail) ||
          (userName && assigneeName && userName === assigneeName)
        )
      );

      if (!isManager && !isAssignee) {
        const error = new Error('Access Denied: Only the assigned developer or project manager can update this task.');
        error.statusCode = 403;
        throw error;
      }

      if (!isManager && status === 'done') {
        const error = new Error('Access Denied: Only Workspace Admins and Managers can mark tasks as Done.');
        error.statusCode = 403;
        throw error;
      }
    }

    if (status) {
      item.status = status;
      if (status === 'done') {
        if (!item.completedAt) {
          item.completedAt = new Date();
        }
        const projectManager =
          project.members?.find(
            (m) =>
              (m.role || '').toLowerCase().includes('manager') ||
              (m.role || '').toLowerCase().includes('lead')
          ) || project.lead;
        const completerName =
          (currentUser?.name && currentUser.name !== 'Admin' && currentUser.name !== 'User')
            ? currentUser.name
            : (item.givenBy || projectManager?.name || project.lead?.name || currentUser?.name || 'Manager');
        item.completedBy = completerName;
      } else {
        item.completedAt = null;
        item.completedBy = null;
      }
    }

    if (dueDate !== undefined) {
      item.dueDate = dueDate;
    }

    const assignee = typeof payload === 'object' ? payload?.assignee : undefined;
    if (assignee !== undefined) {
      if (assignee && typeof assignee === 'object') {
        let aEmail = assignee.email?.toLowerCase().trim();
        let aName = assignee.name?.trim();
        if (!aEmail && aName) {
          const m = (project.members || []).find(
            (mem) =>
              mem.name?.toLowerCase().trim() === aName.toLowerCase() ||
              mem.email?.split('@')[0]?.toLowerCase().trim() === aName.toLowerCase()
          );
          if (m?.email) aEmail = m.email.toLowerCase().trim();
        }
        item.assignee = {
          name: aName || '',
          email: aEmail,
          avatar: assignee.avatar || (aName ? aName.slice(0, 2).toUpperCase() : ''),
        };
      } else {
        item.assignee = undefined;
      }
    }

    item.updatedAt = new Date();

    if (status || dueDate !== undefined || assignee !== undefined) {
      try {
        const retroQuery = item.sourceRetroId
          ? (mongoose.isValidObjectId(item.sourceRetroId)
            ? { $or: [{ _id: item.sourceRetroId }, { shareToken: item.sourceRetroId }] }
            : { shareToken: item.sourceRetroId })
          : { projectId: project._id };

        const retros = await RetroBoard.find(retroQuery);
        for (const retro of retros) {
          const normTitle = (item.title || '').toLowerCase().trim();
          const matchedCard = retro.cards?.find(
            (c) =>
              (item.cardId && (c.cardId === item.cardId || (c._id && c._id.toString() === item.cardId))) ||
              c.cardId === itemId ||
              (c._id && c._id.toString() === itemId) ||
              (c.text && c.text.toLowerCase().trim() === normTitle)
          );
          if (matchedCard) {
            if (status) matchedCard.status = status;
            if (dueDate !== undefined) matchedCard.dueDate = dueDate;
            if (assignee !== undefined) {
              matchedCard.assignedTo = item.assignee;
            }
            matchedCard.updatedAt = new Date();
            retro.markModified('cards');
            await retro.save();

            try {
              const retroNamespace = getRetroNamespace();
              if (retroNamespace) {
                if (retro.shareToken) {
                  retroNamespace.to(`retro:${retro.shareToken}`).emit('cards:exported', {
                    cards: retro.cards,
                  });
                  retroNamespace.to(`retro:${retro.shareToken}`).emit('card:updated', {
                    cardId: matchedCard.cardId || matchedCard.id,
                    text: matchedCard.text,
                    assignedTo: matchedCard.assignedTo,
                  });
                }
                retroNamespace.emit('sprint:item_updated', {
                  projectId: project._id?.toString() || project.id,
                  sprintId,
                  item,
                });
              }
            } catch (emitErr) {
              console.warn('[updateSprintItemStatus] Socket emit warning:', emitErr?.message || emitErr);
            }
          }
        }
      } catch (syncErr) {
        console.warn('[updateSprintItemStatus] Failed to sync to RetroBoard:', syncErr?.message || syncErr);
      }
    }

    sprint.completedStoryPoints = sprint.items
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

    if (!sprint.totalStoryPoints || sprint.totalStoryPoints === 0) {
      sprint.totalStoryPoints = sprint.items.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    }

    await project.save();
    return project;
  }

  async deleteSprintItem(idOrKey, sprintId, itemId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    const itemIndex = sprint.items.findIndex(
      (i) => i.id === itemId || (i._id && i._id.toString() === itemId)
    );
    if (itemIndex === -1) throw new Error(`Item with ID ${itemId} not found in sprint ${sprint.name}`);

    const [deletedItem] = sprint.items.splice(itemIndex, 1);

    sprint.completedStoryPoints = sprint.items
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3), 0);

    sprint.totalStoryPoints = sprint.items.reduce(
      (acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3),
      0
    );

    await project.save();

    if (deletedItem.sourceRetroId || deletedItem.title) {
      try {
        const retroQuery = deletedItem.sourceRetroId
          ? {
            $or: [
              ...(deletedItem.sourceRetroId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: deletedItem.sourceRetroId }] : []),
              { shareToken: deletedItem.sourceRetroId },
            ],
          }
          : { projectId: project._id };

        await RetroBoard.updateMany(
          retroQuery,
          {
            $set: {
              'cards.$[elem].isSprintRemoved': true,
            },
          },
          {
            arrayFilters: [
              {
                $or: [
                  ...(deletedItem.id ? [{ 'elem.cardId': deletedItem.id }] : []),
                  { 'elem.text': deletedItem.title },
                ],
              },
            ],
          }
        );
      } catch (err) {
        console.warn('[deleteSprintItem] Retro card preservation update warning:', err.message);
      }
    }

    return project;
  }

  async deleteSprint(idOrKey, sprintId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    const isAdmin =
      currentUser?.role?.toLowerCase() === 'admin' ||
      isSuperAdmin(currentUser?.email?.toLowerCase());

    const email = currentUser?.email?.toLowerCase()?.trim();
    const isManager =
      isAdmin ||
      currentUser?.role?.toLowerCase() === 'manager' ||
      currentUser?.projectRole === 'Manager' ||
      (email &&
        Array.isArray(project.members) &&
        project.members.some(
          (m) =>
            m.email?.toLowerCase()?.trim() === email &&
            m.role?.toLowerCase()?.includes('manager')
        ));

    if (!isAdmin && !isManager) {
      const error = new Error('Access Denied: Only Workspace Admins and Managers can delete Sprints.');
      error.statusCode = 403;
      throw error;
    }

    const sprintIndex = project.sprints.findIndex((s) => s.id === sprintId);
    if (sprintIndex === -1) {
      throw new Error(`Sprint with ID ${sprintId} not found in this project`);
    }

    const [deletedSprint] = project.sprints.splice(sprintIndex, 1);

    if (deletedSprint.status === 'active') {
      const nextSprint = project.sprints.find((s) => s.status === 'upcoming');
      if (nextSprint) {
        nextSprint.status = 'active';
      }
    }

    await project.save();
    return project;
  }

  async getSprintItems(
    idOrKey,
    sprintId,
    { page = 1, limit = 10, status = 'all', search = '' } = {},
    currentUser = null
  ) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    const projectManager =
      project.members?.find(
        (m) =>
          (m.role || '').toLowerCase().includes('manager') ||
          (m.role || '').toLowerCase().includes('lead')
      ) || project.lead;
    const defaultManagerName = projectManager?.name || project.lead?.name || 'Project Manager';

    let items = Array.isArray(sprint.items)
      ? sprint.items.map((it) => {
        const itObj = it && typeof it.toObject === 'function' ? it.toObject() : { ...it };
        const resolvedGivenBy =
          !itObj.givenBy || itObj.givenBy === 'Admin' ? defaultManagerName : itObj.givenBy;
        const isDone = itObj.status === 'done';
        return {
          ...itObj,
          givenBy: resolvedGivenBy,
          managerName:
            !itObj.managerName || itObj.managerName === 'Admin'
              ? resolvedGivenBy
              : itObj.managerName,
          completedAt: isDone ? (itObj.completedAt || itObj.createdAt || new Date().toISOString()) : itObj.completedAt,
          completedBy: isDone ? (itObj.completedBy || resolvedGivenBy) : itObj.completedBy,
        };
      })
      : [];

    if (status && status !== 'all') {
      items = items.filter((it) => it.status === status);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q) ||
          it.assignee?.name?.toLowerCase().includes(q)
      );
    }

    const totalItems = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    return {
      items: paginatedItems,
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

  async getProjectSprints(
    idOrKey,
    { page = 1, limit = 10, status = 'all', search = '' } = {},
    currentUser = null
  ) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    const allSprints = Array.isArray(project.sprints) ? [...project.sprints] : [];

    const statusCounts = {
      all: allSprints.length,
      active: allSprints.filter((s) => s.status === 'active').length,
      upcoming: allSprints.filter((s) => s.status === 'upcoming').length,
      completed: allSprints.filter((s) => s.status === 'completed').length,
    };

    let filtered = allSprints;

    if (status && status !== 'all') {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.goal?.toLowerCase().includes(q)
      );
    }

    const totalItems = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedSprints = filtered.slice(startIndex, startIndex + limitNum);

    return {
      sprints: paginatedSprints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      statusCounts,
    };
  }

  async getProjectRetros(
    idOrKey,
    { page = 1, limit = 9, search = '' } = {},
    currentUser = null
  ) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    await this.syncProjectRetrospectives(project);

    const allRetros = Array.isArray(project.retrospectives) ? [...project.retrospectives] : [];

    let filtered = allRetros;

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.sprintName?.toLowerCase().includes(q)
      );
    }

    const totalItems = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 9);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedRetros = filtered.slice(startIndex, startIndex + limitNum);

    return {
      retrospectives: paginatedRetros,
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

  async updateSprintDates(idOrKey, sprintId, { startDate, endDate, goal, name }, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      const err = new Error('Invalid date format provided');
      err.statusCode = 400;
      throw err;
    }
    if (endMs < startMs) {
      const err = new Error('Ending date cannot be earlier than starting date');
      err.statusCode = 400;
      throw err;
    }
    const durationDays = Math.round((endMs - startMs) / 86400000);
    if (durationDays > 90) {
      const err = new Error('Sprint duration cannot exceed 90 days');
      err.statusCode = 400;
      throw err;
    }

    sprint.startDate = startDate;
    sprint.endDate = endDate;
    if (goal !== undefined) sprint.goal = goal;
    if (name !== undefined) sprint.name = name;

    const totalDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
    const rawRemaining = Math.ceil((endMs - Date.now()) / 86400000);
    sprint.daysLeft = sprint.status === 'completed' ? 0 : Math.max(0, Math.min(totalDays, rawRemaining));

    // Auto-cap: If any task dueDate exceeds the updated sprint endDate, cap it to sprint.endDate
    if (Array.isArray(sprint.items)) {
      sprint.items.forEach((item) => {
        if (item.dueDate) {
          const itemDueMs = new Date(item.dueDate).getTime();
          if (!isNaN(itemDueMs) && itemDueMs > endMs) {
            item.dueDate = endDate;
          }
        }
      });
    }

    project.markModified('sprints');
    await project.save();
    return project;
  }

  async createSprint(idOrKey, payload, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const { startDate, endDate, name, goal } = payload;
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) {
      throw new Error('End date must be on or after start date');
    }

    project.sprints = Array.isArray(project.sprints) ? project.sprints : [];

    const maxNum = project.sprints.reduce((max, s) => Math.max(max, s.number || 0), 0);
    const nextNum = maxNum + 1;
    const sprintName = name?.trim() || `Sprint ${nextNum} - Execution & Backlog`;

    // 1. Status Default: Manually created sprints always default to 'upcoming' (never auto-activated)
    const status = 'upcoming';

    const totalDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
    const daysLeft = totalDays;

    const newSprint = {
      id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
      name: sprintName,
      number: nextNum,
      status,
      startDate,
      endDate,
      goal: goal?.trim() || `Sprint ${nextNum} deliverables and retrospective action items.`,
      daysLeft,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      openBlockers: 0,
      items: [],
    };

    project.sprints.push(newSprint);
    project.markModified('sprints');
    await project.save();

    return {
      project,
      sprint: newSprint,
    };
  }

  async addMember(idOrKey, memberData, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const email = memberData.email.toLowerCase().trim();
    const existing = project.members.find((m) => m.email.toLowerCase() === email);
    if (existing) {
      throw new Error(`Member with email ${email} is already assigned to this project`);
    }

    const avatar = memberData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    project.members.push({
      id: `m-${crypto.randomUUID().slice(0, 8)}`,
      name: memberData.name.trim(),
      email,
      role: memberData.role || 'Developer',
      avatar,
      joinedAt: new Date(),
    });

    await project.save();

    try {
      await RetroBoard.updateMany(
        { projectId: project._id },
        { $addToSet: { approvedMembers: email } }
      );
    } catch (err) {
      console.error('[addMember] Failed to sync approvedMembers in RetroBoard:', err);
    }

    try {
      await User.updateOne(
        { email, role: { $ne: 'admin' } },
        { $set: { projectRole: memberData.role || 'Developer' } }
      );
    } catch (err) {
      console.error('[addMember] Failed to sync role to User:', err);
    }

    return project;
  }

  async removeMember(idOrKey, memberIdOrEmail, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const identifier = memberIdOrEmail.toLowerCase().trim();
    const memberIndex = project.members.findIndex(
      (m) => m.id === identifier || m.email.toLowerCase() === identifier
    );

    if (memberIndex === -1) {
      throw new Error('Member not found in this project');
    }

    const memberToRemove = project.members[memberIndex];

    if (project.lead?.email?.toLowerCase() === memberToRemove.email.toLowerCase()) {
      throw new Error('Cannot remove the designated Project Lead from the project.');
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    try {
      await RetroBoard.updateMany(
        { projectId: project._id },
        { $pull: { approvedMembers: memberToRemove.email.toLowerCase() } }
      );
    } catch (err) {
      console.error('[removeMember] Failed to remove member from RetroBoard approvedMembers:', err);
    }

    return project;
  }

  async updateMemberRole(idOrKey, memberIdOrEmail, newRole, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const member = project.members.find(
      (m) => m.id === memberIdOrEmail || m.email.toLowerCase() === memberIdOrEmail.toLowerCase()
    );
    if (!member) throw new Error('Member not found in this project');

    if (
      project.lead?.email?.toLowerCase() === member.email.toLowerCase() &&
      newRole !== 'Manager' &&
      newRole !== 'Project Lead'
    ) {
      throw new Error('Designated project lead must remain a Manager or Project Lead');
    }

    member.role = newRole;
    await project.save();

    try {
      await User.updateOne(
        { email: member.email.toLowerCase(), role: { $ne: 'admin' } },
        { $set: { projectRole: newRole } }
      );
    } catch (err) {
      console.warn('[updateMemberRole] User projectRole sync error:', err);
    }

    return project;
  }

  async exportActionItems(idOrKey, sprintId, items, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    let requestedSprintNum = null;
    if (sprintId && sprintId.startsWith('sprint-auto-')) {
      const parsed = parseInt(sprintId.replace('sprint-auto-', ''), 10);
      if (!isNaN(parsed)) requestedSprintNum = parsed;
    }

    let sprint = project.sprints.find((s) => s.id === sprintId);

    if (!sprint && requestedSprintNum) {
      sprint = project.sprints.find(
        (s) => s.number === requestedSprintNum || s.name.toLowerCase().startsWith(`sprint ${requestedSprintNum}`)
      );
    }

    if (!sprint) {
      let sprintNum = requestedSprintNum;
      if (!sprintNum) {
        const sourceTitle = items[0]?.sourceRetroTitle || '';
        const match = sourceTitle.match(/sprint\s*(\d+)/i);
        if (match) {
          sprintNum = parseInt(match[1], 10) + 1;
        } else if (items[0]?.sourceRetroId) {
          const retroEntry = project.retrospectives?.find(
            (r) => r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
          );
          if (retroEntry?.sprintName) {
            const sMatch = retroEntry.sprintName.match(/sprint\s*(\d+)/i) || retroEntry.sprintName.match(/\d+/);
            if (sMatch) sprintNum = parseInt(sMatch[1] || sMatch[0], 10) + 1;
          }
        }
      }

      if (sprintNum) {
        // Retro action items target Sprint N+1 (Next Sprint)
        sprint = project.sprints.find(
          (s) => s.number === sprintNum || s.name.toLowerCase().startsWith(`sprint ${sprintNum}`)
        );
      }

      if (!sprint) {
        sprint = project.sprints.find((s) => s.status === 'upcoming');
      }

      if (!sprint) {
        const finalSprintNum = sprintNum || (project.sprints?.length || 0) + 1;
        let refDate = new Date();
        if (items[0]?.sourceRetroId) {
          const retroEntry = project.retrospectives?.find(
            (r) => r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
          );
          if (retroEntry?.endDate) {
            refDate = new Date(retroEntry.endDate);
          } else if (retroEntry?.scheduledDate) {
            refDate = new Date(retroEntry.scheduledDate);
          }
        }

        const nextDates = getNextMonthlySprintDates(refDate);
        sprint = {
          id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
          name: `Sprint ${finalSprintNum} - Execution & Backlog`,
          number: finalSprintNum,
          status: 'active',
          startDate: nextDates.startDate,
          endDate: nextDates.endDate,
          goal: `Sprint ${finalSprintNum} deliverables and retrospective action items.`,
          daysLeft: nextDates.daysLeft,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          openBlockers: 0,
          items: [],
        };
        project.sprints.push(sprint);

        project.sprints.forEach((sp) => {
          if (sp.id !== sprint.id && sp.number < sprint.number && sp.status === 'active') {
            sp.status = 'completed';
          }
        });
      }
    }

    if (sprint && sprint.status === 'upcoming') {
      sprint.status = 'active';
      let refDate = new Date();
      if (items[0]?.sourceRetroId) {
        const retroEntry = project.retrospectives?.find(
          (r) => r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
        );
        if (retroEntry?.endDate) {
          refDate = new Date(retroEntry.endDate);
        } else if (retroEntry?.scheduledDate) {
          refDate = new Date(retroEntry.scheduledDate);
        }
      }
      const nextDates = getNextMonthlySprintDates(refDate);
      sprint.startDate = sprint.startDate || nextDates.startDate;
      sprint.endDate = sprint.endDate || nextDates.endDate;
      sprint.daysLeft = nextDates.daysLeft;

      project.sprints.forEach((sp) => {
        if (sp.id !== sprint.id && sp.number < sprint.number && sp.status === 'active') {
          sp.status = 'completed';
        }
      });
    }

    const newItems = items.map((item) => {
      const itemStatus = ['todo', 'in_progress', 'done'].includes(item.status) ? item.status : 'todo';
      const storyPointsNum = typeof item.storyPoints === 'number'
        ? item.storyPoints
        : (Number(item.storyPoints) || 3);

      let resolvedName = item.assignee?.name ? item.assignee.name.trim() : undefined;
      let resolvedEmail = item.assignee?.email ? item.assignee.email.toLowerCase().trim() : undefined;
      let resolvedAvatar = item.assignee?.avatar;

      if (resolvedName || resolvedEmail) {
        const candidateMembers = [...(project.members || [])];
        if (project.lead) candidateMembers.push(project.lead);

        const matchedMember = candidateMembers.find((m) => {
          const mEmail = (m.email || '').toLowerCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          const mHandle = mEmail.split('@')[0];
          const qName = (resolvedName || '').toLowerCase().trim();
          const qEmail = (resolvedEmail || '').toLowerCase().trim();

          if (qEmail && mEmail === qEmail) return true;
          if (qName) {
            if (mName === qName) return true;
            if (mHandle === qName) return true;
            if (mEmail === qName) return true;
            const mWords = mName.split(/\s+/);
            if (mWords.some((w) => w === qName)) return true;
          }
          return false;
        });

        if (matchedMember) {
          if (!resolvedEmail && matchedMember.email) {
            resolvedEmail = matchedMember.email.toLowerCase().trim();
          }
          if (matchedMember.name) {
            resolvedName = matchedMember.name;
          }
          if (!resolvedAvatar && matchedMember.avatar) {
            resolvedAvatar = matchedMember.avatar;
          }
        }
      }

      const projectManager =
        project.members?.find(
          (m) =>
            (m.role || '').toLowerCase().includes('manager') ||
            (m.role || '').toLowerCase().includes('lead')
        ) || project.lead;
      const resolvedGivenBy =
        (item.givenBy && item.givenBy !== 'Admin')
          ? item.givenBy
          : (item.managerName && item.managerName !== 'Admin')
            ? item.managerName
            : projectManager?.name ||
            project.lead?.name ||
            currentUser?.name ||
            'Project Manager';

      const rawCardId = item.cardId || item.id || null;
      return {
        id: `act-${crypto.randomUUID().slice(0, 8)}`,
        cardId: rawCardId,
        title: item.title.trim(),
        description: item.description?.trim() || '',
        type: 'action_item',
        priority: item.priority || 'high',
        status: itemStatus,
        completedAt: itemStatus === 'done' ? new Date() : null,
        dueDate: item.dueDate || sprint.endDate || null,
        storyPoints: storyPointsNum,
        assignee: resolvedName
          ? {
            name: resolvedName,
            email: resolvedEmail,
            avatar:
              resolvedAvatar ||
              resolvedName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
          }
          : undefined,
        givenBy: resolvedGivenBy,
        managerName: resolvedGivenBy,
        sourceRetroId: item.sourceRetroId,
        sourceRetroTitle: item.sourceRetroTitle,
        createdAt: new Date(),
      };
    });

    sprint.items = sprint.items || [];
    for (const newItem of newItems) {
      const existingIdx = sprint.items.findIndex(
        (it) =>
          it.id === newItem.id ||
          (newItem.cardId && it.cardId === newItem.cardId) ||
          (newItem.sourceRetroId &&
            it.sourceRetroId === newItem.sourceRetroId &&
            it.title.toLowerCase().trim() === newItem.title.toLowerCase().trim())
      );
      if (existingIdx !== -1) {
        sprint.items[existingIdx] = {
          ...sprint.items[existingIdx],
          ...newItem,
          id: sprint.items[existingIdx].id,
        };
      } else {
        sprint.items.push(newItem);
      }
    }

    const targetItemCardIds = new Set(newItems.map((n) => n.cardId).filter(Boolean));
    const targetItemTitles = new Set(newItems.map((n) => n.title.toLowerCase().trim()).filter(Boolean));

    project.sprints.forEach((sp) => {
      if (sp.id !== sprint.id && Array.isArray(sp.items)) {
        const initialLen = sp.items.length;
        sp.items = sp.items.filter((it) => {
          if (it.cardId && targetItemCardIds.has(it.cardId)) return false;
          if (it.title && targetItemTitles.has(it.title.toLowerCase().trim())) return false;
          return true;
        });
        if (sp.items.length !== initialLen) {
          sp.totalStoryPoints = sp.items.reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
          sp.completedStoryPoints = sp.items
            .filter((it) => it.status === 'done')
            .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
        }
      }
    });

    sprint.totalStoryPoints = sprint.items.reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
    sprint.completedStoryPoints = sprint.items
      .filter((it) => it.status === 'done')
      .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);

    if (items[0]?.sourceRetroId) {
      project.retrospectives = project.retrospectives.map((r) => {
        if (r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId) {
          r.actionItemsExported = true;
          r.status = 'completed';
        }
        return r;
      });

      try {
        const retroIdentifier = items[0].sourceRetroId;
        const retroQuery = mongoose.Types.ObjectId.isValid(retroIdentifier)
          ? { $or: [{ _id: retroIdentifier }, { shareToken: retroIdentifier }] }
          : { shareToken: retroIdentifier };

        const retroBoardDoc = await RetroBoard.findOne(retroQuery);
        if (retroBoardDoc) {
          retroBoardDoc.cards = retroBoardDoc.cards || [];
          for (const it of newItems) {
            const card = retroBoardDoc.cards.find(
              (c) =>
                (it.cardId && (c.cardId === it.cardId || (c._id && c._id.toString() === it.cardId))) ||
                (it.id && (c.cardId === it.id || (c._id && c._id.toString() === it.id))) ||
                (c.text && it.title && c.text.trim().toLowerCase() === it.title.trim().toLowerCase())
            );
            if (card) {
              card.assignedTo = it.assignee;
              card.assignedSprintName = sprint.name;
              card.isExportedToActionItems = true;
            }
          }
          retroBoardDoc.markModified('cards');
          await retroBoardDoc.save();

          try {
            const retroNamespace = getRetroNamespace();
            if (retroNamespace && retroBoardDoc.shareToken) {
              retroNamespace.to(`retro:${retroBoardDoc.shareToken}`).emit('cards:exported', {
                cards: retroBoardDoc.cards,
              });
            }
          } catch (emitErr) {
            console.warn('[exportActionItems] Failed to emit cards:exported:', emitErr);
          }
        }
      } catch (err) {
        console.warn('[exportActionItems] Failed to update RetroBoard status and cards:', err);
      }
    }

    await project.save();

    return {
      project,
      exportedCount: newItems.length,
      targetSprint: sprint,
    };
  }

  async getMyActionItems(currentUser = null, options = {}) {
    const userEmail = currentUser?.email?.toLowerCase().trim();
    const userName = currentUser?.name?.toLowerCase().trim();
    const userRole = currentUser?.role?.toLowerCase().trim();
    const userProjectRole = currentUser?.projectRole?.toLowerCase().trim();

    if (!currentUser) {
      const error = new Error('Authentication required to access action items.');
      error.statusCode = 401;
      throw error;
    }

    const isAdmin =
      userRole === 'admin' ||
      isSuperAdmin(userEmail);

    const isManager =
      isAdmin ||
      userRole === 'manager' ||
      userRole?.includes('manager') ||
      userProjectRole === 'manager' ||
      userRole?.includes('lead') ||
      userProjectRole?.toLowerCase().includes('lead');

    const fetchAll = (options.all === true || options.all === 'true') && isManager;

    let projectQuery = {};
    if (!isAdmin && userEmail) {
      projectQuery = {
        $or: [
          { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { 'members.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          ...(currentUser?._id ? [{ createdBy: currentUser._id }] : []),
        ],
      };
    }

    const projects = await Project.find(projectQuery).lean();
    const actionItems = [];
    const seenCardIds = new Set();
    const normalizeKey = (str) => (str ? str.toString().toLowerCase().trim() : '');

    for (const proj of projects) {
      const sprints = proj.sprints || [];
      for (const sprint of sprints) {
        const items = sprint.items || [];
        for (const item of items) {
          if (!fetchAll) {
            if (!userEmail && !userName) continue;

            const isAssigned = matchesAssignee(
              item.assignee?.email,
              item.assignee?.name,
              userEmail,
              userName,
              item.title
            );

            if (!isAssigned) continue;
          }

          if (item.sourceRetroId) {
            seenCardIds.add(normalizeKey(item.id));
            seenCardIds.add(`${normalizeKey(item.sourceRetroId)}-${normalizeKey(item.title)}`);
          }

          const candidateMembers = [...(proj.members || [])];
          if (proj.lead) candidateMembers.push(proj.lead);

          let resolvedAssignee = item.assignee;
          if (item.assignee) {
            const aEmail = (item.assignee.email || '').toLowerCase().trim();
            const aName = (item.assignee.name || '').toLowerCase().trim();
            const matchedMember = candidateMembers.find((m) => {
              const mEmail = (m.email || '').toLowerCase().trim();
              const mName = (m.name || '').toLowerCase().trim();
              const mHandle = mEmail.split('@')[0];
              if (aEmail && mEmail === aEmail) return true;
              if (aName && (mName === aName || mHandle === aName || mEmail === aName)) return true;
              return false;
            });

            if (matchedMember) {
              const parts = (matchedMember.name || '').trim().split(/\s+/);
              const initials = parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : matchedMember.name.slice(0, 2).toUpperCase();
              resolvedAssignee = {
                ...item.assignee,
                name: matchedMember.name,
                email: matchedMember.email || item.assignee.email,
                avatar: initials,
              };
            }
          }

          const projectManager =
            proj.members?.find(
              (m) =>
                (m.role || '').toLowerCase().includes('manager') ||
                (m.role || '').toLowerCase().includes('lead')
            ) || proj.lead;
          const managerName =
            (item.givenBy && item.givenBy !== 'Admin')
              ? item.givenBy
              : (item.managerName && item.managerName !== 'Admin')
                ? item.managerName
                : projectManager?.name || proj.lead?.name || 'Project Manager';
          const managerEmail = projectManager?.email || proj.lead?.email;

          actionItems.push({
            ...item,
            id: item.id || `item-${Date.now()}`,
            dueDate: item.dueDate || sprint.endDate || null,
            priority: item.priority || 'medium',
            status: item.status || 'todo',
            projectId: proj._id ? proj._id.toString() : proj.id,
            projectKey: proj.key,
            projectName: proj.name,
            sprintId: sprint.id,
            sprintName: sprint.name,
            sprintStatus: sprint.status,
            isDirectRetroCard: false,
            assignee: resolvedAssignee,
            givenBy: managerName,
            managerName: managerName,
            managerEmail,
            createdAt: item.createdAt || proj.createdAt || new Date().toISOString(),
          });
        }
      }
    }

    let retroQuery = {};
    if (!isAdmin && userEmail) {
      const projectIds = projects.map((p) => p._id);
      const projectKeys = projects.map((p) => p.key).filter(Boolean);

      if (fetchAll) {
        retroQuery = {
          $or: [
            { projectId: { $in: projectIds } },
            { projectKey: { $in: projectKeys } },
            ...(currentUser?._id ? [{ createdBy: currentUser._id }] : []),
          ],
        };
      } else {
        retroQuery = {
          $or: [
            { approvedMembers: { $in: [userEmail, new RegExp(`^${userEmail}$`, 'i')] } },
            { 'attendees.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
            { 'cards.authorEmail': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
            ...(projectIds.length > 0 ? [{ projectId: { $in: projectIds } }] : []),
            ...(projectKeys.length > 0 ? [{ projectKey: { $in: projectKeys } }] : []),
            ...(currentUser?._id ? [{ createdBy: currentUser._id }] : []),
          ],
        };
      }
    }

    const retros = await RetroBoard.find(retroQuery).lean();
    for (const retro of retros) {
      const actionTopic = (retro.topics || []).find((t) => {
        const tLower = (t.title || '').toLowerCase();
        return tLower.includes('action') || t.icon === 'target';
      });

      if (!actionTopic) continue;

      const matchingCards = (retro.cards || []).filter(
        (c) => c.topicId === actionTopic.topicId
      );

      for (const card of matchingCards) {
        if (card.isSprintRemoved) {
          continue;
        }

        const cardIdNorm = normalizeKey(card.cardId);
        const cardTextNorm = normalizeKey(card.text);
        const retroIdNorm = normalizeKey(retro._id.toString());
        const retroShareNorm = normalizeKey(retro.shareToken);

        if (
          seenCardIds.has(cardIdNorm) ||
          seenCardIds.has(`${retroIdNorm}-${cardTextNorm}`) ||
          (retroShareNorm && seenCardIds.has(`${retroShareNorm}-${cardTextNorm}`))
        ) {
          continue;
        }

        const matchingProject = projects.find(
          (p) =>
            (retro.projectId && (p._id.toString() === retro.projectId.toString() || p.id === retro.projectId.toString())) ||
            (retro.projectKey && p.key?.toUpperCase() === retro.projectKey.toUpperCase())
        );

        if (!isAdmin && (retro.projectId || retro.projectKey) && !matchingProject && (!currentUser?._id || retro.createdBy?.toString() !== currentUser._id.toString())) {
          continue;
        }

        let directAssigneeName = card.assignedTo?.name || card.author || 'Assigned Member';
        let directAssigneeEmail = card.assignedTo?.email || card.authorEmail || undefined;

        const mentionMatch = (card.text || '').match(/@([a-zA-Z0-9._-]+)/);
        if (mentionMatch) {
          const mentionedHandle = mentionMatch[1].toLowerCase().trim();
          const candidateMembers = [...(matchingProject?.members || [])];
          if (matchingProject?.lead) candidateMembers.push(matchingProject.lead);

          const matchedMember = candidateMembers.find(
            (m) =>
              (m.email && m.email.toLowerCase().includes(mentionedHandle)) ||
              (m.name && m.name.toLowerCase().includes(mentionedHandle))
          );
          if (matchedMember) {
            directAssigneeName = matchedMember.name;
            directAssigneeEmail = matchedMember.email;
          } else {
            directAssigneeName = mentionMatch[1].trim();
          }
        }

        const candidateMembers = [...(matchingProject?.members || [])];
        if (matchingProject?.lead) candidateMembers.push(matchingProject.lead);

        const matchedDirect = candidateMembers.find((m) => {
          const mEmail = (m.email || '').toLowerCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          const mHandle = mEmail.split('@')[0];
          const qName = (directAssigneeName || '').toLowerCase().trim();
          const qEmail = (directAssigneeEmail || '').toLowerCase().trim();
          if (qEmail && mEmail === qEmail) return true;
          if (qName && (mName === qName || mHandle === qName || mEmail === qName)) return true;
          return false;
        });

        if (matchedDirect) {
          if (matchedDirect.name) directAssigneeName = matchedDirect.name;
          if (matchedDirect.email) directAssigneeEmail = matchedDirect.email;
        }

        if (!fetchAll) {
          if (!userEmail && !userName) continue;

          const isAssigned = matchesAssignee(
            directAssigneeEmail,
            directAssigneeName,
            userEmail,
            userName,
            card.text
          );

          if (!isAssigned) continue;
        }

        const projectManager =
          matchingProject?.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
          matchingProject?.lead;
        const managerName = card.givenBy || projectManager?.name || matchingProject?.lead?.name || retro.ownerName || 'Project Manager';
        const managerEmail = projectManager?.email || matchingProject?.lead?.email;

        const getInitials = (str) => {
          if (!str) return 'U';
          const parts = str.trim().split(/\s+/);
          if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          return str.slice(0, 2).toUpperCase();
        };

        actionItems.push({
          id: card.cardId,
          title: card.text,
          description: card.description?.trim() || '',
          type: 'action_item',
          status: card.status || 'todo',
          priority: card.priority || 'medium',
          dueDate: card.dueDate || (retro.scheduledDate ? new Date(new Date(retro.scheduledDate).getTime() + 7 * 86400000).toISOString().split('T')[0] : null),
          storyPoints: 3,
          assignee: {
            name: directAssigneeName,
            email: directAssigneeEmail,
            avatar: getInitials(directAssigneeName),
          },
          givenBy: managerName,
          managerName: managerName,
          managerEmail,
          sourceRetroId: retro._id.toString(),
          sourceRetroTitle: retro.title,
          sourceRetroShareToken: retro.shareToken,
          projectId: matchingProject ? (matchingProject._id ? matchingProject._id.toString() : matchingProject.id) : retro.projectId ? retro.projectId.toString() : null,
          projectKey: matchingProject?.key || retro.projectKey || 'RETRO',
          projectName: matchingProject?.name || retro.title,
          sprintId: retro.sprintId || null,
          sprintName: retro.sprintName || 'Retro Action Items',
          isDirectRetroCard: true,
          createdAt: card.createdAt || retro.createdAt,
        });
      }
    }

    let filtered = actionItems;
    if (options.projectId && options.projectId !== 'all') {
      const pid = options.projectId.toString().toLowerCase();
      filtered = filtered.filter(
        (it) =>
          it.projectId?.toLowerCase() === pid ||
          it.projectKey?.toLowerCase() === pid
      );
    }

    if (options.status && options.status !== 'all') {
      const statusLower = options.status.toLowerCase();
      filtered = filtered.filter((it) => it.status === statusLower);
    }

    if (options.priority && options.priority !== 'all') {
      const prioLower = options.priority.toLowerCase();
      filtered = filtered.filter((it) => it.priority === prioLower);
    }

    if (options.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q) ||
          it.sourceRetroTitle?.toLowerCase().includes(q) ||
          it.projectName?.toLowerCase().includes(q) ||
          it.projectKey?.toLowerCase().includes(q) ||
          it.assignee?.name?.toLowerCase().includes(q) ||
          it.assignee?.email?.toLowerCase().includes(q) ||
          it.sprintName?.toLowerCase().includes(q)
      );
    }

    filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (options.page || options.limit) {
      const totalItems = filtered.length;
      const pageNum = Math.max(1, parseInt(options.page, 10) || 1);
      const limitNum = Math.max(1, parseInt(options.limit, 10) || 10);
      const totalPages = Math.ceil(totalItems / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedSlice = filtered.slice(startIndex, startIndex + limitNum);

      return {
        items: paginatedSlice,
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

    return filtered;
  }

  async updateActionItemStatus(itemId, status, currentUser = null) {
    if (!['todo', 'in_progress', 'done'].includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: todo, in_progress, done`);
    }

    if (status === 'done' && currentUser) {
      const userRole = (currentUser.role || '').toLowerCase().trim();
      const userProjectRole = (currentUser.projectRole || '').toLowerCase().trim();
      const userEmail = (currentUser.email || '').toLowerCase().trim();

      const isAdmin = userRole === 'admin' || isSuperAdmin(userEmail);
      const isManager =
        isAdmin ||
        userRole === 'manager' ||
        userRole.includes('manager') ||
        userProjectRole === 'manager' ||
        userProjectRole.includes('manager');

      if (!isManager) {
        const error = new Error('Only Admin or Project Manager can mark action items as Completed.');
        error.statusCode = 403;
        throw error;
      }
    }

    const normStatus = status;

    const project = await Project.findOne({ 'sprints.items.id': itemId });
    if (project) {
      for (const sprint of project.sprints) {
        const item = sprint.items.find((i) => i.id === itemId);
        if (item) {
          item.status = normStatus;
          item.completedAt = normStatus === 'done' ? new Date() : null;

          sprint.completedStoryPoints = sprint.items
            .filter((i) => i.status === 'done')
            .reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
          await project.save();

          if (item.sourceRetroId) {
            try {
              const retroQuery = mongoose.isValidObjectId(item.sourceRetroId)
                ? { _id: item.sourceRetroId }
                : { shareToken: item.sourceRetroId };
              const retro = await RetroBoard.findOne(retroQuery);
              if (retro) {
                const normTitle = (item.title || '').toLowerCase().trim();
                const matchedCard = retro.cards.find(
                  (c) =>
                    c.cardId === itemId ||
                    (c.text && c.text.toLowerCase().trim() === normTitle)
                );
                if (matchedCard) {
                  matchedCard.status = normStatus;
                  matchedCard.updatedAt = new Date();
                  await retro.save();
                }
              }
            } catch (syncErr) {
              console.warn('[updateActionItemStatus] Retro sync note:', syncErr.message);
            }
          }

          return { item, type: 'sprint_item', projectKey: project.key };
        }
      }
    }

    const retroQueryConditions = [
      { 'cards.cardId': itemId },
      { 'cards.id': itemId },
    ];
    if (mongoose.isValidObjectId(itemId)) {
      retroQueryConditions.push({ 'cards._id': itemId });
    }
    const retro = await RetroBoard.findOne({ $or: retroQueryConditions });
    if (retro) {
      const card = retro.cards.find(
        (c) =>
          c.cardId === itemId ||
          c.id === itemId ||
          (c._id && c._id.toString() === itemId)
      );
      if (card) {
        card.status = normStatus;
        card.updatedAt = new Date();
        await retro.save();

        try {
          const normText = (card.text || '').toLowerCase().trim();
          const linkedProject = await Project.findOne({
            $or: [
              { 'sprints.items.id': itemId },
              { 'sprints.items.sourceRetroId': retro._id.toString() },
              { 'sprints.items.sourceRetroId': retro.shareToken },
            ],
          });
          if (linkedProject) {
            let itemUpdated = false;
            for (const sp of linkedProject.sprints) {
              const spItem = sp.items.find(
                (it) =>
                  it.id === itemId ||
                  (it.title && it.title.toLowerCase().trim() === normText)
              );
              if (spItem) {
                spItem.status = normStatus;
                spItem.completedAt = normStatus === 'done' ? new Date() : null;
                sp.completedStoryPoints = sp.items
                  .filter((i) => i.status === 'done')
                  .reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
                itemUpdated = true;
              }
            }
            if (itemUpdated) {
              await linkedProject.save();
            }
          }
        } catch (syncErr) {
          console.warn('[updateActionItemStatus] Project sprint sync note:', syncErr.message);
        }

        return { item: card, type: 'retro_card', retroTitle: retro.title };
      }
    }

    throw new Error(`Action item with ID "${itemId}" not found.`);
  }

  async archiveProject(idOrKey, isArchived = true, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    project.isArchived = isArchived;
    if (isArchived) {
      project.healthStatus = 'at_risk';
    }
    await project.save();
    return project;
  }

  async deleteProject(idOrKey, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    const isAdmin =
      currentUser?.role?.toLowerCase() === 'admin' ||
      isSuperAdmin(currentUser?.email?.toLowerCase());

    const email = currentUser?.email?.toLowerCase()?.trim();
    const isProjectMemberManager = Boolean(
      email &&
      Array.isArray(project.members) &&
      project.members.some(
        (m) => m.email?.toLowerCase()?.trim() === email && m.role?.toLowerCase()?.includes('manager')
      )
    );

    const isProjectManager = isProjectMemberManager || (project.lead?.email?.toLowerCase()?.trim() === email);

    if (!isAdmin && !isProjectManager) {
      const isProjectLead =
        currentUser?.projectRole === 'Project Lead' ||
        currentUser?.role?.toLowerCase() === 'project lead' ||
        currentUser?.role?.toLowerCase().includes('lead') ||
        project.lead?.email?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim();

      const error = new Error(
        isProjectLead
          ? 'Access Denied: Project Leads cannot delete projects. Only Workspace Admins and Managers have deletion authority.'
          : 'Access Denied: Only Workspace Admins and Managers can delete projects.'
      );
      error.statusCode = 403;
      throw error;
    }

    await Project.deleteOne({ _id: project._id });

    try {
      await RetroBoard.deleteMany({
        $or: [
          { projectId: project._id },
          { projectKey: project.key }
        ]
      });
    } catch (cascadeErr) {
      console.warn('[deleteProject] Failed to cascade delete RetroBoards:', cascadeErr);
    }

    const nextProject = await Project.findOne().sort({ createdAt: -1 });

    return {
      deletedProjectId: project._id.toString(),
      deletedKey: project.key,
      nextProjectId: nextProject ? nextProject._id.toString() : null,
      nextProjectKey: nextProject ? nextProject.key : null,
    };
  }

  async deleteProjectRetro(idOrKey, retroIdOrToken, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const initialCount = project.retrospectives?.length || 0;
    project.retrospectives = (project.retrospectives || []).filter(
      (r) => r.id !== retroIdOrToken && r.shareToken !== retroIdOrToken
    );

    if (project.retrospectives.length === initialCount) {
      throw new Error(`Retrospective "${retroIdOrToken}" not found in project ${project.name}`);
    }

    await project.save();

    try {
      await RetroBoard.deleteOne({
        $or: [{ _id: retroIdOrToken }, { shareToken: retroIdOrToken }],
      });
    } catch { }

    return project;
  }

  async updateProjectRetro(idOrKey, retroIdOrToken, payload, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const retro = (project.retrospectives || []).find(
      (r) => r.id === retroIdOrToken || r.shareToken === retroIdOrToken
    );

    if (!retro) {
      throw new Error(`Retrospective "${retroIdOrToken}" not found in project ${project.name}`);
    }

    if (payload.title) retro.title = payload.title.trim();
    if (payload.scheduledDate) retro.scheduledDate = payload.scheduledDate;
    if (payload.startDate !== undefined) retro.startDate = payload.startDate;
    if (payload.endDate !== undefined) retro.endDate = payload.endDate;
    if (payload.sprintName) retro.sprintName = payload.sprintName.trim();
    if (payload.status) retro.status = payload.status;

    await project.save();

    try {
      const updateFields = {
        title: retro.title,
        scheduledDate: retro.scheduledDate,
        sprintName: retro.sprintName,
        status: retro.status,
      };
      if (payload.startDate !== undefined) updateFields.startDate = payload.startDate;
      if (payload.endDate !== undefined) updateFields.endDate = payload.endDate;

      await RetroBoard.updateOne(
        { $or: [{ _id: retroIdOrToken }, { shareToken: retroIdOrToken }] },
        { $set: updateFields }
      );
    } catch { }

    return project;
  }

  async inviteMembers(idOrKey, { emails, message }, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/projects/${project._id || project.key}`;
    const senderName = currentUser?.name || project.lead?.name || 'Project Lead';
    const projectLead = project.lead?.name || 'Designated Lead';

    const results = [];
    for (const email of emails) {
      const normalizedEmail = email.trim().toLowerCase();
      const member = project.members?.find((m) => m.email?.toLowerCase() === normalizedEmail);
      const role = member?.role || 'Developer';
      const memberName = member?.name || normalizedEmail.split('@')[0];

      const magicToken = jwt.sign(
        {
          email: normalizedEmail,
          name: memberName,
          role: role.toLowerCase(),
          projectId: project._id.toString(),
          projectKey: project.key,
          purpose: 'project_magic_invite',
        },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const memberInviteUrl = `${clientUrl}/projects/${project._id || project.key}?invite=${magicToken}`;

      const htmlContent = emailService.getProjectInvitationTemplate({
        projectName: project.name,
        projectKey: project.key,
        projectLead,
        role,
        inviteUrl: memberInviteUrl,
        senderName,
        customMessage: message,
        recipientEmail: normalizedEmail,
      });

      console.log(`\n📬 [Project Invitation Email dispatched to ${normalizedEmail}] for Project "${project.name}" (${memberInviteUrl})\n`);

      await emailService.sendEmail({
        to: normalizedEmail,
        subject: `Invitation: Join "${project.name}" Project on Digiflux`,
        htmlContent,
      });

      results.push({ email: normalizedEmail, status: 'sent', role, magicToken, inviteUrl: memberInviteUrl });
    }

    return {
      success: true,
      projectId: project._id,
      projectKey: project.key,
      inviteUrl,
      invitationsCount: results.length,
      recipients: results,
      message: `Project invitation email${results.length > 1 ? 's' : ''} sent successfully`,
    };
  }

  async verifyMagicInvite(projectIdOrKey, magicToken) {
    if (!magicToken) {
      throw ApiError.badRequest('Magic invite token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(magicToken, env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired project invitation link. Please request a new invitation.');
    }

    if (decoded.purpose !== 'project_magic_invite') {
      throw ApiError.unauthorized('Invalid token purpose.');
    }

    const project = await this.getProjectByIdOrKey(projectIdOrKey);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const normalizedEmail = decoded.email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw ApiError.badRequest('Invalid token payload: missing email.');
    }

    const matchedMember = project.members?.find(
      (m) => m.email?.toLowerCase().trim() === normalizedEmail
    );
    const assignedRole = matchedMember?.role || decoded.role || 'Developer';
    const memberName = matchedMember?.name || decoded.name || normalizedEmail.split('@')[0];

    const guestId = `proj-member-${crypto.randomUUID().slice(0, 8)}`;
    const token = generateToken(
      {
        id: guestId,
        name: memberName,
        email: normalizedEmail,
        role: assignedRole.toLowerCase(),
        isGuest: true,
      },
      '7d'
    );

    return {
      valid: true,
      token,
      user: {
        id: guestId,
        name: memberName,
        email: normalizedEmail,
        role: assignedRole,
      },
      project: {
        id: project._id.toString(),
        key: project.key,
        name: project.name,
      },
    };
  }
}

export const projectService = new ProjectService();
export default projectService;
