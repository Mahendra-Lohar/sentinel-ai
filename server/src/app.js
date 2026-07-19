import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { authRoutes } from './routes/authRoutes.js';
import { investigationRoutes } from './routes/investigationRoutes.js';
import { statsRoutes } from './routes/statsRoutes.js';

// Demo incident packs metadata (not scenario logic — just names/descriptions for UI)
export const DEMO_PACKS = [
  { id: 'incident-01-redis-timeout', title: 'Redis Memory Exhaustion', severity: 'P1', category: 'Cache', description: 'App logs, metrics CSV, deployment JSON, and runbook MD' },
  { id: 'incident-02-db-connection-pool', title: 'Database Connection Pool Exhaustion', severity: 'P0', category: 'Database', description: 'Postgres slow query logs and connection metrics' },
  { id: 'incident-03-payment-gateway', title: 'Payment Gateway Timeout', severity: 'P0', category: 'Payments', description: 'Payment service logs and gateway error responses' },
  { id: 'incident-04-dns-failure', title: 'DNS Resolution Failure', severity: 'P1', category: 'Network', description: 'DNS error logs and network diagnostics' },
  { id: 'incident-05-ssl-expiration', title: 'SSL Certificate Expiration', severity: 'P1', category: 'Security', description: 'SSL error logs and certificate metadata' },
];

export function createApp() {
  const app = express();

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '4mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Health check (no rate limit)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'sentinel-ai-api',
      version: '2.0.0',
      mode: 'generic-investigation-engine',
      aiEngine: process.env.OPENAI_API_KEY ? 'openai-gpt-4.1' : 'aegis-heuristic'
    });
  });

  // Demo packs metadata (only names + descriptions for UI — NOT the investigation data)
  app.get('/api/demo-packs', (_req, res) => {
    res.json({ demoPacks: DEMO_PACKS });
  });

  // Rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api', apiLimiter);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/investigations', investigationRoutes);
  app.use('/api/stats', statsRoutes);

  app.use(errorHandler);
  return app;
}
