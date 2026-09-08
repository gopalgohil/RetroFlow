import { z } from 'zod';

export const whitelistMemberSchema = z.object({
  email: z
    .string({ required_error: 'Developer email address is required' })
    .trim()
    .email('Please provide a valid email address'),
});
