import dotenv from 'dotenv';
dotenv.config();

export const getSuperAdminEmail = () => {
  return (process.env.SUPER_ADMIN_EMAIL || 'gopalgohel249@gmail.com').toLowerCase().trim();
};

export const isSuperAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim() === getSuperAdminEmail();
};

export default {
  getSuperAdminEmail,
  isSuperAdmin,
};
