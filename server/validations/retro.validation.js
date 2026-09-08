import { z } from 'zod';

const topicValidationSchema = z.object({
  topicId: z.string().optional(),
  title: z
    .string({ required_error: 'Topic title is required' })
    .trim()
    .min(1, 'Topic title cannot be empty')
    .max(100, 'Topic title must be under 100 characters'),
  description: z.string().trim().max(250).optional().default(''),
  icon: z.string().default('smile'),
  color: z.string().default('#10B981'),
  order: z.number().default(0),
});

export const createRetroSchema = z.object({
  title: z
    .string({ required_error: 'Session title is required' })
    .trim()
    .min(2, 'Session title must be at least 2 characters')
    .max(120, 'Session title must be under 120 characters'),
  description: z.string().trim().max(500).optional().default(''),
  scheduledDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'active', 'completed']).optional().default('active'),
  approvalRequired: z.boolean().optional().default(false),
  revealMode: z.boolean().optional().default(false),
  votingLimit: z.number().min(1).max(20).optional().default(5),
  backgroundTheme: z.enum(['sailboat', 'standard', 'space', 'mountain', 'minimal']).optional().default('standard'),
  topics: z.array(topicValidationSchema).min(1, 'At least one topic column is required'),
  approvedMembers: z.array(z.string().email('Invalid email')).optional().default([]),
});

export const updateRetroSchema = createRetroSchema.partial();

export const inviteTeammateSchema = z.object({
  email: z
    .string({ required_error: 'Developer email address is required' })
    .trim()
    .email('Please provide a valid email address'),
  message: z.string().trim().max(300).optional(),
});
