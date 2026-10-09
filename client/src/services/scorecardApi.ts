import api from '@/lib/api';

export interface ApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface MemberRatingInput {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole?: string;
  ratings: {
    quality: number; // 1-5
    timeliness: number; // 1-5
    communication: number; // 1-5
    collaboration: number; // 1-5
  };
  feedback?: string;
}

export interface ScorecardContext {
  projectId?: string | null;
  projectKey?: string | null;
  retroId?: string | null;
  retroTitle?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
}

export interface MemberScorecardItem {
  memberId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  totalEvaluations: number;
  overallScore: number;
  breakdown: {
    quality: number;
    timeliness: number;
    communication: number;
    collaboration: number;
  };
  lastRatedAt: string | null;
  latestFeedback?: string;
  recentHistory?: any[];
}

export interface TeamScoreboardData {
  kpis: {
    teamAverageScore: number;
    totalMembers: number;
    totalRatedMembers: number;
    topPerformer: { name: string; score: number; role: string } | null;
    highestCategory: string;
  };
  members: MemberScorecardItem[];
  recentEvaluations: any[];
}

export class ScorecardApiService {
  /**
   * Submit performance ratings for one or more team members
   * POST /api/scorecards
   */
  static async submitScorecards(
    evaluations: MemberRatingInput[],
    context?: ScorecardContext
  ): Promise<any[]> {
    const res = await api.post<ApiResponseWrapper<any[]>>('/scorecards', {
      evaluations,
      context,
    });
    return res.data || [];
  }

  /**
   * Get Consolidated Team Scoreboard
   * GET /api/scorecards/scoreboard
   * Restricted to Workspace Admin Only
   */
  static async getTeamScoreboard(): Promise<TeamScoreboardData> {
    const res = await api.get<ApiResponseWrapper<TeamScoreboardData>>('/scorecards/scoreboard');
    return (
      res.data || {
        kpis: {
          teamAverageScore: 0,
          totalMembers: 0,
          totalRatedMembers: 0,
          topPerformer: null,
          highestCategory: 'Quality',
        },
        members: [],
        recentEvaluations: [],
      }
    );
  }
}

export default ScorecardApiService;
