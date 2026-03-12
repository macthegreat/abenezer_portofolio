import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

function parseOrigins(value) {
  if (!value || value.trim() === '*') return '*';
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export function securityMiddleware() {
  const corsOrigins = parseOrigins(process.env.CORS_ORIGINS || '*');
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX || 300);

  return [
    helmet(),
    cors({
      origin: corsOrigins,
      credentials: true
    }),
    rateLimit({
      windowMs,
      max: maxRequests,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        message: 'Too many requests from this IP. Please try again later.'
      }
    })
  ];
}
