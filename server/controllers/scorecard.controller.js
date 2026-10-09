import { asyncHandler } from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { scorecardService } from '../services/scorecard.service.js';

class ScorecardController {
  /**
   * Submit star ratings for team members
   * POST /api/scorecards
   */
  submitScorecards = asyncHandler(async (req, res) => {
    const { evaluations, context } = req.body;
    const result = await scorecardService.submitScorecards(evaluations, context, req.user);
    return ApiResponse.created(res, result, 'Scorecards submitted successfully');
  });

  /**
   * Get Consolidated Team Scoreboard
   * GET /api/scorecards/scoreboard
   * Restricted to Workspace Admin Only
   */
  getTeamScoreboard = asyncHandler(async (req, res) => {
    const scoreboard = await scorecardService.getTeamScoreboard(req.user);
    return ApiResponse.ok(res, scoreboard, 'Team scoreboard retrieved successfully');
  });
}

export const scorecardController = new ScorecardController();
export default scorecardController;
