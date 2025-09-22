import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, migrate, insertFlush, listFlushes } from '../db';
import { createFlushFromSignature } from '../traits';

const resetEnv = () => {
  process.env.DATABASE_URL = '';
};

describe('database inserts', () => {
  beforeEach(() => {
    resetEnv();
  });

  it('ignores duplicate transactions', async () => {
    const db = createDb();
    await migrate(db);
    const flush = createFlushFromSignature({ tx: 'abc', buyer: 'buyer', ts: Date.now() });
    await insertFlush(db, flush);
    await insertFlush(db, flush);
    const rows = await listFlushes(db);
    expect(rows).toHaveLength(1);
  });
});
