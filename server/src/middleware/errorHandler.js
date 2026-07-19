import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(error, _req, res, _next) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }

  const status = error.status || 500;
  
  // Custom API errors
  if (error.isOperational) {
    return res.status(status).json({ error: error.message });
  }

  // Database errors (Postgres)
  if (error.code && error.code.length === 5) {
    console.error('Database Error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Resource already exists' });
    }
    return res.status(500).json({ error: 'Database operation failed' });
  }

  // Fallback for unexpected errors
  if (status === 500) {
    console.error('Unhandled Error:', error);
  }

  const message = (status === 500 && env.nodeEnv === 'production') 
    ? 'Internal server error' 
    : error.message;

  res.status(status).json({ error: message, stack: env.nodeEnv === 'development' ? error.stack : undefined });
}
