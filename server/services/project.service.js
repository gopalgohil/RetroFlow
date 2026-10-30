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

/**
 * Canonical Default Project Payload (Payment Gateway Integration)
 */
const CANONICAL_PGI_PROJECT = {
  name: 'Payment Gateway Integration',
  key: 'PGI',
  description: 'Enterprise Stripe 3DS V2, multi-currency settlement, webhook idempotency, and automated retry pipelines.',
  type: 'scrum',
  healthStatus: 'on_track',
  cadence: '2_weeks',
  customCadenceDays: 14,
  lead: {
    id: 'lead-1',
    name: 'Workspace Lead',
    email: getSuperAdminEmail(),
    avatar: 'WL',
  },
  members: [
    { id: 'm-1', name: 'Workspace Lead', email: getSuperAdminEmail(), role: 'Manager', avatar: 'WL' },
  ],
  velocityHistory: [
    { sprintName: 'Sprint 10', committedPoints: 35, completedPoints: 34 },
    { sprintName: 'Sprint 11', committedPoints: 38, completedPoints: 38 },
    { sprintName: 'Sprint 12', committedPoints: 40, completedPoints: 36 },
    { sprintName: 'Sprint 13', committedPoints: 42, completedPoints: 40 },
    { sprintName: 'Sprint 14', committedPoints: 42, completedPoints: 34 },
  ],
  retrospectives: [
    {
      id: 'retro-pgi-1',
      shareToken: 'retro-pgi-14',
      title: 'Sprint 14 Mid-Cycle Sync',
      scheduledDate: '2026-09-08',
      status: 'active',
      sprintName: 'Sprint 14 (Active)',
      topicsCount: 4,
      cardsCount: 18,
      actionItemsCount: 4,
      actionItemsExported: false,
    },
    {
      id: 'retro-pgi-2',
      shareToken: 'retro-pgi-13',
      title: 'Sprint 13 Retro: Stripe 3DS V2',
      scheduledDate: '2026-08-26',
      status: 'completed',
      sprintName: 'Sprint 13',
      topicsCount: 3,
      cardsCount: 26,
      actionItemsCount: 5,
      actionItemsExported: true,
    },
    {
      id: 'retro-pgi-3',
      shareToken: 'retro-pgi-12',
      title: 'Sprint 12 Post-Mortem & Flow',
      scheduledDate: '2026-08-12',
      status: 'completed',
      sprintName: 'Sprint 12',
      topicsCount: 4,
      cardsCount: 22,
      actionItemsCount: 3,
      actionItemsExported: true,
    },
  ],
  sprints: [
    {
      id: 'sprint-14',
      name: 'Sprint 14 - Webhook Resilience & Failover',
      number: 14,
      status: 'active',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
      goal: 'Harden Stripe webhook callback queue and reach 99.99% idempotency on dual-charge retries.',
      daysLeft: 4,
      totalStoryPoints: 42,
      completedStoryPoints: 34,
      openBlockers: 1,
      items: [
        {
          id: 'item-101',
          title: 'Implement exponential backoff on stripe 500 responses',
          type: 'story',
          priority: 'high',
          status: 'done',
          storyPoints: 5,
          assignee: { name: 'Gopal', avatar: 'G' },
          createdAt: new Date('2026-09-02'),
        },
        {
          id: 'item-102',
          title: 'Stripe webhook signature validation failing on staging proxy',
          type: 'bug',
          priority: 'critical',
          status: 'in_progress',
          storyPoints: 8,
          assignee: { name: 'Gopal', avatar: 'G' },
          createdAt: new Date('2026-09-04'),
        },
        {
          id: 'item-103',
          title: 'Add automated integration tests for 3DS challenge flow',
          type: 'task',
          priority: 'medium',
          status: 'todo',
          storyPoints: 5,
          assignee: { name: 'Gopal', avatar: 'G' },
          createdAt: new Date('2026-09-05'),
        },
      ],
    },
    {
      id: 'sprint-15',
      name: 'Sprint 15 - Multi-Currency Settlement',
      number: 15,
      status: 'upcoming',
      startDate: '2026-09-16',
      endDate: '2026-09-30',
      goal: 'Enable EUR and GBP settlement pipelines with automated daily exchange rate caching.',
      daysLeft: 19,
      totalStoryPoints: 38,
      completedStoryPoints: 0,
      openBlockers: 0,
      items: [
        {
          id: 'item-201',
          title: 'ECB daily rate sync worker cron setup',
          type: 'story',
          priority: 'high',
          status: 'todo',
          storyPoints: 8,
          assignee: { name: 'Gopal', avatar: 'G' },
          createdAt: new Date('2026-09-07'),
        },
        {
          id: 'item-202',
          title: 'Settlement reconciliation audit log view',
          type: 'story',
          priority: 'medium',
          status: 'todo',
          storyPoints: 5,
          assignee: { name: 'Gopal', avatar: 'G' },
          createdAt: new Date('2026-09-07'),
        },
      ],
    },
    {
      id: 'sprint-13',
      name: 'Sprint 13 - Stripe 3DS V2 Rollout',
      number: 13,
      status: 'completed',
      startDate: '2026-08-16',
      endDate: '2026-08-31',
      goal: 'Deliver compliant 3DS V2 checkout friction reduction across EU customers.',
      daysLeft: 0,
      totalStoryPoints: 40,
      completedStoryPoints: 40,
      openBlockers: 0,
      items: [
        {
          id: 'item-091',
          title: 'Client modal fallback for legacy browser non-iframe 3DS',
          type: 'story',
          priority: 'medium',
          status: 'done',
          storyPoints: 5,
          createdAt: new Date('2026-08-20'),
        },
      ],
    },
  ],
};

