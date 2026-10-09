import Scorecard from '../models/Scorecard.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { isSuperAdmin } from '../config/admin.config.js';

class ScorecardService {
  /**
   * Submit performance ratings for one or multiple team members
   * Accessible by: Workspace Admin or Project Manager
   */
  async submitScorecards(evaluations = [], context = {}, currentUser = null) {
    if (!currentUser) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userRole = (currentUser.role || '').toLowerCase().trim();
    const userProjectRole = (currentUser.projectRole || '').toLowerCase().trim();

    const isAdmin = userRole === 'admin' || isSuperAdmin(userEmail);
    const isManager =
      isAdmin ||
      userRole === 'manager' ||
      userRole.includes('manager') ||
      userProjectRole === 'manager';

    if (!isManager) {
      const err = new Error('Permission Denied: Only Workspace Admins and Project Managers can evaluate team members.');
      err.statusCode = 403;
      throw err;
    }

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return [];
    }

    const savedRecords = [];

    for (const ev of evaluations) {
      if (!ev.memberName || !ev.memberEmail) continue;

      const q = Math.max(1, Math.min(5, Number(ev.ratings?.quality || 3)));
      const t = Math.max(1, Math.min(5, Number(ev.ratings?.timeliness || 3)));
      const c = Math.max(1, Math.min(5, Number(ev.ratings?.communication || 3)));
      const col = Math.max(1, Math.min(5, Number(ev.ratings?.collaboration || 3)));

      // Mehul Bhai's Weighted Formula:
      // (Q * 0.35) + (T * 0.25) + (C * 0.25) + (Col * 0.15)
      const overall = Number(((q * 0.35) + (t * 0.25) + (c * 0.25) + (col * 0.15)).toFixed(2));

      const card = new Scorecard({
        memberId: ev.memberId || `m-${ev.memberEmail.split('@')[0]}`,
        memberName: ev.memberName.trim(),
        memberEmail: ev.memberEmail.toLowerCase().trim(),
        memberRole: ev.memberRole || 'Developer',
        projectId: context.projectId || ev.projectId || null,
        projectKey: context.projectKey || ev.projectKey || null,
        retroId: context.retroId || ev.retroId || null,
        retroTitle: context.retroTitle || ev.retroTitle || null,
        sprintId: context.sprintId || ev.sprintId || null,
        sprintName: context.sprintName || ev.sprintName || null,
        ratedBy: {
          id: currentUser._id ? currentUser._id.toString() : currentUser.id,
          name: currentUser.name || currentUser.email,
          email: userEmail,
          role: isAdmin ? 'Admin' : 'Manager',
        },
        ratings: {
          quality: q,
          timeliness: t,
          communication: c,
          collaboration: col,
        },
        weights: {
          quality: 0.35,
          timeliness: 0.25,
          communication: 0.25,
          collaboration: 0.15,
        },
        overallScore: overall,
        feedback: (ev.feedback || '').trim(),
      });

      const saved = await card.save();
      savedRecords.push(saved);
    }

