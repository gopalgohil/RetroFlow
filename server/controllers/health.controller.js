import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import database from '../config/db.js';
import env from '../config/env.js';

/**
 * Health & Diagnostics Controller
 */
export const checkHealth = asyncHandler(async (req, res) => {
  const dbStatus = database.getConnectionState();

  const healthData = {
    service: 'RetroFlow Backend API',
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: env.NODE_ENV || 'development',
    database: {
      ...dbStatus,
      isHealthy: dbStatus.state === 1,
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  };

  return ApiResponse.ok(res, healthData, 'RetroFlow API is running healthy');
});
