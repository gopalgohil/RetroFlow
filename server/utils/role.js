import { isSuperAdmin } from '../config/admin.config.js';

const ADMIN_ROLES = new Set(['admin', 'workspace admin', 'superadmin', 'super_admin']);
const MANAGER_ROLES = new Set(['manager', 'project manager', 'scrum master']);
const LEAD_ROLES = new Set(['project lead', 'team lead', 'tech lead', 'lead']);

/**
 * Normalizes any role string to lowercase and trimmed format
 */
export const normalizeRole = (role) => (role || '').toString().toLowerCase().trim();

/**
 * Verifies if user holds Workspace Administrator privileges
 */
export const isAdminUser = (user) => {
  if (!user) return false;
  const email = (user.email || '').toString().toLowerCase().trim();
  const role = normalizeRole(user.role);
  const projectRole = normalizeRole(user.projectRole);

  return (
    ADMIN_ROLES.has(role) ||
    ADMIN_ROLES.has(projectRole) ||
    isSuperAdmin(email)
  );
};

/**
 * Verifies if user holds Manager privileges or higher
 */
export const isManagerUser = (user) => {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const role = normalizeRole(user.role);
  const projectRole = normalizeRole(user.projectRole);

  return (
    MANAGER_ROLES.has(role) ||
    MANAGER_ROLES.has(projectRole)
  );
};

/**
 * Verifies if user holds Project Lead / Manager privileges or higher
 */
export const isLeadOrManagerUser = (user) => {
  if (!user) return false;
  if (isManagerUser(user)) return true;

  const role = normalizeRole(user.role);
  const projectRole = normalizeRole(user.projectRole);

  return (
    LEAD_ROLES.has(role) ||
    LEAD_ROLES.has(projectRole)
  );
};

export default {
  normalizeRole,
  isAdminUser,
  isManagerUser,
  isLeadOrManagerUser,
};
