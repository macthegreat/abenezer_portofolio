import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/errors.js';
import { getEnv } from '../utils/env.js';

const env = getEnv();

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(unauthorized('Missing token.'));
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return next(unauthorized('Invalid token.'));
  }
}
