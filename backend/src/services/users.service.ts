import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import type { Role } from '../middleware/auth.js';
import { usersRepo } from '../repositories/users.repo.js';

/**
 * Credentials store. Two built-in accounts (operator/organizer) come from
 * config; additional accounts are created via signup and persisted in the users
 * repository (DynamoDB in prod, in-memory in dev). Passwords are bcrypt hashes;
 * plaintext is never stored.
 */
const BCRYPT_COST = 10;
// A valid-format hash used for dummy compares to reduce timing side-channels.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8t8Q1sQf2lNvE0m1sQf2lNvE0m1sQ';

interface BuiltInUser {
  username: string;
  role: Role;
  passwordHash: string;
}

function buildBuiltIn(
  seed: { username: string; passwordHash: string | null; password: string },
  role: Role,
): BuiltInUser {
  const passwordHash = seed.passwordHash ?? bcrypt.hashSync(seed.password, BCRYPT_COST);
  if (!seed.passwordHash) {
    logger.warn({ role }, 'No password hash configured; hashing fallback password (dev only).');
  }
  return { username: seed.username, role, passwordHash };
}

const builtIns: BuiltInUser[] = [
  buildBuiltIn(config.auth.staff, 'staff'),
  buildBuiltIn(config.auth.organizer, 'organizer'),
];

export interface AuthenticatedUser {
  username: string;
  role: Role;
}

/** Verifies username/password against built-in accounts, then registered users. */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const builtIn = builtIns.find((u) => u.username === username);
  if (builtIn) {
    const ok = await bcrypt.compare(password, builtIn.passwordHash);
    return ok ? { username, role: builtIn.role } : null;
  }

  const user = await usersRepo.findByUsername(username);
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH); // constant-ish work
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { username: user.username, role: user.role } : null;
}

/**
 * Registers a new account (default role: staff). Rejects reserved/existing
 * usernames. Returns the authenticated user on success.
 */
export async function registerUser(
  username: string,
  password: string,
): Promise<AuthenticatedUser> {
  if (builtIns.some((u) => u.username === username)) {
    throw AppError.badRequest('Username is already taken', 'USERNAME_TAKEN');
  }
  const existing = await usersRepo.findByUsername(username);
  if (existing) {
    throw AppError.badRequest('Username is already taken', 'USERNAME_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await usersRepo.create({
    username,
    passwordHash,
    role: 'staff',
    createdAt: new Date().toISOString(),
  });
  return { username, role: 'staff' };
}
