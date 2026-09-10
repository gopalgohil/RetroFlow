import { z } from 'zod';

const memberInputSchema = z.object({
  name: z
    .string({ required_error: 'Member name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be under 80 characters'),
  email: z
    .string({ required_error: 'Member email is required' })
    .trim()
    .email('Please provide a valid work email'),
  role: z.enum(['Manager', 'Developer', 'QA', 'Viewer']).default('Developer'),
});

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(120, 'Project name must be under 120 characters'),
  key: z
    .string({ required_error: 'Project key is required' })
    .trim()
    .min(2, 'Key must be at least 2 characters')
    .max(8, 'Key must be at most 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Key must be alphanumeric'),
  description: z.string().trim().max(1000).optional().default(''),
  type: z.enum(['scrum', 'kanban']).default('scrum'),
  cadence: z.enum(['1_week', '2_weeks', '3_weeks', 'custom']).default('2_weeks'),
  customCadenceDays: z.coerce.number().min(1).max(90).optional(),
  leadId: z.string().optional(),
  lead: z
    .object({
      id: z.string().optional(),
      name: z.string().min(2, 'Lead name is required'),
      email: z.string().email('Valid lead email is required'),
      avatar: z.string().optional(),
    })
    .optional(),
  members: z.array(memberInputSchema).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(['scrum', 'kanban']).optional(),
  cadence: z.enum(['1_week', '2_weeks', '3_weeks', 'custom']).optional(),
  customCadenceDays: z.coerce.number().min(1).max(90).optional(),
  healthStatus: z.enum(['on_track', 'at_risk', 'delayed']).optional(),
});

export const addMemberSchema = memberInputSchema;

export const exportActionItemsSchema = z.object({
  sprintId: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z
          .string({ required_error: 'Action item title is required' })
          .trim()
          .min(2, 'Action item must be at least 2 characters'),
        description: z.string().trim().optional().default(''),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('high'),
        storyPoints: z.number().min(0).max(100).optional().default(3),
        assignee: z
          .object({
            name: z.string(),
            avatar: z.string().optional(),
          })
          .optional(),
        sourceRetroId: z.string().optional(),
        sourceRetroTitle: z.string().optional(),
      })
    )
    .min(1, 'At least one action item is required for export'),
});

export const updateSprintItemStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done'], {
    required_error: 'Item status must be one of: todo, in_progress, done',
  }),
});
