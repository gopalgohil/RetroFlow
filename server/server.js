import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
import { initRetroSocket } from './sockets/retro.socket.js';
import cronService from './services/cron.service.js';

const app = express();
const httpServer = createServer(app);
const PORT = env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const clientOrigins = (env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''));

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...clientOrigins,
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  if (
    allowedOrigins.has(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.includes('retro-flow') ||
    origin.includes('digiflux')
  ) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Request rejected from unauthorized origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-email',
      'x-user-role',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma',
      'Expires',
    ],
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(requestLogger);

app.use('/api', generalLimiter);

app.use('/api', routes);
app.use('/', routes);

app.get('/', (req, res) => {
  res.json({
    service: 'RetroFlow Backend API',
    status: 'Operational',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.use((req, res, next) => {
  next(ApiError.notFound(`Resource not found - ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  pingTimeout: 30000,
  pingInterval: 15000,
});

app.set('io', io);
initRetroSocket(io);

let server;

const startServer = async () => {
  await database.connect();

  cronService.initMonthlyRetroCron(io);

  server = httpServer.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` 🚀 RetroFlow Enterprise API Server Operational`);
    console.log(` 📡 Port: ${PORT}`);
    console.log(` ⚡ Real-Time Engine: Socket.io active (/retro)`);
    console.log(` 🌍 Environment: ${env.NODE_ENV || 'development'}`);
    console.log(` 🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
  if (cronService) {
    cronService.stopCron();
  }
  if (io) {
    io.close();
  }
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP and WebSocket connections closed.');
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

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  gracefulShutdown('uncaughtException');
});

startServer();

export default app;
