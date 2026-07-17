import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import type { Role } from '../middleware/auth.js';

export interface StoredUser {
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface UsersRepository {
  findByUsername(username: string): Promise<StoredUser | null>;
  /** Creates a user; throws USERNAME_TAKEN if it already exists. */
  create(user: StoredUser): Promise<void>;
}

/** In-memory store for signed-up users (local dev / demo / tests). */
class InMemoryUsersRepo implements UsersRepository {
  private store = new Map<string, StoredUser>();

  async findByUsername(username: string): Promise<StoredUser | null> {
    return this.store.get(username) ?? null;
  }

  async create(user: StoredUser): Promise<void> {
    if (this.store.has(user.username)) {
      throw AppError.badRequest('Username is already taken', 'USERNAME_TAKEN');
    }
    this.store.set(user.username, user);
  }
}

/** DynamoDB-backed store used when USERS_TABLE is set. */
class DynamoUsersRepo implements UsersRepository {
  private docClientPromise?: Promise<import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient>;

  constructor(private tableName: string) {}

  private async client() {
    if (!this.docClientPromise) {
      this.docClientPromise = (async () => {
        const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
        return DynamoDBDocumentClient.from(
          new DynamoDBClient({ region: config.awsRegion }),
        );
      })();
    }
    return this.docClientPromise;
  }

  async findByUsername(username: string): Promise<StoredUser | null> {
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const res = await client.send(
      new GetCommand({ TableName: this.tableName, Key: { username } }),
    );
    return (res.Item as StoredUser) ?? null;
  }

  async create(user: StoredUser): Promise<void> {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    try {
      await client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: user,
          // Prevent overwriting an existing account (race-safe).
          ConditionExpression: 'attribute_not_exists(username)',
        }),
      );
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        throw AppError.badRequest('Username is already taken', 'USERNAME_TAKEN');
      }
      throw err;
    }
  }
}

export const usersRepo: UsersRepository = config.usersTable
  ? new DynamoUsersRepo(config.usersTable)
  : new InMemoryUsersRepo();

if (!config.usersTable) {
  logger.warn('USERS_TABLE not set — using in-memory users store (demo).');
}
