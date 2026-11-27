import { z } from 'zod';
import { isAllowedCompanyEmail } from './auth.js';

export const whitelistMemberSchema = z.object({
  email: z
    .string({ required_error: 'Developer email address is required' })
    .trim()
    .email('Please provide a valid email address')
    .refine((val) => isAllowedCompanyEmail(val), {
      message: 'Only official @digiflux.io or @internal.digiflux.io emails can be whitelisted',
    }),
});

export const updateMemberRoleSchema = z.object({
  role: z.string({ required_error: 'Role is required' }).trim().min(1, 'Role cannot be empty'),
});
