import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export type Role = 'staff' | 'organizer';

export interface AuthUser {
  role: Role;
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
 * Resolves a bearer token to an authenticated user.
 *
 * Demo mode: static staff/organizer tokens from config. This is the tested
 * mechanism. In production this is where Cognito JWT verification plugs in
 * (config.auth.cognito) — verify the token and map Cognito groups to a role.
 */
function verifyToken(token: string): AuthUser | null {
  if (config.auth.cognito) {
    // Production path: verify the Cognito JWT and derive the role from groups.
    // Intentionally not enabled in the demo build; see architecture.md.
    return null;
  }
  if (token === config.auth.staffToken) return { role: 'staff' };
  if (token === config.auth.organizerToken) return { role: 'organizer' };
  return null;
}

/** Requires a valid bearer token; attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    return next(AppError.unauthorized('Missing bearer token'));
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
