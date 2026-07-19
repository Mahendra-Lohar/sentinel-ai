import { query } from '../db/pool.js';

// Rate limiter state — in-memory, no Redis required
const requestCounts = new Map();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > 60000) {
      requestCounts.delete(key);
    }
  }
}

setInterval(cleanupOldEntries, 30000);

export function rateLimiter({ maxRequests = 100, windowMs = 60000, keyPrefix = 'general' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const current = requestCounts.get(key);

    if (!current || now - current.windowStart > windowMs) {
      requestCounts.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s.`,
        retryAfter: Math.ceil((current.windowStart + windowMs - now) / 1000)
      });
    }

    current.count += 1;
    return next();
  };
}

export const apiLimiter = rateLimiter({ maxRequests: 200, windowMs: 60000, keyPrefix: 'api' });
export const authLimiter = rateLimiter({ maxRequests: 10, windowMs: 60000, keyPrefix: 'auth' });
export const uploadLimiter = rateLimiter({ maxRequests: 20, windowMs: 60000, keyPrefix: 'upload' });