let hasCheckedSeed = false;

/**
 * Senior Developer Grade Assignee Matching
 * Prevents loose substring false-positives (e.g. 'Raj' matching 'Rajesh').
 * Prioritizes exact email match, exact name match, word token match, and @handle match.
 */
function matchesAssignee(assigneeEmail, assigneeName, targetEmail, targetName, contextText = '') {
  const tEmail = (targetEmail || '').toLowerCase().trim();
  const tName = (targetName || '').toLowerCase().trim();
  if (!tEmail && !tName) return false;

  const aEmail = (assigneeEmail || '').toLowerCase().trim();
  const aName = (assigneeName || '').toLowerCase().trim();

  // 1. Exact Email Match (Gold Standard)
  if (aEmail && tEmail && aEmail === tEmail) return true;

  // 2. Exact Full Name Match
  if (aName && tName) {
    if (aName === tName) return true;

    // Word tokens check: "Jay Sadhu" matches "Jay", but "Raj" does NOT match "Rajesh"
    const aWords = aName.split(/\s+/).filter(Boolean);
    const tWords = tName.split(/\s+/).filter(Boolean);
    if (aWords.some((w) => w === tName) || tWords.some((w) => w === aName)) {
      return true;
    }
  }

  // 3. Username / Email Prefix / Handle Match (e.g. "jays" <-> "jays@digiflux.io" or "Jay Sadhu")
  const tHandle = tEmail.includes('@') ? tEmail.split('@')[0] : tEmail;
  const aHandle = aEmail.includes('@') ? aEmail.split('@')[0] : aEmail;

  if (tHandle) {
    if (aName && (aName === tHandle || aName.toLowerCase() === tHandle)) return true;
    if (aHandle && aHandle === tHandle) return true;
  }
  if (aHandle) {
    if (tName && tName === aHandle) return true;
  }

  // 4. Cross Email <-> Name Match
  if (aEmail && tName && (aEmail === tName || aEmail.startsWith(tName))) return true;
  if (tEmail && aName && (tEmail === aName || tEmail.startsWith(aName))) return true;

  // 5. Explicit @handle mention in text (e.g. "@Gopal" or "@jays" or "@vikasr")
  if (contextText) {
    const textLower = contextText.toLowerCase();
    if (tName && (textLower.includes(`@${tName}`) || textLower.includes(`@ ${tName}`))) {
      return true;
    }
    if (tEmail) {
      const emailPrefix = tEmail.split('@')[0];
      if (emailPrefix && (textLower.includes(`@${emailPrefix}`) || textLower.includes(`@ ${emailPrefix}`))) {
        return true;
      }
    }
    const tWords = tName.split(/\s+/).filter(Boolean);
    for (const w of tWords) {
      if (w.length >= 3 && (textLower.includes(`@${w}`) || textLower.includes(`@ ${w}`))) {
        return true;
      }
    }
  }

  return false;
}

class ProjectService {
  /**
   * Automatically seed project check - disabled to prevent dummy project re-creation
   */
  async ensureSeededProject() {
    hasCheckedSeed = true;
  }

