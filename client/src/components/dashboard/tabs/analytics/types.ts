export interface ProjectOption {
  id: string;
  name: string;
  key: string;
  memberCount: number;
}

export interface RetroTrendItem {
  id: string;
  shareToken: string;
  title: string;
  sprintName: string;
  date: string;
  attendeesCount: number;
  expectedCount: number;
  attendanceRate: number;
  cardsCount: number;
  actionItemsCount: number;
}

export type EngagementStatus = 'Sprint Champion' | 'Active Contributor' | 'Needs Nudge';

export interface MemberAnalyticsItem {
  email: string;
  name: string;
  avatar: string;
  role: string;
  retrosAttended: number;
  totalEligibleRetros: number;
  attendanceRate: number;
  cardsShared: number;
  votesCast: number;
  actionItemsCount: number;
  lastAttendedTitle: string;
  lastAttendedDate: string | null;
  status: EngagementStatus;
}

export interface AnalyticsSummary {
  averageAttendanceRate: number;
  totalRetros: number;
  totalMembers: number;
  lowAttendanceCount: number;
  topContributor: {
    name: string;
    email: string;
    avatar: string;
    role: string;
    retrosAttended: number;
    attendanceRate: number;
    cardsShared: number;
  } | null;
}

export interface AnalyticsData {
  projects: ProjectOption[];
  selectedProjectId: string;
  selectedProjectName: string;
  summary: AnalyticsSummary;
  retroTrends: RetroTrendItem[];
  memberAnalytics: MemberAnalyticsItem[];
}

export type MemberStatusFilter = 'ALL' | 'CHAMPION' | 'ACTIVE' | 'NUDGE';
