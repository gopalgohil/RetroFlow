/**
 * @file project.ts
 * @description TypeScript interface definitions for RetroFlow Pro Project Management Module
 */

export type ProjectType = 'scrum' | 'kanban';
export type SprintCadence = '1_week' | '2_weeks' | '3_weeks' | 'custom';
export type ProjectHealthStatus = 'on_track' | 'at_risk' | 'delayed';
export type ProjectMemberRole = 'Manager' | 'Developer' | 'QA' | 'QA / Tester' | 'DevOps' | 'Project Lead';

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
  avatar?: string;
  joinedAt?: string;
}

export interface BacklogItem {
  id: string;
  projectId?: string | null;
  sprintId?: string | null; // null means in project backlog
  title: string;
  description?: string;
  type: 'story' | 'task' | 'bug' | 'action_item';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string | null;
  storyPoints?: number;
  assignee?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  sourceRetroId?: string;
  sourceRetroTitle?: string;
  createdAt: string;
}

export interface EnrichedActionItem extends BacklogItem {
  projectKey?: string;
  projectName?: string;
  sprintName?: string;
  sprintStatus?: string;
  sourceRetroShareToken?: string;
  isDirectRetroCard?: boolean;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  number: number;
  status: 'active' | 'upcoming' | 'completed';
  startDate: string;
  endDate: string;
  goal: string;
  daysLeft: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  openBlockers: number;
  items: BacklogItem[];
  retrospectiveId?: string;
}

export interface ProjectRetroLink {
  id: string;
  shareToken: string;
  title: string;
  scheduledDate: string;
  status: 'active' | 'completed' | 'draft';
  sprintName?: string;
  topicsCount: number;
  cardsCount: number;
  actionItemsCount: number;
  actionItemsExported?: boolean;
}

export interface VelocityMetric {
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  type: ProjectType;
  healthStatus: ProjectHealthStatus;
  cadence: SprintCadence;
  customCadenceDays?: number;
  isArchived?: boolean;
  lead: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  members: ProjectMember[];
  activeSprint?: Sprint;
  sprints: Sprint[];
  retrospectives: ProjectRetroLink[];
  velocityHistory: VelocityMetric[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
  type: ProjectType;
  leadId?: string;
  lead?: {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members: Array<{
    name: string;
    email: string;
    role: ProjectMemberRole;
  }>;
  cadence: SprintCadence;
  customCadenceDays?: number;
}
