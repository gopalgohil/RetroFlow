import { z } from 'zod';
import { emailValidation } from './auth.js';

const topicValidationSchema = z.object({
  topicId: z.string().optional(),
  title: z
    .string({ required_error: 'Topic title is required' })
    .trim()
    .min(1, 'Topic title cannot be empty')
    .max(60, 'Topic title cannot exceed 60 characters'),
  description: z.string().trim().max(250).optional().default(''),
  icon: z.string().default('smile'),
  color: z.string().default('#10B981'),
  order: z.number().default(0),
});

const baseRetroSchema = z.object({
  title: z
    .string({ required_error: 'Session title is required' })
    .trim()
    .min(2, 'Session title must be at least 2 characters')
    .max(120, 'Session title must be under 120 characters'),
  description: z.string().trim().max(500).optional().default(''),
  scheduledDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  status: z.enum(['draft', 'active', 'completed']).optional().default('active'),
  approvalRequired: z.boolean().optional().default(false),
  revealMode: z.boolean().optional().default(false),
  votingLimit: z.number().min(1).max(20).optional().default(1),
  backgroundTheme: z.enum(['sailboat', 'standard', 'space', 'mountain', 'minimal']).optional().default('standard'),
  topics: z
    .array(topicValidationSchema)
    .min(1, 'At least one topic column is required')
    .max(6, 'Maximum 6 topic columns are allowed'),
  approvedMembers: z.array(emailValidation).optional().default([]),
  projectId: z.string().optional().nullable(),
  projectKey: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  sprintName: z.string().optional().nullable(),
  isProjectScoped: z.boolean().optional().default(true),
});

export const createRetroSchema = baseRetroSchema.refine(
  (data) => {
    if (data.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(data.startDate);
      start.setHours(0, 0, 0, 0);
      if (start < today) {
        return false;
      }
    }
    if (data.startDate && data.endDate) {
      return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    }
    return true;
  },
  {
    message: 'Starting date cannot be in the past, and ending date cannot be earlier than starting date.',
    path: ['endDate'],
  }
);

export const updateRetroSchema = baseRetroSchema.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    }
    return true;
  },
  {
    message: 'Ending date cannot be earlier than starting date.',
    path: ['endDate'],
  }
);

export const inviteTeammateSchema = z.object({
  email: emailValidation,
  message: z.string().trim().max(300).optional(),
});
