import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export type Severity = 'low' | 'medium' | 'high';
export type IncidentStatus = 'open' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  zoneId?: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentInput {
  title: string;
  description?: string;
  zoneId?: string;
  severity: Severity;
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: Severity;
  description?: string;
}

export interface IncidentsRepository {
  list(): Promise<Incident[]>;
  get(id: string): Promise<Incident | null>;
  create(input: CreateIncidentInput): Promise<Incident>;
  update(id: string, patch: UpdateIncidentInput): Promise<Incident | null>;
}

/** In-memory store used for local dev / demo / tests. */
class InMemoryIncidentsRepo implements IncidentsRepository {
  private store = new Map<string, Incident>();

  async list(): Promise<Incident[]> {
    return [...this.store.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async get(id: string): Promise<Incident | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: CreateIncidentInput): Promise<Incident> {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      zoneId: input.zoneId,
      severity: input.severity,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(incident.id, incident);
    return incident;
  }

  async update(id: string, patch: UpdateIncidentInput): Promise<Incident | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: Incident = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }
}

/**
 * DynamoDB-backed store used when INCIDENTS_TABLE is configured. Kept behind the
 * same interface so the routes are storage-agnostic.
 */
class DynamoIncidentsRepo implements IncidentsRepository {
  private tableName: string;
  // Lazily created so the SDK isn't initialized in the in-memory path.
  private docClientPromise?: Promise<import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient>;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

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

  async list(): Promise<Incident[]> {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const res = await client.send(new ScanCommand({ TableName: this.tableName }));
    return ((res.Items as Incident[]) ?? []).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async get(id: string): Promise<Incident | null> {
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const res = await client.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    return (res.Item as Incident) ?? null;
  }

  async create(input: CreateIncidentInput): Promise<Incident> {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const now = new Date().toISOString();
    const incident: Incident = {
      id: randomUUID(),
      status: 'open',
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    await client.send(new PutCommand({ TableName: this.tableName, Item: incident }));
    return incident;
  }

  async update(id: string, patch: UpdateIncidentInput): Promise<Incident | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const updated: Incident = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await client.send(new PutCommand({ TableName: this.tableName, Item: updated }));
    return updated;
  }
}

export const incidentsRepo: IncidentsRepository = config.incidentsTable
  ? new DynamoIncidentsRepo(config.incidentsTable)
  : new InMemoryIncidentsRepo();

if (!config.incidentsTable) {
  logger.warn('INCIDENTS_TABLE not set — using in-memory incidents store (demo).');
}
