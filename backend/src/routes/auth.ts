import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
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

/** POST /api/auth/login — verify credentials with bcrypt and issue a JWT. */
authRouter.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await verifyCredentials(username, password);
    if (!user) {
      throw AppError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
    }
    res.status(200).json({ token: issueToken(user), role: user.role, username: user.username });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/signup — create an account (bcrypt-hashed) and issue a JWT. */
authRouter.post('/auth/signup', async (req, res, next) => {
  try {
    const { username, password } = signupSchema.parse(req.body);
    const user = await registerUser(username, password);
    res.status(201).json({ token: issueToken(user), role: user.role, username: user.username });
  } catch (err) {
    next(err);
  }
});
