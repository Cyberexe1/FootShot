import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export type Role = 'staff' | 'organizer';

export interface AuthUser {
  role: Role;
  username?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies a signed JWT (issued by POST /api/auth/login after a bcrypt password
 * check) and resolves it to an authenticated user.
 */
function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as {
      role?: string;
      sub?: string;
    };
    if (payload.role === 'staff' || payload.role === 'organizer') {
      return { role: payload.role, username: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'ff26_session';

/** Requires a valid session; reads the JWT from the httpOnly cookie or, as a
 * fallback (API clients/tests), the Authorization bearer header. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  const token = cookieToken || bearer;
  if (!token) {
    return next(AppError.unauthorized('Missing session'));
  }
  const user = verifyToken(token);
  if (!user) {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
  req.user = user;
  next();
}

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
}
