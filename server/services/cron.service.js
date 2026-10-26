import cron from 'node-cron';
import crypto from 'crypto';
import RetroBoard from '../models/RetroBoard.js';
import Project from '../models/Project.js';

class CronService {
  constructor() {
    this.cronTask = null;
    this.isRunning = false;
  }

  /**
   * Helper to calculate start, end and display name for a given month
   */
  calculateMonthBounds(targetDate = new Date()) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed (0 = Jan, 9 = Oct, 10 = Nov)

    // First millisecond of the month
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);

    // Last millisecond of the month (Day 0 of next month is the last day of this month)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const monthName = monthStart.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const nextMonthStart = new Date(year, month + 1, 1, 0, 0, 0, 0);

    return {
      year,
      month,
      monthStart,
      monthEnd,
      monthName,
      nextMonthStart,
    };
  }

  /**
   * Step 1: Mark expired active automated retrospectives as completed
   */
  async closeExpiredMonthlyRetros(now = new Date()) {
    try {
      // Find all active automated retros whose endDate has passed
      const expiredBoards = await RetroBoard.find({
        status: 'active',
        isMonthlyAuto: true,
        endDate: { $lt: now },
      }).select('_id projectId title');

      if (expiredBoards.length === 0) {
        return { count: 0 };
      }

      const expiredIds = expiredBoards.map((b) => b._id);
      const expiredIdStrings = expiredBoards.map((b) => b._id.toString());

      // Update RetroBoard documents
      const updateResult = await RetroBoard.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'completed' } }
      );

      // Keep Project.retrospectives subdocument link in sync
      await Project.updateMany(
        { 'retrospectives.id': { $in: expiredIdStrings } },
        { $set: { 'retrospectives.$[elem].status': 'completed' } },
        { arrayFilters: [{ 'elem.id': { $in: expiredIdStrings } }] }
      );

      console.log(
        `[MonthlyRetroCron] Successfully completed ${updateResult.modifiedCount} expired automated retro board(s).`
      );

      return { count: updateResult.modifiedCount, expiredIds: expiredIdStrings };
    } catch (err) {
      console.error('[MonthlyRetroCron] Error closing expired monthly retros:', err);
      return { count: 0, error: err.message };
    }
  }

  /**
   * Step 2: Auto-create new monthly retrospective board for eligible projects
   */
  async createMonthlyRetrosForEligibleProjects(targetDate = new Date(), io = null) {
    const { monthStart, monthEnd, monthName } = this.calculateMonthBounds(targetDate);
    const createdRetros = [];

    try {
      // Find all active projects where automated monthly retros are enabled (default is true)
      const eligibleProjects = await Project.find({
        isArchived: { $ne: true },
        autoMonthlyRetro: { $ne: false },
      });

      console.log(
        `[MonthlyRetroCron] Checking ${eligibleProjects.length} eligible project(s) for ${monthName}...`
      );

      for (const project of eligibleProjects) {
        try {
          // Idempotency Check: Don't duplicate if a monthly retro already exists for this month
          const existingMonthlyRetro = await RetroBoard.findOne({
            projectId: project._id,
            isMonthlyAuto: true,
            startDate: { $gte: monthStart, $lte: monthEnd },
          });

          if (existingMonthlyRetro) {
            console.log(
              `[MonthlyRetroCron] Project "${project.name}" (${project.key}) already has a monthly retro for ${monthName}. Skipping.`
            );
            continue;
          }

          const retroTitle = `${project.name} - ${monthName} Retrospective`;

          // Also check by title to avoid any edge duplicate
          const existingByTitle = await RetroBoard.findOne({
            projectId: project._id,
            title: retroTitle,
          });

          if (existingByTitle) {
            console.log(
              `[MonthlyRetroCron] Retro titled "${retroTitle}" already exists. Skipping.`
            );
            continue;
          }

          // Whitelist all current project members
          const approvedMembers = (project.members || [])
            .map((m) => m.email?.toLowerCase().trim())
            .filter(Boolean);

          // Find active or upcoming sprint linkage
          const activeSprint =
            project.sprints?.find((s) => s.status === 'active') ||
            project.sprints?.[0] ||
            null;

          const defaultTopics = [
            {
              topicId: crypto.randomUUID(),
              title: 'What went well?',
              description: 'Things we are proud of or happy about',
              icon: 'smile',
              color: '#10B981',
              order: 0,
            },
            {
              topicId: crypto.randomUUID(),
              title: 'What could be improved?',
              description: 'Bottlenecks, frictions, or blockers to resolve',
              icon: 'frown',
              color: '#F43F5E',
              order: 1,
            },
            {
              topicId: crypto.randomUUID(),
              title: 'Action Items',
              description: 'Concrete deliverables for the upcoming sprint',
              icon: 'target',
              color: '#0EA5E9',
              order: 2,
            },
          ];

          // Create the official RetroBoard in MongoDB
          const newRetro = await RetroBoard.create({
            title: retroTitle,
            description: `Automated monthly retrospective session for ${monthName}.`,
            scheduledDate: monthStart,
            startDate: monthStart,
            endDate: monthEnd,
            status: 'active',
            isMonthlyAuto: true,
            isProjectScoped: true,
            projectId: project._id,
            projectKey: project.key,
            sprintId: activeSprint ? activeSprint.id : null,
            sprintName: activeSprint ? activeSprint.name : 'Sprint Active',
            approvedMembers,
            topics: defaultTopics,
            cards: [],
            attendees: [],
            createdBy: project.createdBy || null,
          });

          // Link retro inside project.retrospectives
          project.retrospectives.unshift({
            id: newRetro._id.toString(),
            shareToken: newRetro.shareToken,
            title: newRetro.title,
            scheduledDate: monthStart.toISOString().split('T')[0],
            startDate: monthStart.toISOString().split('T')[0],
            endDate: monthEnd.toISOString().split('T')[0],
            status: 'active',
            sprintName: newRetro.sprintName || 'Sprint Active',
            topicsCount: defaultTopics.length,
            cardsCount: 0,
            actionItemsCount: 0,
            actionItemsExported: false,
          });

          await project.save();
          createdRetros.push({
            id: newRetro._id.toString(),
            title: newRetro.title,
            projectKey: project.key,
          });

          console.log(
            `[MonthlyRetroCron] ✅ Successfully created automated retro "${newRetro.title}" for ${project.key}.`
          );

          // Optional Socket.io broadcast for instant UI refresh
          if (io) {
            io.emit('project:retro_created', {
              projectId: project._id.toString(),
              projectKey: project.key,
              retroId: newRetro._id.toString(),
              title: newRetro.title,
            });
          }
        } catch (projErr) {
          console.error(
            `[MonthlyRetroCron] Failed to create monthly retro for project "${project.name}":`,
            projErr
          );
        }
      }

      return {
        success: true,
        month: monthName,
        createdCount: createdRetros.length,
        createdRetros,
      };
    } catch (err) {
      console.error('[MonthlyRetroCron] Error during monthly retro creation process:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Complete orchestration cycle:
   * 1. Close expired past month retros
   * 2. Provision new month retros for active projects
   */
  async runMonthlyRetroJob(io = null, targetDate = new Date()) {
    if (this.isRunning) {
      console.log('[MonthlyRetroCron] Job is already in progress. Skipping concurrent run.');
      return { status: 'already_running' };
    }

    this.isRunning = true;
    console.log(`\n======================================================`);
    console.log(` ⏰ [MonthlyRetroCron] Executing Auto-Retro Job Cycle`);
    console.log(` 📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================\n`);

    try {
      const closed = await this.closeExpiredMonthlyRetros(targetDate);
      const created = await this.createMonthlyRetrosForEligibleProjects(targetDate, io);

      console.log(`[MonthlyRetroCron] Cycle complete. Closed: ${closed.count}, Created: ${created.createdCount || 0}.\n`);
      return { closed, created };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Initialize and arm the cron scheduler
   * Pattern: '1 0 1 * *' (At 00:01 on day 1 of every month)
   */
  initMonthlyRetroCron(io = null) {
    // Run an initial sweep to complete any expired retros on server boot
    this.closeExpiredMonthlyRetros().catch((e) =>
      console.warn('[MonthlyRetroCron] Boot-time sweep warning:', e.message)
    );

    // Schedule monthly job at 12:01 AM on the 1st of every month
    const cronSchedule = '1 0 1 * *';

    this.cronTask = cron.schedule(
      cronSchedule,
      async () => {
        await this.runMonthlyRetroJob(io);
      },
      {
        scheduled: true,
        timezone: process.env.CRON_TIMEZONE || undefined,
      }
    );

    console.log(`[CronService] 🛡️ Monthly Auto-Retro Cron armed. Rule: "${cronSchedule}" (1st of every month at 00:01).`);
  }

  /**
   * Stop the scheduled cron task if needed
   */
  stopCron() {
    if (this.cronTask) {
      this.cronTask.stop();
      console.log('[CronService] Monthly Auto-Retro Cron paused.');
    }
  }
}

export const cronService = new CronService();
export default cronService;