    return savedRecords;
  }

  /**
   * Get Consolidated Team Scoreboard
   * STRICTLY ADMIN ONLY
   */
  async getTeamScoreboard(currentUser = null) {
    if (!currentUser) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userRole = (currentUser.role || '').toLowerCase().trim();
    const isAdmin = userRole === 'admin' || isSuperAdmin(userEmail);

    if (!isAdmin) {
      const err = new Error('Access Denied: The Team Scoreboard is restricted to Workspace Administrators only.');
      err.statusCode = 403;
      throw err;
    }

    // 1. Fetch all scorecards
    const allScorecards = await Scorecard.find({}).sort({ createdAt: -1 }).lean();

    // 2. Fetch workspace users to build full roster
    const allUsers = await User.find({ role: { $ne: 'admin' } }).select('name email role projectRole avatar').lean();

    // Group scorecards by memberEmail
    const scorecardsByMember = new Map();
    for (const sc of allScorecards) {
      const email = sc.memberEmail.toLowerCase();
      if (!scorecardsByMember.has(email)) {
        scorecardsByMember.set(email, []);
      }
      scorecardsByMember.get(email).push(sc);
    }

    const memberRoster = [];

    // Combine users with their scorecard history
    const processedEmails = new Set();

    for (const user of allUsers) {
      const email = user.email.toLowerCase();
      processedEmails.add(email);
      const cards = scorecardsByMember.get(email) || [];

      if (cards.length > 0) {
        const total = cards.length;
        const avgOverall = Number((cards.reduce((sum, c) => sum + c.overallScore, 0) / total).toFixed(2));
        const avgQuality = Number((cards.reduce((sum, c) => sum + (c.ratings?.quality || 3), 0) / total).toFixed(1));
        const avgTimeliness = Number((cards.reduce((sum, c) => sum + (c.ratings?.timeliness || 3), 0) / total).toFixed(1));
        const avgCommunication = Number((cards.reduce((sum, c) => sum + (c.ratings?.communication || 3), 0) / total).toFixed(1));
        const avgCollaboration = Number((cards.reduce((sum, c) => sum + (c.ratings?.collaboration || 3), 0) / total).toFixed(1));

        memberRoster.push({
          memberId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.projectRole || user.role || 'Developer',
          avatar: user.avatar,
          totalEvaluations: total,
          overallScore: avgOverall,
          breakdown: {
            quality: avgQuality,
            timeliness: avgTimeliness,
            communication: avgCommunication,
            collaboration: avgCollaboration,
          },
          lastRatedAt: cards[0].createdAt,
          latestFeedback: cards[0].feedback || '',
          recentHistory: cards.slice(0, 5),
        });
      } else {
        // Unrated member
        memberRoster.push({
          memberId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.projectRole || user.role || 'Developer',
          avatar: user.avatar,
          totalEvaluations: 0,
          overallScore: 0,
          breakdown: { quality: 0, timeliness: 0, communication: 0, collaboration: 0 },
          lastRatedAt: null,
          latestFeedback: '',
          recentHistory: [],
        });
      }
    }

    // Include any evaluated members who might not be in the direct User collection (e.g. project invitees)
    for (const [email, cards] of scorecardsByMember.entries()) {
      if (processedEmails.has(email)) continue;
      const total = cards.length;
      const avgOverall = Number((cards.reduce((sum, c) => sum + c.overallScore, 0) / total).toFixed(2));
      const avgQuality = Number((cards.reduce((sum, c) => sum + (c.ratings?.quality || 3), 0) / total).toFixed(1));
      const avgTimeliness = Number((cards.reduce((sum, c) => sum + (c.ratings?.timeliness || 3), 0) / total).toFixed(1));
      const avgCommunication = Number((cards.reduce((sum, c) => sum + (c.ratings?.communication || 3), 0) / total).toFixed(1));
      const avgCollaboration = Number((cards.reduce((sum, c) => sum + (c.ratings?.collaboration || 3), 0) / total).toFixed(1));

      memberRoster.push({
        memberId: cards[0].memberId || `m-${email.split('@')[0]}`,
        name: cards[0].memberName,
        email: email,
        role: cards[0].memberRole || 'Developer',
        avatar: '',
        totalEvaluations: total,
        overallScore: avgOverall,
        breakdown: {
          quality: avgQuality,
          timeliness: avgTimeliness,
          communication: avgCommunication,
          collaboration: avgCollaboration,
        },
        lastRatedAt: cards[0].createdAt,
        latestFeedback: cards[0].feedback || '',
        recentHistory: cards.slice(0, 5),
      });
    }

    // Sort by overallScore descending (rated first, unrated last)
    memberRoster.sort((a, b) => b.overallScore - a.overallScore);

    // Calculate High-level KPIs
    const ratedMembers = memberRoster.filter((m) => m.totalEvaluations > 0);
    const teamAvgScore =
      ratedMembers.length > 0
        ? Number((ratedMembers.reduce((sum, m) => sum + m.overallScore, 0) / ratedMembers.length).toFixed(2))
        : 0;

    const topPerformer = ratedMembers.length > 0 ? ratedMembers[0] : null;

    // Highest rated category
    let highestCategory = 'Quality';
    if (ratedMembers.length > 0) {
      const qTotal = ratedMembers.reduce((s, m) => s + m.breakdown.quality, 0);
      const tTotal = ratedMembers.reduce((s, m) => s + m.breakdown.timeliness, 0);
      const cTotal = ratedMembers.reduce((s, m) => s + m.breakdown.communication, 0);
      const colTotal = ratedMembers.reduce((s, m) => s + m.breakdown.collaboration, 0);

      const maxVal = Math.max(qTotal, tTotal, cTotal, colTotal);
      if (maxVal === qTotal) highestCategory = 'Quality (35%)';
      else if (maxVal === tTotal) highestCategory = 'Timeliness (25%)';
      else if (maxVal === cTotal) highestCategory = 'Communication (25%)';
      else highestCategory = 'Collaboration (15%)';
    }

    return {
      kpis: {
        teamAverageScore: teamAvgScore,
        totalMembers: memberRoster.length,
        totalRatedMembers: ratedMembers.length,
        topPerformer: topPerformer
          ? { name: topPerformer.name, score: topPerformer.overallScore, role: topPerformer.role }
          : null,
        highestCategory,
      },
      members: memberRoster,
      recentEvaluations: allScorecards.slice(0, 10),
    };
  }
}

export const scorecardService = new ScorecardService();
export default scorecardService;