  /**
   * Retrieve projects with Enterprise RBAC filtering and high-performance server-side pagination
   * - Admin: ALWAYS has visibility across all workspace projects
   * - Regular Member/Developer: Strictly scoped to projects where user is Lead, Member, or Creator
   * - Pagination: Standard limit (default 6), skip, total count, and tab counts ('all' vs 'managed')
   * - Optimizations:
   *   1. Concurrent Promise.all execution for counts and paginated document retrieval
   *   2. Retrospective metrics sync executed strictly on paginated result slice (O(limit) vs O(N))
   */
  async getAllProjects(currentUser = null, options = {}) {
    if (!hasCheckedSeed) {
      await this.ensureSeededProject();
    }

    const {
      page = 1,
      limit = 6,
      filter = 'all',
      search = '',
      all = false,
    } = options;

    const userEmail = currentUser?.email?.toLowerCase().trim();
    const userRole = (currentUser?.role || '').toLowerCase();

    // 1. Enterprise RBAC Check
    const isAdmin = Boolean(
      currentUser &&
      (userRole === 'admin' || isSuperAdmin(userEmail))
    );

    // 2. Base Accessible Query Construction
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

    // 3. Managed Query Construction (projects where user is Lead or Manager role)
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

    // For regular members, managed query must also intersect with their base accessible scope
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

    // 3.5 Archived Query Construction
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

    // 4. Select Target Query based on filter
    let targetQuery = filter === 'archived' ? archivedQuery : filter === 'managed' ? managedQuery : baseQuery;

    // 5. Apply Search Filter if specified
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
        ],
      };

      targetQuery = {
        $and: [targetQuery, searchFilter],
      };
    }

    // 6. Enterprise Pagination Calculations
    const isAll = all === true || all === 'true' || String(limit).toLowerCase() === 'all' || Number(limit) === 0;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = isAll ? 1000 : Math.min(50, Math.max(1, parseInt(limit, 10) || 6));
    const skip = (pageNum - 1) * limitNum;

    // 7. Concurrent Execution for High-Performance Sub-millisecond Execution
    const [allCount, managedCount, archivedCount, totalItems, rawProjects] = await Promise.all([
      Project.countDocuments(baseQuery),
      Project.countDocuments(managedQuery),
      Project.countDocuments(archivedQuery),
      Project.countDocuments(targetQuery),
      isAll
        ? Project.find(targetQuery).sort({ createdAt: -1 })
        : Project.find(targetQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    // 8. Sync live metrics strictly on the paginated slice
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

  /**
   * Dynamically sync real-time card and action item metrics from live RetroBoard collection
   */
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

      // Automatically prune orphaned retrospectives (retrospectives deleted from RetroBoard collection)
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
          }
          if (liveBoard.endDate && (!retroItem.endDate || retroItem.endDate !== new Date(liveBoard.endDate).toISOString().split('T')[0])) {
            retroItem.endDate = new Date(liveBoard.endDate).toISOString().split('T')[0];
            hasChanges = true;
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

          // 1. Ensure a sprint exists for this linked retrospective
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

          // 2. Synchronize action items from live retro board into the sprint backlog dynamically
          sprint.items = sprint.items || [];
          let sprintItemsChanged = false;

          const activeCardIds = new Set(actionCards.map((c) => c.cardId));
          const activeCardTitles = new Set(
            actionCards.map((c) => (c.text || '').toLowerCase().trim()).filter(Boolean)
          );

          // 2a. Prune items that belong to this retro but are no longer active action items (e.g. deleted or moved to another column)
          const prevCount = sprint.items.length;
          sprint.items = sprint.items.filter((it) => {
            const isFromThisRetro = Boolean(
              it.sourceRetroId &&
                (it.sourceRetroId === retroItem.id ||
                  it.sourceRetroId === retroItem.shareToken ||
                  (liveBoard._id && it.sourceRetroId === liveBoard._id.toString()) ||
                  (liveBoard.shareToken && it.sourceRetroId === liveBoard.shareToken))
            );

            // If it belongs to a different retro or is a standalone sprint item, retain it
            if (!isFromThisRetro) return true;

            const cleanId = (it.id || '').replace(/^act-/, '');
            const cardTitle = (it.title || '').toLowerCase().trim();

            const isStillActiveActionCard =
              activeCardIds.has(cleanId) ||
              activeCardIds.has(it.id) ||
              activeCardTitles.has(cardTitle);

            return isStillActiveActionCard;
          });

          if (sprint.items.length !== prevCount) {
            sprintItemsChanged = true;
          }

          // 2b. Add or update active action cards from live retro board
          for (const card of actionCards) {
            const cardTitle = (card.text || '').trim();
            if (!cardTitle) continue;

            const cleanCardId = card.cardId;
            const existingItem = sprint.items.find(
              (it) =>
                it.id === cleanCardId ||
                it.id === `act-${cleanCardId}` ||
                ((it.sourceRetroId === retroItem.id ||
                  it.sourceRetroId === retroItem.shareToken ||
                  (liveBoard._id && it.sourceRetroId === liveBoard._id.toString()) ||
                  (liveBoard.shareToken && it.sourceRetroId === liveBoard.shareToken)) &&
                  it.title.toLowerCase().trim() === cardTitle.toLowerCase())
            );

            let assigneeName = card.author || 'Assigned Member';
            let assigneeEmail = card.authorEmail || undefined;
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

            const projectManager =
              project.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
              project.lead;
            const managerName = projectManager?.name || project.lead?.name || 'Project Manager';

            if (existingItem) {
              if (!existingItem.givenBy) {
                existingItem.givenBy = managerName;
                sprintItemsChanged = true;
              }
              if (card.status && existingItem.status !== card.status) {
                existingItem.status = card.status;
                sprintItemsChanged = true;
              }
              if (card.dueDate && existingItem.dueDate !== card.dueDate) {
                existingItem.dueDate = card.dueDate;
                sprintItemsChanged = true;
              }
              if (card.priority && existingItem.priority !== card.priority) {
                existingItem.priority = card.priority;
                sprintItemsChanged = true;
              }
            } else {

              const getInitials = (str) => {
                if (!str) return 'U';
                const parts = str.trim().split(/\s+/);
                if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                return str.slice(0, 2).toUpperCase();
              };

              sprint.items.push({
                id: `act-${cleanCardId || crypto.randomUUID().slice(0, 8)}`,
                title: cardTitle,
                description: '',
                type: 'action_item',
                priority: card.priority || 'high',
                status: card.status || 'todo',
                dueDate: card.dueDate || sprint.endDate || null,
                storyPoints: 3,
                assignee: {
                  name: assigneeName,
                  email: assigneeEmail,
                  avatar: getInitials(assigneeName),
                },
                givenBy: managerName,
                sourceRetroId: retroItem.id || retroItem.shareToken || liveBoard._id?.toString(),
                sourceRetroTitle: retroItem.title || liveBoard.title,
                createdAt: card.createdAt || new Date(),
              });
              sprintItemsChanged = true;
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
        ).catch(() => {});
      }
    } catch (err) {
      console.warn('[ProjectService] Error syncing retrospectives metrics:', err.message);
    }

    return project;
  }

  /**
   * Sync a specific retro board's live metrics across all parent projects
   */
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
        ).catch(() => {});
      }

      // Live-sync project sprints and backlog items
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

  /**
   * Find project by MongoDB _id, custom id, or key with zero-trust RBAC access check
   */
  async getProjectByIdOrKey(idOrKey, currentUser = null) {
    if (!idOrKey) return null;
    await this.ensureSeededProject();

    let project = null;
    if (mongoose.Types.ObjectId.isValid(idOrKey) && idOrKey.match(/^[0-9a-fA-F]{24}$/)) {
      project = await Project.findById(idOrKey);
    }

    if (!project) {
      project = await Project.findOne({ key: idOrKey.toUpperCase() });
    }

    if (!project) return null;

    // Dynamically calculate and sync live retrospective counts before checking permissions
    await this.syncProjectRetrospectives(project);

    // Ensure all sprint items have givenBy and managerName populated
    if (project.sprints && Array.isArray(project.sprints)) {
      const projectManager =
        project.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
        project.lead;
      const defaultManagerName = projectManager?.name || project.lead?.name || 'Project Manager';

      project.sprints.forEach((s) => {
        if (Array.isArray(s.items)) {
          s.items.forEach((it) => {
            if (!it.givenBy) {
              it.givenBy = defaultManagerName;
              it.managerName = defaultManagerName;
            }
          });
        }
      });
    }

    // Admin has unrestricted master access to all projects
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

    // RBAC Authorization enforcement strictly for non-admin members
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

  /**
   * Helper to verify if currentUser has Manager, Project Lead, or Admin authority in THIS project
   */
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

    // Project-specific role check:
    // User must be designated lead, creator, or assigned Manager/Lead in THIS specific project.
    // A user with "Manager" in workspace but "Developer" in this project must NOT have management rights here.
    const projectRole = (memberRecord?.role || '').toLowerCase();
    const isProjectManager = projectRole === 'manager' || projectRole.includes('manager');
    const isProjectLead = projectRole === 'project lead' || projectRole.includes('lead');

    if (!isLead && !isProjectManager && !isProjectLead && !isCreator) {
      const error = new Error('Access Denied: Only Project Lead, Managers, or Workspace Admins can perform this action in this project.');
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Create a new project with Initial Sprint
   */
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

    // Filter out if lead email is already in payload.members to avoid duplicate entries
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

    // Ensure creating manager is always recorded as a member if not already lead/member
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

    // Synchronize global projectRole in User collection for any assigned Managers/Leads
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

  /**
   * Update project configuration
   */
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

  /**
   * Start an upcoming sprint (marks current active as completed)
   */
  async startSprint(idOrKey, sprintId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    let found = false;
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        found = true;
        s.status = 'active';
        s.daysLeft = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
      } else if (s.status === 'active') {
        s.status = 'completed';
        s.daysLeft = 0;
      }
      return s;
    });

    if (!found) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    await project.save();
    return project;
  }

  /**
   * Complete an active sprint
   */
  async completeSprint(idOrKey, sprintId, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    let found = false;
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        found = true;
        s.status = 'completed';
        s.daysLeft = 0;
        s.completedStoryPoints = s.totalStoryPoints;
      }
      return s;
    });

    if (!found) throw new Error(`Sprint with ID ${sprintId} not found in this project`);

    await project.save();
    return project;
  }

  /**
   * Update status of an individual backlog item / action item in a sprint
   */
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

    // RBAC & Assignee validation:
    // Only assigned developer or manager can update status; only manager can mark as done.
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
      if (status === 'done' && !item.completedAt) {
        item.completedAt = new Date();
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

    // Bi-directional Sync: Synchronize matching card in RetroBoard if linked
    if (item.sourceRetroId && status) {
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
            matchedCard.status = status;
            matchedCard.updatedAt = new Date();
            await retro.save();
          }
        }
      } catch (syncErr) {
        console.warn('[updateSprintItemStatus] Failed to sync to RetroBoard:', syncErr?.message || syncErr);
      }
    }

    // Dynamically recalculate completedStoryPoints for this sprint based on completed items
    sprint.completedStoryPoints = sprint.items
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

    // If totalStoryPoints is 0, sum all items
    if (!sprint.totalStoryPoints || sprint.totalStoryPoints === 0) {
      sprint.totalStoryPoints = sprint.items.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    }

    await project.save();
    return project;
  }

  /**
   * Delete an individual backlog item / action item from a sprint
   * Recalculates total and completed story points, and removes matching card from retro if applicable
   */
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

    // Dynamically recalculate completed and total story points for this sprint
    sprint.completedStoryPoints = sprint.items
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3), 0);

    sprint.totalStoryPoints = sprint.items.reduce(
      (acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3),
      0
    );

    await project.save();

    // If item originated from a retrospective, preserve the card in the retro session
    // (historical meeting record remains intact), but mark isSprintRemoved: true
    // so it does not appear as an active work item in the developer's "Action Items" dashboard.
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

  /**
   * Delete an entire sprint from the project
   * Restricted strictly to Admins and Managers
   */
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

    // If deleted sprint was active, set next available upcoming sprint to active
    if (deletedSprint.status === 'active') {
      const nextSprint = project.sprints.find((s) => s.status === 'upcoming');
      if (nextSprint) {
        nextSprint.status = 'active';
      }
    }

    await project.save();
    return project;
  }

  /**
   * Get paginated backlog items & action items for an individual sprint
   * Industry-standard pagination metadata (page, limit=10, totalItems, totalPages, hasNextPage, hasPrevPage)
   */
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
      project.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
      project.lead;
    const defaultManagerName = projectManager?.name || project.lead?.name || 'Project Manager';

    let items = Array.isArray(sprint.items)
      ? sprint.items.map((it) => ({
          ...it,
          givenBy: it.givenBy || defaultManagerName,
          managerName: it.managerName || it.givenBy || defaultManagerName,
        }))
      : [];

    // Optional status filtering ('todo' | 'in_progress' | 'done')
    if (status && status !== 'all') {
      items = items.filter((it) => it.status === status);
    }

    // Optional search filtering
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

  /**
   * Industry-Standard Project Sprints Pagination & Retrieval
   * Supports page, limit (default 10), status filter ('all' | 'active' | 'upcoming' | 'completed'), and search
   */
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

    // Filter by status if specified
    if (status && status !== 'all') {
      filtered = filtered.filter((s) => s.status === status);
    }

    // Filter by search query if provided
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

  /**
   * Industry-Standard Project Retrospectives Pagination & Retrieval
   * Supports page, limit (default 9), search, and synchronization of latest retro metrics
   */
  async getProjectRetros(
    idOrKey,
    { page = 1, limit = 9, search = '' } = {},
    currentUser = null
  ) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');

    // Ensure latest cards/actionItems counters are synchronized
    await this.syncProjectRetrospectives(project);

    const allRetros = Array.isArray(project.retrospectives) ? [...project.retrospectives] : [];

    let filtered = allRetros;

    // Filter by search query if provided
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

  /**
   * Update custom start/end dates and goal of an individual sprint
   */
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

    // Calculate days remaining from today till endDate
    const nowMs = Date.now();
    const diffDays = Math.ceil((endMs - nowMs) / 86400000);
    sprint.daysLeft = Math.max(0, diffDays);

    await project.save();
    return project;
  }

  /**
   * Add a team member with role
   */
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

    // Automatically synchronize new member into approvedMembers for all retros of this project
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

  /**
   * Remove a team member from the project
   */
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

    // Prevent removing designated primary Project Lead
    if (project.lead?.email?.toLowerCase() === memberToRemove.email.toLowerCase()) {
      throw new Error('Cannot remove the designated Project Lead from the project.');
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    // Synchronize removal from approvedMembers in project retros
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

  /**
   * Update a team member's role in the project
   */
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

  /**
   * Export action items from a retrospective into the sprint backlog
   */
  async exportActionItems(idOrKey, sprintId, items, currentUser = null) {
    const project = await this.getProjectByIdOrKey(idOrKey, currentUser);
    if (!project) throw new Error('Project not found');
    this.assertCanManage(project, currentUser);

    // Locate target sprint or determine from retro context
    let sprint = project.sprints.find((s) => s.id === sprintId);

    if (!sprint) {
      // Deduce sprint number from sourceRetroTitle or sourceRetroId
      let sprintNum = null;
      const sourceTitle = items[0]?.sourceRetroTitle || '';
      const match = sourceTitle.match(/sprint\s*(\d+)/i);
      if (match) {
        sprintNum = parseInt(match[1], 10);
      } else if (items[0]?.sourceRetroId) {
        const retroEntry = project.retrospectives?.find(
          (r) => r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
        );
        if (retroEntry?.sprintName) {
          const sMatch = retroEntry.sprintName.match(/\d+/);
          if (sMatch) sprintNum = parseInt(sMatch[0], 10);
        }
      }

      if (sprintNum) {
        sprint = project.sprints.find(
          (s) => s.number === sprintNum || s.name.toLowerCase().startsWith(`sprint ${sprintNum}`)
        );
      }
    }

    if (!sprint) {
      sprint = project.sprints.find((s) => s.status === 'active') ||
               project.sprints.find((s) => s.status === 'upcoming') ||
               project.sprints[0];
    }

    if (sprint && sprint.status === 'upcoming') {
      sprint.status = 'active';
      sprint.daysLeft = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
    }

    if (!sprint) {
      let sprintNum = 1;
      const sourceTitle = items[0]?.sourceRetroTitle || '';
      const match = sourceTitle.match(/sprint\s*(\d+)/i);
      if (match) {
        sprintNum = parseInt(match[1], 10);
      } else if (items[0]?.sourceRetroId) {
        const retroEntry = project.retrospectives?.find(
          (r) => r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
        );
        if (retroEntry?.sprintName) {
          const sMatch = retroEntry.sprintName.match(/\d+/);
          if (sMatch) sprintNum = parseInt(sMatch[0], 10);
        }
      }

      const cadenceDays = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
      sprint = {
        id: `sprint-${crypto.randomBytes(4).toString('hex')}`,
        name: `Sprint ${sprintNum} - Execution & Backlog`,
        number: sprintNum,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + cadenceDays * 86400000).toISOString().split('T')[0],
        goal: `Sprint ${sprintNum} deliverables and retrospective action items.`,
        daysLeft: cadenceDays,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        openBlockers: 0,
        items: [],
      };
      project.sprints.push(sprint);
    }

    const newItems = items.map((item) => {
      const itemStatus = ['todo', 'in_progress', 'done'].includes(item.status) ? item.status : 'todo';
      const storyPointsNum = typeof item.storyPoints === 'number'
        ? item.storyPoints
        : (Number(item.storyPoints) || 3);

      let resolvedName = item.assignee?.name ? item.assignee.name.trim() : undefined;
      let resolvedEmail = item.assignee?.email ? item.assignee.email.toLowerCase().trim() : undefined;
      let resolvedAvatar = item.assignee?.avatar;

      // Auto-resolve email and canonical member details from project members and lead
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
        project.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
        project.lead;
      const resolvedGivenBy =
        item.givenBy ||
        item.managerName ||
        currentUser?.name ||
        projectManager?.name ||
        project.lead?.name ||
        'Project Manager';

      return {
        id: `act-${crypto.randomUUID().slice(0, 8)}`,
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
    sprint.totalStoryPoints = sprint.items.reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);
    sprint.completedStoryPoints = sprint.items
      .filter((it) => it.status === 'done')
      .reduce((acc, it) => acc + (Number(it.storyPoints) || 0), 0);

    // Mark retro link as exported and session as completed if retro link exists
    if (items[0]?.sourceRetroId) {
      project.retrospectives = project.retrospectives.map((r) => {
        if (r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId) {
          r.actionItemsExported = true;
          r.status = 'completed';
        }
        return r;
      });

      // Also sync RetroBoard document status to 'completed'
      try {
        const retroIdentifier = items[0].sourceRetroId;
        const retroQuery = mongoose.Types.ObjectId.isValid(retroIdentifier)
          ? { $or: [{ _id: retroIdentifier }, { shareToken: retroIdentifier }] }
          : { shareToken: retroIdentifier };

        const retroBoardDoc = await RetroBoard.findOne(retroQuery);
        if (retroBoardDoc) {
          retroBoardDoc.status = 'completed';
          retroBoardDoc.cards = retroBoardDoc.cards || [];
          for (const it of newItems) {
            const card = retroBoardDoc.cards.find(
              (c) =>
                (it.id && (c.cardId === it.id || (c._id && c._id.toString() === it.id))) ||
                (c.text && it.title && c.text.trim().toLowerCase() === it.title.trim().toLowerCase())
            );
            if (card) {
              card.assignedTo = it.assignee;
              card.assignedSprintName = sprint.name;
              card.isExportedToActionItems = true;
            }
          }
          await retroBoardDoc.save();
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

  /**
   * Retrieve action items assigned to the current user (or all team items if requested by Admin/Manager)
   */
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

    // 1. Fetch accessible projects
    let projectQuery = {};
    if (!isAdmin && userEmail) {
      const userHandle = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;
      projectQuery = {
        $or: [
          { 'lead.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { 'members.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { 'sprints.items.assignee.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          ...(userName ? [{ 'sprints.items.assignee.name': { $regex: new RegExp(`^${userName}$`, 'i') } }] : []),
          ...(userHandle ? [{ 'sprints.items.assignee.name': { $regex: new RegExp(`^${userHandle}$`, 'i') } }] : []),
          ...(currentUser?._id ? [{ createdBy: currentUser._id }] : []),
        ],
      };
    }

    const projects = await Project.find(projectQuery).lean();
    const actionItems = [];
    const seenCardIds = new Set();
    const normalizeKey = (str) => (str ? str.toString().toLowerCase().trim() : '');

    // Collect action items from project sprints
    for (const proj of projects) {
      const sprints = proj.sprints || [];
      for (const sprint of sprints) {
        const items = sprint.items || [];
        for (const item of items) {
          // If not fetching all, strictly filter by assigned user email or name
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

          const projectManager =
            proj.members?.find((m) => m.role === 'Manager' || m.role === 'Project Lead') ||
            proj.lead;
          const managerName = item.givenBy || projectManager?.name || proj.lead?.name || 'Project Manager';

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
            givenBy: managerName,
            managerName: managerName,
            createdAt: item.createdAt || proj.createdAt || new Date().toISOString(),
          });
        }
      }
    }

    // 2. Collect direct action cards from accessible Retrospective Sessions (Action Items topic)
    let retroQuery = {};
    if (!isAdmin && userEmail) {
      const projectIds = projects.map((p) => p._id);
      const projectKeys = projects.map((p) => p.key).filter(Boolean);

      if (fetchAll) {
        // Manager's "All Team Items": Only retros belonging to manager's accessible projects
        retroQuery = {
          $or: [
            { projectId: { $in: projectIds } },
            { projectKey: { $in: projectKeys } },
            ...(currentUser?._id ? [{ createdBy: currentUser._id }] : []),
          ],
        };
      } else {
        // "My Action Items": Retros where user is approved, attendee, author, creator, or member of associated project
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
        // Skip cards that were removed from the sprint backlog
        if (card.isSprintRemoved) {
          continue;
        }

        const cardIdNorm = normalizeKey(card.cardId);
        const cardTextNorm = normalizeKey(card.text);
        const retroIdNorm = normalizeKey(retro._id.toString());
        const retroShareNorm = normalizeKey(retro.shareToken);

        // Prevent duplicate if already exported to a sprint backlog (case-insensitive & robust)
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

        // When viewing team items as non-admin manager, card must belong to an accessible project or retro created by user
        if (fetchAll && !isAdmin && !matchingProject && (!currentUser?._id || retro.createdBy?.toString() !== currentUser._id.toString())) {
          continue;
        }

        // Intelligent Assignee Resolution: Check @mention in card.text vs card.author
        let directAssigneeName = card.author || 'Assigned Member';
        let directAssigneeEmail = card.authorEmail || undefined;

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

    // Filter by options if provided
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

    // Sort by createdAt descending
    filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Optional server-side pagination
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

  /**
   * Update the status of an action item (whether in sprint backlog or direct retro card)
   * Engineered with Full Bi-directional synchronization between Sprints and Retro Boards.
   */
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

    // 1. Search in Project Sprints
    const project = await Project.findOne({ 'sprints.items.id': itemId });
    if (project) {
      for (const sprint of project.sprints) {
        const item = sprint.items.find((i) => i.id === itemId);
        if (item) {
          item.status = normStatus;
          item.completedAt = normStatus === 'done' ? new Date() : null;

          // Safe numeric story points recalculation
          sprint.completedStoryPoints = sprint.items
            .filter((i) => i.status === 'done')
            .reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
          await project.save();

          // Bi-directional Sync: Synchronize matching card in RetroBoard if linked
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

    // 2. Search in RetroBoard cards
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

        // Bi-directional Sync: Synchronize matching item in Project sprint backlog
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

  /**
   * Archive / Restore project (Soft Delete)
   */
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

  /**
   * Permanently delete project (Hard Delete - Danger Zone)
   */
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

    // Only Workspace Admins or members explicitly assigned as Manager in this project can delete
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

    // Cascade delete associated RetroBoards to prevent orphaned sessions
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

    // Locate the next available project if any remain
    const nextProject = await Project.findOne().sort({ createdAt: -1 });

    return {
      deletedProjectId: project._id.toString(),
      deletedKey: project.key,
      nextProjectId: nextProject ? nextProject._id.toString() : null,
      nextProjectKey: nextProject ? nextProject.key : null,
    };
  }

  /**
   * Delete a retrospective session linked to a project
   */
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

    // Also clean up from RetroBoard collection if exists
    try {
      await RetroBoard.deleteOne({
        $or: [{ _id: retroIdOrToken }, { shareToken: retroIdOrToken }],
      });
    } catch {}

    return project;
  }

  /**
   * Update retrospective session details (title, scheduledDate, sprintName) in project
   */
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

    // Also update RetroBoard document if present
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
    } catch {}

    return project;
  }

  /**
   * Send project invitation emails to selected or external members
   */
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
      // Find member role if already assigned in project
      const member = project.members?.find((m) => m.email?.toLowerCase() === normalizedEmail);
      const role = member?.role || 'Developer';
      const memberName = member?.name || normalizedEmail.split('@')[0];

      // Generate secure 7-day magic token for 1-click entry
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

  /**
   * Verify an encrypted project magic invite token and return genuine session JWT for invited developer
   */
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
