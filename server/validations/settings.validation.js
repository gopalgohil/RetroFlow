import { z } from 'zod';

export const updateSettingsSchema = z.object({
  workspaceName: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(100).optional(),
  organizationName: z.string().trim().max(100).optional(),
  defaultVotingLimit: z.number().min(1, 'Minimum 1 vote required').max(20, 'Maximum 20 votes allowed').optional(),
  allowAnonymousFeedback: z.boolean().optional(),
  timerDefaultMinutes: z.number().min(1).max(60).optional(),
  enableSlackNotifications: z.boolean().optional(),
});
