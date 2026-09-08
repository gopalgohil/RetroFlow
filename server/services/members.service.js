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
  async getWorkspaceMembers(userId) {
    // 1. Fetch registered workspace accounts
    const users = await User.find({}, 'name email role createdAt isVerified').lean();

    // 2. Fetch approved whitelisted emails from facilitator's retrospectives
    const retros = await RetroBoard.find({ createdBy: userId }, 'approvedMembers').lean();
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

    return Array.from(memberMap.values());
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
}

export const membersService = new MembersService();
export default membersService;
