import User from '../models/User.js';
import RetroBoard from '../models/RetroBoard.js';
import Project from '../models/Project.js';
import { isSuperAdmin, getSuperAdminEmail } from '../config/admin.config.js';
import emailService from './email.service.js';
import env from '../config/env.js';

class MembersService {
  async getWorkspaceMembers(userId, { page = 1, limit = 10, search = '' } = {}) {

    const [users, projects] = await Promise.all([
      User.find(
        {
          $or: [
            { role: 'admin' },
            { email: getSuperAdminEmail() },
            { status: { $in: ['pending', 'approved'] } },
            { isApproved: true },
            { isVerified: true },
          ],
        },
        'name email role projectRole status isApproved createdAt isVerified hasLoggedIn'
      ).lean(),
      Project.find({}, 'name key members lead').lean(),
    ]);

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

    const memberMap = new Map();
    users.forEach((u) => {
      const emailLower = u.email.toLowerCase().trim();
      const isAdmin =
        u.role === 'admin' ||
        isSuperAdmin(emailLower);

      const stats = projectStatsMap.get(emailLower) || { count: 0, roles: new Set(), names: [], isLead: false };
      const roleList = Array.from(stats.roles);
      const projectRole = isAdmin
        ? 'Admin'
        : u.projectRole && u.projectRole !== 'Unassigned'
          ? u.projectRole
          : stats.isLead
            ? 'Project Lead'
            : roleList.length > 0
              ? roleList[0]
              : 'Developer';

      const nameParts = (u.name || '').trim().split(/\s+/);
      const avatar = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : (u.name?.[0] || u.email[0]).toUpperCase();

      if (!isAdmin && !u.isVerified) {
        return;
      }

      const isPending = !isAdmin && (u.status === 'pending' || (!u.isApproved && u.status !== 'rejected'));
      const memberStatus = isPending ? 'pending' : u.status === 'rejected' ? 'rejected' : 'active';

      if (memberStatus === 'rejected') {
        return;
      }

      memberMap.set(emailLower, {
        id: String(u._id),
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: isAdmin ? 'Admin' : 'Team Member',
        projectRole,
        projectsCount: stats.count,
        projectNames: stats.names,
        isPrimaryLead: isSuperAdmin(emailLower),
        avatar,
        status: memberStatus,
        isApproved: Boolean(isAdmin || u.isApproved || u.status === 'approved'),
        isWhitelisted: true,
        joinedAt: u.createdAt,
      });
    });

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
            isPrimaryLead: isSuperAdmin(emailLower),
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

    let allMembers = Array.from(memberMap.values());

    allMembers.sort((a, b) => {
      if (a.isPrimaryLead) return -1;
      if (b.isPrimaryLead) return 1;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
    });

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      allMembers = allMembers.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.role && m.role.toLowerCase().includes(q)) ||
          (m.projectRole && m.projectRole.toLowerCase().includes(q)) ||
          (m.status && m.status.toLowerCase().includes(q)) ||
          (Array.isArray(m.projectNames) && m.projectNames.some((p) => p && p.toLowerCase().includes(q)))
      );
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const totalItems = allMembers.length;
    const totalPages = Math.ceil(totalItems / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedMembers = allMembers.slice(startIndex, startIndex + limitNum);

    const pendingRequests = Array.from(memberMap.values()).filter(
      (m) => m.status === 'pending'
    );

    return {
      members: paginatedMembers,
      pendingRequests,
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

  async whitelistDeveloper(userId, email) {
    const cleanEmail = email.toLowerCase().trim();

    await RetroBoard.updateMany(
      { createdBy: userId },
      { $addToSet: { approvedMembers: cleanEmail } }
    );

    return {
      email: cleanEmail,
      isWhitelisted: true,
    };
  }

  async removeWhitelistMember(userId, email) {
    const cleanEmail = email.toLowerCase().trim();

    if (isSuperAdmin(cleanEmail)) {
      throw new Error('Primary Workspace Owner cannot be removed.');
    }

    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    const targetUser = await User.findOne({ email: emailRegex });
    if (targetUser && String(targetUser._id) === String(userId)) {
      throw new Error('You cannot remove your own account from the workspace.');
    }

    await Project.updateMany(
      { 'lead.email': emailRegex },
      {
        $set: {
          lead: {
            id: 'lead-primary',
            name: 'Workspace Lead',
            email: getSuperAdminEmail(),
            avatar: 'WL',
          },
        },
      }
    );

    await Promise.all([
      RetroBoard.updateMany(
        {},
        { $pull: { approvedMembers: emailRegex } }
      ),
      Project.updateMany(
        {},
        { $pull: { members: { email: emailRegex } } }
      ),
      User.deleteMany({ email: emailRegex }),
    ]);

    return {
      email: cleanEmail,
      removed: true,
    };
  }

  async updateMemberRole(userId, email, role) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = (role || 'Developer').trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw new Error(`User with email "${cleanEmail}" not found.`);
    }

    if (user.role === 'admin' || isSuperAdmin(cleanEmail)) {
      throw new Error('Admin role cannot be modified.');
    }

    user.projectRole = cleanRole;
    user.role = 'member';
    await user.save();

    await Project.updateMany(
      { 'members.email': cleanEmail },
      { $set: { 'members.$.role': cleanRole } }
    );

    const isDemoted = !['Manager', 'Project Lead'].includes(cleanRole);
    if (isDemoted) {
      await Project.updateMany(
        { 'lead.email': cleanEmail },
        {
          $set: {
            'lead.name': 'Workspace Lead',
            'lead.email': getSuperAdminEmail(),
            'lead.avatar': 'WL',
          },
        }
      );
    }

    return {
      email: cleanEmail,
      projectRole: cleanRole,
    };
  }

  async approveMember(adminUserId, emailOrId, assignedRole) {
    const cleanEmail = (emailOrId || '').toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    let user = await User.findOne({
      $or: [
        { email: emailRegex },
        ...(cleanEmail.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanEmail }] : []),
      ],
    });

    if (user) {
      user.status = 'approved';
      user.isApproved = true;
      user.isVerified = true;
      if (assignedRole && typeof assignedRole === 'string' && assignedRole.trim()) {
        user.projectRole = assignedRole.trim();
      }
      await user.save();
    }

    const targetEmail = user?.email || cleanEmail;

    await RetroBoard.updateMany(
      {},
      { $addToSet: { approvedMembers: targetEmail.toLowerCase().trim() } }
    );

    if (user) {
      const loginUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/login`;
      emailService.notifyUserApproved({
        user,
        role: user.projectRole || assignedRole || 'Developer',
        loginUrl,
      }).catch((err) => {
        console.error('[Brevo User Approval Notification Error]', err.message);
      });
      console.log(`\n📬 [User Approved Notification]: Dispatched approval email to ${user.email}\n`);
    }

    return {
      id: user?._id,
      email: targetEmail,
      name: user?.name || targetEmail.split('@')[0],
      projectRole: user?.projectRole || assignedRole || 'Developer',
      status: 'approved',
      isApproved: true,
    };
  }

  async rejectMember(adminUserId, emailOrId) {
    const cleanEmail = (emailOrId || '').toLowerCase().trim();

    if (isSuperAdmin(cleanEmail)) {
      throw new Error('Primary Workspace Owner cannot be rejected.');
    }

    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    const user = await User.findOne({
      $or: [
        { email: emailRegex },
        ...(cleanEmail.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanEmail }] : []),
      ],
    });

    if (user && user.role === 'admin') {
      throw new Error('Admin users cannot be rejected.');
    }

    if (user) {
      user.status = 'rejected';
      user.isApproved = false;
      await user.save();
    }

    const targetEmail = user?.email || cleanEmail;

    await Promise.all([
      RetroBoard.updateMany({}, { $pull: { approvedMembers: targetEmail.toLowerCase().trim() } }),
      Project.updateMany({}, { $pull: { members: { email: targetEmail.toLowerCase().trim() } } }),
    ]);

    emailService.notifyUserRejected({
      user: user || { email: targetEmail, name: targetEmail.split('@')[0] },
      contactEmail: getSuperAdminEmail(),
    }).catch((err) => {
      console.error('[Brevo User Rejection Notification Error]', err.message);
    });
    console.log(`\n📬 [User Rejected Notification]: Dispatched rejection email to ${targetEmail}\n`);

    return {
      id: user?._id,
      email: targetEmail,
      status: 'rejected',
      rejected: true,
    };
  }
}

export const membersService = new MembersService();
export default membersService;
