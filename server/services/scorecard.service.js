// Scorecard service returns clean in-memory responses without creating a MongoDB collection.

class ScorecardService {
  async submitScorecards(evaluations = [], context = {}, currentUser = null) {
    return [];
  }

  async getTeamScoreboard(currentUser = null) {
    return {
      members: [],
      stats: { totalEvaluations: 0, averageScore: 0 },
      recentEvaluations: [],
    };
  }
}

export const scorecardService = new ScorecardService();
export default scorecardService;
