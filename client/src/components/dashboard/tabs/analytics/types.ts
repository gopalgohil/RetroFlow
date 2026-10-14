export interface ProjectOption {
  id: string;
  name: string;
  key: string;
  memberCount: number;
}

export interface RetroAssignee {
  name: string;
  email: string | null;
  avatar: string;
}

export interface RetroActionItemDetail {
  id: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | string;
  assignedToName: string | null;
  assignedToEmail: string | null;
  assignedDate: string | null;
  dueDate: string | null;
  author: string | null;
  managerName?: string | null;
  givenBy?: string | null;
}

export interface RetroTrendItem {
  id: string;
  shareToken: string;
  title: string;
  sprintName: string;
  projectKey?: string;
  projectName?: string;
  date: string;
  startDate?: string | null;
  endDate?: string | null;
  year?: number;
  status?: string;
  attendeesCount: number;
  expectedCount: number;
  attendanceRate: number;
  cardsCount: number;
  actionItemsCount: number;
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  todoTasks?: number;
  pendingTasks?: number;
  completionRate?: number;
  assignees?: RetroAssignee[];
  managerName?: string | null;
  manager?: RetroAssignee | null;
  actionItems?: RetroActionItemDetail[];
}

export type EngagementStatus = 'Consistent' | 'Active' | 'Low Attendance';

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

export interface MonthlyRetroSessionItem {
  id: string;
  title: string;
  date: string;
  tasksCount: number;
  completedCount: number;
  pendingCount: number;
}

export interface MonthlyRetroBarData {
  month: string;
  monthFull: string;
  monthIndex: number;
  retrosCount: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  sessions: MonthlyRetroSessionItem[];
}

export interface YearAnalyticsSummary {
  year: number;
  totalRetros: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

export interface AnalyticsSummary {
  averageAttendanceRate: number;
  totalRetros: number;
  allTimeRetros?: number;
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  completionRate?: number;
  selectedYear?: number;
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
  availableYears?: number[];
  selectedYear?: number;
  selectedProjectId: string;
  selectedProjectName: string;
  summary: AnalyticsSummary;
  retroTrends: RetroTrendItem[];
  retroActionAnalytics?: RetroTrendItem[];
  monthlyTrends?: MonthlyRetroBarData[];
  yearSummary?: YearAnalyticsSummary;
  memberAnalytics: MemberAnalyticsItem[];
}

export type MemberStatusFilter = 'ALL' | 'CONSISTENT' | 'ACTIVE' | 'LOW';
