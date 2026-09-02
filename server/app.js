import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, seedDemoStudents, checkDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import eventRoutes from './routes/events.js';
import permissionRoutes from './routes/permissions.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import { logger } from './logger.js';

seedDemoStudents();
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.APP_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) => {
  const healthy = checkDatabase();
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', database: healthy ? 'ok' : 'error' });
});
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', (err, req, res, _next) => {
  logger.error('Unhandled API error', { error: err.message, route: req.path });
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});
const root = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(root, '..')));
app.get('/*splat', (_req, res) => res.sendFile(path.join(root, '..', 'index.html')));
export { app, db };
