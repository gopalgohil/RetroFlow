import express from 'express';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import { scorecardController } from '../controllers/scorecard.controller.js';

const router = express.Router();

/**
 * @route   POST /api/scorecards
 * @desc    Submit star ratings for team members
 * @access  Private (Admin & Manager)
 */
router.post('/', protect, scorecardController.submitScorecards);

/**
 * @route   GET /api/scorecards/scoreboard
 * @desc    Get Team Scoreboard analytics and member ratings
 * @access  Private (Admin Only)
 */
router.get('/scoreboard', protect, requireAdmin, scorecardController.getTeamScoreboard);

export default router;
