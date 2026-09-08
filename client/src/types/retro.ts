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
  approvedMembers: string[];
  createdBy?: {
    _id: string;
    name: string;
    email: string;
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

