import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest';

// Configure DynamoDB-backed repositories BEFORE importing config/repos.
process.env.USERS_TABLE = 'test-users';
process.env.INCIDENTS_TABLE = 'test-incidents';
process.env.CROWD_TABLE = 'test-crowd';

// Prevent this file's env from leaking to other test files in the worker.
afterAll(() => {
  delete process.env.USERS_TABLE;
  delete process.env.INCIDENTS_TABLE;
  delete process.env.CROWD_TABLE;
});

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {},
}));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: sendMock }) },
  GetCommand: class {
    constructor(public input: unknown) {}
  },
  PutCommand: class {
    constructor(public input: unknown) {}
  },
  ScanCommand: class {
    constructor(public input: unknown) {}
  },
}));

const { usersRepo } = await import('../repositories/users.repo.js');
const { incidentsRepo } = await import('../repositories/incidents.repo.js');
const { crowdRepo } = await import('../repositories/crowd.repo.js');

describe('DynamoDB repositories (happy paths)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    // A response shape that satisfies Get (Item) and Scan (Items).
    sendMock.mockResolvedValue({
      Item: { username: 'x', passwordHash: 'h', role: 'staff', createdAt: 'now' },
      Items: [{ id: 'i1', title: 'T', severity: 'low', status: 'open', createdAt: 'a', zoneId: 'gate-a', name: 'Gate A', capacity: 5000, occupancy: 100 }],
    });
  });

  it('users: create (PutCommand) and findByUsername (GetCommand)', async () => {
    await usersRepo.create({
      username: 'newuser',
      passwordHash: 'hash',
      role: 'staff',
      createdAt: new Date().toISOString(),
    });
    const found = await usersRepo.findByUsername('x');
    expect(found?.username).toBe('x');
    expect(sendMock).toHaveBeenCalled();
  });

  it('incidents: create, list, get, update', async () => {
    const created = await incidentsRepo.create({ title: 'T', severity: 'low' });
    expect(created.status).toBe('open');
    const list = await incidentsRepo.list();
    expect(Array.isArray(list)).toBe(true);
    const got = await incidentsRepo.get('i1');
    expect(got).toBeTruthy();
    const updated = await incidentsRepo.update('i1', { status: 'resolved' });
    expect(updated?.status).toBe('resolved');
  });

  it('crowd: getAll (ensureSeed + Scan) and setOccupancy', async () => {
    const zones = await crowdRepo.getAll();
    expect(zones.length).toBeGreaterThan(0);
    const updated = await crowdRepo.setOccupancy('gate-a', 3000);
    expect(updated?.occupancy).toBe(3000);
  });

  it('crowd: setOccupancy returns null for an unknown zone', async () => {
    const res = await crowdRepo.setOccupancy('nope', 1);
    expect(res).toBeNull();
  });
});
