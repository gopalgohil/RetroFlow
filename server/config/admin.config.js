import dotenv from 'dotenv';
dotenv.config();

export const getSuperAdminEmail = () => {
  return (process.env.SUPER_ADMIN_EMAIL || 'gopalgohel249@gmail.com').toLowerCase().trim();
};

export const isSuperAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.toLowerCase().trim();
  return clean === getSuperAdminEmail() || clean === 'gopalg@internal.digiflux.io';
};

export default {
  getSuperAdminEmail,
  isSuperAdmin,
};
