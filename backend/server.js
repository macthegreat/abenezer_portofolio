import crypto from 'node:crypto';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import commonRoutes from './routes/commonRoutes.js';
import { AppError, mapDatabaseError, notFound } from './utils/errors.js';
import { getEnv } from './utils/env.js';
import { securityMiddleware } from './middleware/security.js';
import { query } from './database/connection.js';

dotenv.config();

const env = getEnv();
const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
});
app.use(morgan(env.logFormat));
app.use(express.json({ limit: '200kb' }));
app.use(...securityMiddleware());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (error) {
    next(error);
  }
});

app.use('/auth', authRoutes);
app.use('/supervisor', supervisorRoutes);
app.use('/officer', officerRoutes);
app.use('/agent', agentRoutes);
app.use('/lookup', commonRoutes);

app.use((_req, _res, next) => next(notFound('Route not found.')));

app.use((err, req, res, _next) => {
  const dbError = mapDatabaseError(err);
  const knownError = err instanceof AppError ? err : dbError;

  if (knownError) {
    return res.status(knownError.statusCode).json({
      message: knownError.message,
      details: knownError.details || undefined,
      requestId: req.requestId
    });
  }

  console.error(err);
  return res.status(500).json({ message: 'Unexpected server error.', requestId: req.requestId });
});

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});

function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
