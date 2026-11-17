import dotenv from 'dotenv';
dotenv.config();

export const getSuperAdminEmail = () => {
  return (process.env.SUPER_ADMIN_EMAIL || 'gopalg@internal.digiflux.io').toLowerCase().trim();
};

export const isSuperAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim() === getSuperAdminEmail();
};

export default {
  getSuperAdminEmail,
  isSuperAdmin,
};
