import User from '../models/User.js';
import RetroBoard from '../models/RetroBoard.js';
import Project from '../models/Project.js';

/**
 * Members & Whitelist Service
 * Encapsulates workspace team roster business logic and whitelist permissions
 */
class MembersService {
  /**
   * Retrieves all registered workspace users and whitelisted contributors
   * with assigned project counts and enterprise project roles
   * @param {string|ObjectId} userId - Requesting facilitator ID
   * @returns {Promise<Array>} List of formatted workspace members
   */
  async getWorkspaceMembers(userId, { page = 1, limit = 10, search = '' } = {}) {
    // 1. Concurrently fetch registered users, facilitator retros, and active projects
    const [users, retros, projects] = await Promise.all([
      User.find({}, 'name email role createdAt isVerified').lean(),
      RetroBoard.find({ createdBy: userId }, 'approvedMembers').lean(),
      Project.find({}, 'name key members lead').lean(),
    ]);

    // 2. Build map of member email -> project stats (count, roles, names, isLead)
    const projectStatsMap = new Map();
    projects.forEach((proj) => {
      const leadEmail = proj.lead?.email?.toLowerCase().trim();
      if (leadEmail) {
        if (!projectStatsMap.has(leadEmail)) {
          projectStatsMap.set(leadEmail, { count: 0, roles: new Set(), names: [], isLead: true });
        }
        const stat = projectStatsMap.get(leadEmail);
        stat.count++;
        stat.roles.add('Project Lead');
        stat.names.push(proj.name || proj.key);
        stat.isLead = true;
      }

      if (Array.isArray(proj.members)) {
        proj.members.forEach((m) => {
          const mEmail = m.email?.toLowerCase().trim();
          if (!mEmail) return;
          if (!projectStatsMap.has(mEmail)) {
            projectStatsMap.set(mEmail, { count: 0, roles: new Set(), names: [], isLead: false });
          }
          const stat = projectStatsMap.get(mEmail);
          if (leadEmail !== mEmail) {
            stat.count++;
            stat.names.push(proj.name || proj.key);
          }
          if (m.role) stat.roles.add(m.role);
        });
      }
    });

    const whitelistedSet = new Set();
    retros.forEach((r) => {
      if (Array.isArray(r.approvedMembers)) {
        r.approvedMembers.forEach((email) => whitelistedSet.add(email.toLowerCase().trim()));
      }
    });

    // 3. Aggregate registered members
    const memberMap = new Map();
    users.forEach((u) => {
      const emailLower = u.email.toLowerCase().trim();
      const isAdmin =
        u.role === 'admin' ||
        emailLower === 'gopalgohel249@gmail.com' ||
        String(u._id) === String(userId);

      const stats = projectStatsMap.get(emailLower) || { count: 0, roles: new Set(), names: [], isLead: false };
      const roleList = Array.from(stats.roles);
      const projectRole = isAdmin
        ? 'Admin'
        : roleList.length > 0
        ? roleList[0]
        : 'Developer';

      // Generate avatar initials
      const nameParts = (u.name || '').trim().split(/\s+/);
      const avatar = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : (u.name?.[0] || u.email[0]).toUpperCase();

      memberMap.set(emailLower, {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: isAdmin ? 'Facilitator & Admin' : 'Team Member',
        projectRole,
        projectsCount: stats.count,
        projectNames: stats.names,
        isPrimaryLead: stats.isLead || isAdmin,
        avatar,
        status: u.isVerified ? 'active' : 'pending',
        isWhitelisted: true,
        joinedAt: u.createdAt,
      });
    });

    // 4. Include project collaborators who may not have individual user accounts yet
    projects.forEach((proj) => {
      if (proj.lead?.email) {
        const emailLower = proj.lead.email.toLowerCase().trim();
        if (!memberMap.has(emailLower)) {
          const stats = projectStatsMap.get(emailLower);
          memberMap.set(emailLower, {
            id: `lead-${proj.lead.id || emailLower}`,
            name: proj.lead.name || emailLower.split('@')[0],
            email: proj.lead.email,
            role: 'Project Lead',
            projectRole: 'Project Lead',
            projectsCount: stats?.count || 1,
            projectNames: stats?.names || [proj.name || proj.key],
            status: 'active',
            isWhitelisted: true,
            isPrimaryLead: true,
            avatar: proj.lead.avatar || proj.lead.name?.slice(0, 2).toUpperCase() || 'L',
            joinedAt: new Date(),
          });
        }
      }

      if (Array.isArray(proj.members)) {
        proj.members.forEach((m) => {
          const emailLower = m.email?.toLowerCase().trim();
          if (!emailLower) return;
          if (!memberMap.has(emailLower)) {
            const stats = projectStatsMap.get(emailLower);
            memberMap.set(emailLower, {
              id: m.id || `member-${emailLower}`,
              name: m.name || emailLower.split('@')[0],
              email: m.email,
              role: m.role || 'Developer',
              projectRole: m.role || 'Developer',
              projectsCount: stats?.count || 1,
              projectNames: stats?.names || [proj.name || proj.key],
              status: 'active',
              isWhitelisted: true,
              isPrimaryLead: false,
              avatar: m.avatar || m.name?.slice(0, 2).toUpperCase() || 'M',
              joinedAt: m.joinedAt || new Date(),
            });
          }
        });
      }
    });

    // 5. Include any guest whitelisted emails not yet registered
    whitelistedSet.forEach((email) => {
      if (!memberMap.has(email)) {
        const stats = projectStatsMap.get(email) || { count: 0, roles: new Set(), names: [], isLead: false };
        memberMap.set(email, {
          id: `guest-${email}`,
          name: email.split('@')[0],
          email,
          role: 'Invited Contributor',
          projectRole: 'Developer',
          projectsCount: stats.count,
          projectNames: stats.names,
          isPrimaryLead: false,
          avatar: email.charAt(0).toUpperCase(),
          status: 'whitelisted',
          isWhitelisted: true,
          joinedAt: new Date(),
        });
      }
    });

    let allMembers = Array.from(memberMap.values());

    // 5. Apply search filtering if specified
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      allMembers = allMembers.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.role && m.role.toLowerCase().includes(q))
      );
    }

    // 6. Enterprise pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const totalItems = allMembers.length;
    const totalPages = Math.ceil(totalItems / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedMembers = allMembers.slice(startIndex, startIndex + limitNum);

    return {
      members: paginatedMembers,
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
   * Whitelists developer email to bypass waiting room across all facilitator retros
   * @param {string|ObjectId} userId - Facilitator user ID
   * @param {string} email - Developer email to whitelist
   * @returns {Promise<Object>} Whitelisted member record
   */
  async whitelistDeveloper(userId, email) {
    const cleanEmail = email.toLowerCase().trim();

    // Automatically append to all retrospective boards created by this facilitator
    await RetroBoard.updateMany(
      { createdBy: userId },
      { $addToSet: { approvedMembers: cleanEmail } }
    );

    return {
      email: cleanEmail,
      isWhitelisted: true,
    };
  }

  /**
   * Remove developer email from whitelisted contributor list across facilitator retros
   * @param {string|ObjectId} userId - Facilitator user ID
   * @param {string} email - Developer email to remove
   */
  async removeWhitelistMember(userId, email) {
    const cleanEmail = email.toLowerCase().trim();

    await Promise.all([
      RetroBoard.updateMany(
        { createdBy: userId },
        { $pull: { approvedMembers: cleanEmail } }
      ),
      Project.updateMany(
        {},
        { $pull: { members: { email: cleanEmail } } }
      ),
    ]);

    return {
      email: cleanEmail,
      removed: true,
    };
  }
}


export const membersService = new MembersService();
export default membersService;
