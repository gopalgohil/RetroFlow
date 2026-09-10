/**
 * @file retro.ts
 * @description TypeScript interface definitions for Retrospective Sessions & Topics
 */

export interface RetroTopic {
  topicId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export interface RetroCard {
  cardId: string;
  topicId: string;
  text: string;
  author: string;
  authorEmail?: string;
  votes: number;
  voters?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StickyCard extends RetroCard {
  id: string;
  hasVoted?: boolean;
}

export interface RetroBoard {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  status: 'draft' | 'active' | 'completed';
  shareToken: string;
  approvalRequired: boolean;
  revealMode: boolean;
  votingLimit: number;
  backgroundTheme: 'sailboat' | 'standard' | 'space' | 'mountain' | 'minimal';
  topics: RetroTopic[];
  cards?: RetroCard[];
  approvedMembers: string[];
  projectId?: string;
  projectKey?: string;
  sprintId?: string;
  sprintName?: string;
  isProjectScoped?: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  project?: {
    lead?: { name: string; email: string; avatar?: string };
    members?: Array<{ id?: string; name: string; email: string; role: string; avatar?: string }>;
    key?: string;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRetroPayload {
  title: string;
  description?: string;
  scheduledDate?: string;
  status?: 'draft' | 'active' | 'completed';
  approvalRequired?: boolean;
  revealMode?: boolean;
  votingLimit?: number;
  backgroundTheme?: 'sailboat' | 'standard' | 'space' | 'mountain' | 'minimal';
  topics: RetroTopic[];
  approvedMembers?: string[];
  projectId?: string;
  projectKey?: string;
  sprintId?: string;
  sprintName?: string;
  isProjectScoped?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'whitelisted';
  isWhitelisted: boolean;
  joinedAt: string;
}

export interface WorkspaceSettingsData {
  _id?: string;
  userId?: string;
  workspaceName: string;
  organizationName: string;
  defaultVotingLimit: number;
  allowAnonymousFeedback: boolean;
  timerDefaultMinutes: number;
  enableSlackNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

