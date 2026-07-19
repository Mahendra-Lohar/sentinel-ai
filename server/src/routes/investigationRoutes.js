import multer from 'multer';
import { Router } from 'express';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as investigations from '../controllers/investigationController.js';
import * as evidence from '../controllers/evidenceController.js';
import { chatRoutes } from './chatRoutes.js';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExts = [
      // Text / Logs
      'log', 'txt', 'md', 'markdown', 'sh', 'yaml', 'yml', 'toml',
      // Data
      'json', 'csv', 'xml', 'html',
      // Images (for Vision Agent)
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp',
      // Archives
      'zip',
    ];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error(`File type not supported: .${ext}. Allowed: ${allowedExts.join(', ')}`);
      err.status = 400;
      cb(err);
    }
  }
});

export const investigationRoutes = Router();

investigationRoutes.use(requireAuth);

// CRUD
investigationRoutes.get('/', asyncHandler(investigations.list));
investigationRoutes.post('/', asyncHandler(investigations.create));
investigationRoutes.get('/:id', asyncHandler(investigations.get));
investigationRoutes.delete('/:id', asyncHandler(investigations.remove));

// AEGIS Engine
investigationRoutes.post('/:id/launch', asyncHandler(investigations.launch));
investigationRoutes.get('/:id/results', asyncHandler(investigations.results));

// Demo evidence loader — loads REAL files from demo-data/, treats them as real evidence
investigationRoutes.post('/:id/load-demo/:scenarioId', asyncHandler(investigations.loadDemo));
investigationRoutes.post('/:id/load-demo', asyncHandler(investigations.loadDemo));

// External Integrations
investigationRoutes.post('/:id/dispatch', asyncHandler(investigations.dispatchIntegration));

// Evidence upload — runs parse→classify pipeline automatically
investigationRoutes.post('/:id/evidence', uploadLimiter, upload.array('files', 20), asyncHandler(evidence.upload));
investigationRoutes.get('/:id/evidence', asyncHandler(evidence.list));

// AI Chat
investigationRoutes.use('/:id/chat', chatRoutes);
