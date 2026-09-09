import { Router } from 'express';
import authRoutes from './auth.routes.js';
import retroRoutes from './retro.routes.js';
import membersRoutes from './members.routes.js';
import settingsRoutes from './settings.routes.js';
import projectRoutes from './project.routes.js';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

// Health Check Endpoint (Diagnostics & Monitoring)
router.get('/health', checkHealth);

// Authentication Module Endpoints
router.use('/auth', authRoutes);

// Retrospective Sessions Module Endpoints
router.use('/retros', retroRoutes);

// Workspace Team Members & Whitelist Endpoints
router.use('/members', membersRoutes);

// Workspace Settings Endpoints
router.use('/settings', settingsRoutes);

// Agile Project Management Module Endpoints
router.use('/projects', projectRoutes);

export default router;
