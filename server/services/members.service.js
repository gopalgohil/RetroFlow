import User from '../models/User.js';
import RetroBoard from '../models/RetroBoard.js';

/**
 * Members & Whitelist Service
 * Encapsulates workspace team roster business logic and whitelist permissions
 */
class MembersService {
  /**
   * Retrieves all registered workspace users and whitelisted contributors
   * @param {string|ObjectId} userId - Requesting facilitator ID
   * @returns {Promise<Array>} List of formatted workspace members
   */
  async getWorkspaceMembers(userId, { page = 1, limit = 5, search = '' } = {}) {
    // 1 & 2. Concurrently fetch registered workspace accounts and facilitator whitelist
    const [users, retros] = await Promise.all([
      User.find({}, 'name email role createdAt isVerified').lean(),
      RetroBoard.find({ createdBy: userId }, 'approvedMembers').lean(),
    ]);
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

      memberMap.set(emailLower, {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: isAdmin ? 'Facilitator & Admin' : 'Team Member',
        status: u.isVerified ? 'active' : 'pending',
        isWhitelisted: true,
        joinedAt: u.createdAt,
      });
    });

    // 4. Include any guest whitelisted emails not yet registered
    whitelistedSet.forEach((email) => {
      if (!memberMap.has(email)) {
        memberMap.set(email, {
          id: `guest-${email}`,
          name: email.split('@')[0],
          email,
          role: 'Invited Contributor',
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

    await RetroBoard.updateMany(
      { createdBy: userId },
      { $pull: { approvedMembers: cleanEmail } }
    );

    return {
      email: cleanEmail,
      removed: true,
    };
  }
}


export const membersService = new MembersService();
export default membersService;
