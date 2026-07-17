import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { Role } from '../middleware/auth.js';

/** Builds an Authorization header with a valid JWT for the given role. */
export function bearer(role: Role): string {
  const token = jwt.sign({ role }, config.auth.jwtSecret, {
    subject: role === 'staff' ? config.auth.staff.username : config.auth.organizer.username,
    expiresIn: '1h',
  });
  return `Bearer ${token}`;
}
