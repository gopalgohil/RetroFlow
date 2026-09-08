import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import database from './config/db.js';
import routes from './routes/index.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();
const PORT = env.PORT || 5000;

// 1. Security & Protection Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS) Configuration (Vercel & Production Ready)
const clientOrigins = (env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''));

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...clientOrigins,
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, or mobile requests with no origin
      if (!origin) return callback(null, true);

      // Allow configured domains, localhost, or any vercel.app deployment preview
      if (
        allowedOrigins.has(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      // Default allow with origin reflection for seamless team access
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// 3. Body & Cookie Parsing with payload limits
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(requestLogger);

// 4. Rate Limiting for general endpoints
app.use('/api', generalLimiter);

// 5. Mount API Routes
app.use('/api', routes);

// Root Index Route
app.get('/', (req, res) => {
  res.json({
    service: 'RetroFlow Backend API',
    status: 'Operational',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 6. 404 Catch-All Route
app.use((req, res, next) => {
  next(ApiError.notFound(`Resource not found - ${req.method} ${req.originalUrl}`));
});

// 7. Centralized Global Error Handler Middleware
app.use(errorHandler);

// 8. Bootstrap Server & Establish Database Connection
let server;

const startServer = async () => {
  // Connect to MongoDB Atlas with connection pooling
  await database.connect();

  server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` 🚀 RetroFlow Enterprise API Server Operational`);
    console.log(` 📡 Port: ${PORT}`);
    console.log(` 🌍 Environment: ${env.NODE_ENV || 'development'}`);
    console.log(` 🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
};

// 9. Graceful Shutdown Handlers (SIGTERM, SIGINT)
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      await database.disconnect();
      console.log('[Server] Graceful shutdown completed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 10. Process Safety & Exception Guards
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  gracefulShutdown('uncaughtException');
});

startServer();

export default app;
