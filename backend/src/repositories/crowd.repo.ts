import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Crowd occupancy store. Backed by DynamoDB when CROWD_TABLE is set so state is
 * shared across App Runner instances; falls back to an in-memory store for
 * local dev / tests. Seed zones are created on first use.
 */
export interface ZoneRecord {
  zoneId: string;
  name: string;
  capacity: number;
  occupancy: number;
}

const SEED: ZoneRecord[] = [
  { zoneId: 'gate-a', name: 'Gate A — North', capacity: 5000, occupancy: 2100 },
  { zoneId: 'gate-c', name: 'Gate C — East', capacity: 4000, occupancy: 3600 },
  { zoneId: 'concourse-1', name: 'Concourse Level 1', capacity: 8000, occupancy: 6900 },
  { zoneId: 'fan-zone', name: 'Fan Zone Plaza', capacity: 12000, occupancy: 4200 },
];

export interface CrowdRepository {
  getAll(): Promise<ZoneRecord[]>;
  setOccupancy(zoneId: string, occupancy: number): Promise<ZoneRecord | null>;
}

class InMemoryCrowdRepo implements CrowdRepository {
  private zones = new Map<string, ZoneRecord>(SEED.map((z) => [z.zoneId, { ...z }]));

  async getAll(): Promise<ZoneRecord[]> {
    return SEED.map((s) => this.zones.get(s.zoneId)!);
  }

  async setOccupancy(zoneId: string, occupancy: number): Promise<ZoneRecord | null> {
    const zone = this.zones.get(zoneId);
    if (!zone) return null;
    zone.occupancy = Math.min(zone.capacity, Math.max(0, Math.round(occupancy)));
    return zone;
  }
}

class DynamoCrowdRepo implements CrowdRepository {
  private docClientPromise?: Promise<import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient>;
  private seeded = false;

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

  /** Idempotently seed the zones (only writes those that don't exist). */
  private async ensureSeed(): Promise<void> {
    if (this.seeded) return;
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    await Promise.all(
      SEED.map((zone) =>
        client
          .send(
            new PutCommand({
              TableName: this.tableName,
              Item: zone,
              ConditionExpression: 'attribute_not_exists(zoneId)',
            }),
          )
          .catch((err) => {
            if ((err as { name?: string }).name !== 'ConditionalCheckFailedException') {
              throw err;
            }
          }),
      ),
    );
    this.seeded = true;
  }

  async getAll(): Promise<ZoneRecord[]> {
    await this.ensureSeed();
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    const res = await client.send(new ScanCommand({ TableName: this.tableName }));
    const byId = new Map(((res.Items as ZoneRecord[]) ?? []).map((z) => [z.zoneId, z]));
    // Return in seed order for stable rendering.
    return SEED.map((s) => byId.get(s.zoneId) ?? s);
  }

  async setOccupancy(zoneId: string, occupancy: number): Promise<ZoneRecord | null> {
    const seed = SEED.find((z) => z.zoneId === zoneId);
    if (!seed) return null;
    const clamped = Math.min(seed.capacity, Math.max(0, Math.round(occupancy)));
    const record: ZoneRecord = { ...seed, occupancy: clamped };
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const client = await this.client();
    await client.send(new PutCommand({ TableName: this.tableName, Item: record }));
    return record;
  }
}

export const crowdRepo: CrowdRepository = config.crowdTable
  ? new DynamoCrowdRepo(config.crowdTable)
  : new InMemoryCrowdRepo();

if (!config.crowdTable) {
  logger.warn('CROWD_TABLE not set — using in-memory crowd store (demo).');
}
