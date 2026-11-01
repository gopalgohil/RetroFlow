import { Router } from 'express';
import authRoutes from './auth.routes.js';
import retroRoutes from './retro.routes.js';
import membersRoutes from './members.routes.js';
import settingsRoutes from './settings.routes.js';
import projectRoutes from './project.routes.js';
import scorecardRoutes from './scorecard.routes.js';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', checkHealth);

router.use('/auth', authRoutes);

router.use('/retros', retroRoutes);

router.use('/members', membersRoutes);

router.use('/settings', settingsRoutes);

router.use('/projects', projectRoutes);

router.use('/scorecards', scorecardRoutes);

export default router;
