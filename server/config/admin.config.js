import dotenv from 'dotenv';
dotenv.config();

/**
 * Retrieves the super administrator email configured in environment variables.
 * Defaults to 'gopalgohel249@gmail.com' if not explicitly defined.
 */
export const getSuperAdminEmail = () => {
  return (process.env.SUPER_ADMIN_EMAIL || 'gopalgohel249@gmail.com').toLowerCase().trim();
};

/**
 * Helper to safely verify whether a given email matches the designated workspace super admin.
 * @param {string} email
 * @returns {boolean}
 */
export const isSuperAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim() === getSuperAdminEmail();
};

export default {
  getSuperAdminEmail,
  isSuperAdmin,
};
