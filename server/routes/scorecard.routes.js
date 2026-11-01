import express from 'express';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import { scorecardController } from '../controllers/scorecard.controller.js';

const router = express.Router();

router.post('/', protect, scorecardController.submitScorecards);

router.get('/scoreboard', protect, requireAdmin, scorecardController.getTeamScoreboard);

export default router;
