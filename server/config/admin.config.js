import dotenv from 'dotenv';
dotenv.config();

export const getSuperAdminEmail = () => {
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
  if (envEmail && (envEmail.endsWith('@digiflux.io') || envEmail.endsWith('@internal.digiflux.io'))) {
    return envEmail;
  }
  return 'gopalg@internal.digiflux.io';
};

export const isSuperAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim() === getSuperAdminEmail();
};

export default {
  getSuperAdminEmail,
  isSuperAdmin,
};
