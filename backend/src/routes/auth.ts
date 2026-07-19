import { Router, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import { SESSION_COOKIE } from '../middleware/auth.js';
import {
  registerUser,
  verifyCredentials,
  type AuthenticatedUser,
} from '../services/users.service.js';

export const authRouter = Router();

function issueToken(user: AuthenticatedUser): string {
  return jwt.sign({ role: user.role }, config.auth.jwtSecret, {
    subject: user.username,
    expiresIn: config.auth.jwtExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Sets the session JWT as an httpOnly cookie. SameSite=Strict + Secure (in prod)
 * is the CSRF defense: the cookie is only sent on same-site requests, so a
 * cross-site page cannot ride the user's session. httpOnly keeps the token out
 * of JavaScript (XSS-resistant).
 */
function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  });
}

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dot, dash, underscore'),
  password: z.string().min(8).max(200),
});

/** POST /api/auth/login — verify credentials with bcrypt, set session cookie. */
authRouter.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await verifyCredentials(username, password);
    if (!user) {
      throw AppError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
    }
    const token = issueToken(user);
    setSessionCookie(res, token);
    res.status(200).json({ token, role: user.role, username: user.username });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/signup — create an account (bcrypt), set session cookie. */
authRouter.post('/auth/signup', async (req, res, next) => {
  try {
    const { username, password } = signupSchema.parse(req.body);
    const user = await registerUser(username, password);
    const token = issueToken(user);
    setSessionCookie(res, token);
    res.status(201).json({ token, role: user.role, username: user.username });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/logout — clear the session cookie. */
authRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(200).json({ ok: true });
});
