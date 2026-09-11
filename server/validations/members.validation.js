import { z } from 'zod';

export const whitelistMemberSchema = z.object({
  email: z
    .string({ required_error: 'Developer email address is required' })
    .trim()
    .email('Please provide a valid email address'),
});

export const updateMemberRoleSchema = z.object({
  role: z.string({ required_error: 'Role is required' }).trim().min(1, 'Role cannot be empty'),
});
