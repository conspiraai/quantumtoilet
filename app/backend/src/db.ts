import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database as SqliteDriver } from 'sqlite3';
import { Kysely, SqliteDialect, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { FlusherStatsRow, FlushRecord } from './types';

interface FlushesTable {
  id: string;
  tx: string;
  ts: number;
  seed: string;
  buyer: string;
  traits: string;
  image_url: string | null;
  metadata_url: string | null;
  rarity: 'common' | 'mythic' | 'black_hole';
}

interface FlusherStatsTable {
  wallet: string;
  total_flushes: number;
  mythics: number;
  blackholes: number;
}

interface Database {
  flushes: FlushesTable;
  flusher_stats: FlusherStatsTable;
}

const getSqlitePath = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.resolve(__dirname, '../../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'flush.sqlite');
};

export const createDb = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({ connectionString: databaseUrl })
    });
    return new Kysely<Database>({ dialect });
  }
  const sqlitePath = getSqlitePath();
  const dialect = new SqliteDialect({
    database: new SqliteDriver.Database(sqlitePath)
  });
  return new Kysely<Database>({ dialect });
};

export const migrate = async (db: Kysely<Database>) => {
  await db.schema
    .createTable('flushes')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('tx', 'text', (col) => col.notNull().unique())
    .addColumn('ts', 'integer', (col) => col.notNull())
    .addColumn('seed', 'text', (col) => col.notNull())
    .addColumn('buyer', 'text', (col) => col.notNull())
    .addColumn('traits', 'text', (col) => col.notNull())
    .addColumn('image_url', 'text')
    .addColumn('metadata_url', 'text')
    .addColumn('rarity', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('flusher_stats')
    .ifNotExists()
    .addColumn('wallet', 'text', (col) => col.primaryKey())
    .addColumn('total_flushes', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('mythics', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('blackholes', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
};

const serializeFlush = (row: FlushesTable): FlushRecord => ({
  id: row.id,
  tx: row.tx,
  ts: row.ts,
  seed: row.seed,
  buyer: row.buyer,
  traits: JSON.parse(row.traits),
  rarity: row.rarity,
  image_url: row.image_url ?? undefined,
  metadata_url: row.metadata_url ?? undefined
});

export const insertFlush = async (db: Kysely<Database>, flush: FlushRecord) => {
  await db
    .insertInto('flushes')
    .values({
      id: flush.id,
      tx: flush.tx,
      ts: flush.ts,
      seed: flush.seed,
      buyer: flush.buyer,
      traits: JSON.stringify(flush.traits),
      image_url: flush.image_url ?? null,
      metadata_url: flush.metadata_url ?? null,
      rarity: flush.rarity
    })
    .onConflict((oc) => oc.column('tx').doNothing())
    .execute();

  await db
    .insertInto('flusher_stats')
    .values({
      wallet: flush.buyer,
      total_flushes: 1,
      mythics: flush.rarity === 'mythic' ? 1 : 0,
      blackholes: flush.rarity === 'black_hole' ? 1 : 0
    })
    .onConflict((oc) =>
      oc
        .column('wallet')
        .doUpdateSet({
          total_flushes: (eb) => eb.ref('flusher_stats.total_flushes').add(1),
          mythics: (eb) => eb.ref('flusher_stats.mythics').add(flush.rarity === 'mythic' ? 1 : 0),
          blackholes: (eb) => eb.ref('flusher_stats.blackholes').add(flush.rarity === 'black_hole' ? 1 : 0)
        })
    )
    .execute();
};

export const updateFlushAssets = async (db: Kysely<Database>, flush: FlushRecord) => {
  await db
    .updateTable('flushes')
    .set({
      image_url: flush.image_url ?? null,
      metadata_url: flush.metadata_url ?? null
    })
    .where('id', '=', flush.id)
    .execute();
};

export const listFlushes = async (db: Kysely<Database>, cursor?: string, limit = 20) => {
  let query = db.selectFrom('flushes').selectAll().orderBy('ts', 'desc').limit(limit);
  if (cursor) {
    query = query.where('ts', '<', Number(cursor));
  }
  const rows = await query.execute();
  return rows.map(serializeFlush);
};

export const getFlush = async (db: Kysely<Database>, id: string) => {
  const row = await db.selectFrom('flushes').selectAll().where('id', '=', id).executeTakeFirst();
  return row ? serializeFlush(row) : null;
};

export const topFlushers = async (db: Kysely<Database>, limit = 10): Promise<FlusherStatsRow[]> => {
  const rows = await db
    .selectFrom('flusher_stats')
    .select(['wallet', 'total_flushes', 'mythics', 'blackholes'])
    .orderBy('total_flushes', 'desc')
    .limit(limit)
    .execute();
  return rows;
};

export const latestFlushes = async (db: Kysely<Database>, limit = 20) => {
  const rows = await db.selectFrom('flushes').selectAll().orderBy('ts', 'desc').limit(limit).execute();
  return rows.map(serializeFlush);
};
