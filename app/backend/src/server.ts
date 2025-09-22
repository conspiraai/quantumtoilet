import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import bodyParser from 'body-parser';

import { createDb, migrate, insertFlush, listFlushes, getFlush, topFlushers, latestFlushes, updateFlushAssets } from './db';
import { createFlushFromSignature } from './traits';
import type { HeliusWebhookPayload } from './types';
import { FlushSocket } from './ws';
import { verifyWebhook } from './webhook';
import { ensurePreviewForFlush } from './preview';
import { buildMintTransaction } from './mint';

const PORT = Number(process.env.PORT ?? 3000);
const ALLOWLIST = (process.env.CORS_ORIGIN ?? '').split(',').filter(Boolean);

const app = express();
const server = createServer(app);
const db = createDb();
await migrate(db);
const socket = new FlushSocket(server, {
  path: process.env.VITE_WS_PATH ?? '/flush',
  onClientReady: () => latestFlushes(db, 20)
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWLIST.length === 0 || ALLOWLIST.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300
  })
);

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/flushes', async (req, res) => {
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const flushes = await listFlushes(db, cursor);
  res.json({ items: flushes, nextCursor: flushes.at(-1)?.ts ?? null });
});

app.get('/api/flushes/:id', async (req, res) => {
  const flush = await getFlush(db, req.params.id);
  if (!flush) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(flush);
});

app.get('/api/stats/top', async (_req, res) => {
  const stats = await topFlushers(db);
  res.json({ items: stats });
});

app.get('/api/feed/latest', async (_req, res) => {
  const latest = await latestFlushes(db, 20);
  res.json({ items: latest });
});

app.get('/mint/:id', async (req, res) => {
  const flush = await getFlush(db, req.params.id);
  if (!flush) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  if (!req.query.recipient || typeof req.query.recipient !== 'string') {
    res.status(400).json({ error: 'recipient_required' });
    return;
  }
  const tx = await buildMintTransaction(flush, req.query.recipient);
  res.json({ transaction: tx });
});

app.post('/simulate', async (req, res) => {
  if (process.env.VITE_ENABLE_SIMULATE !== 'true') {
    res.status(403).json({ error: 'disabled' });
    return;
  }
  const { signature, buyer } = req.body ?? {};
  if (typeof signature !== 'string' || typeof buyer !== 'string') {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }
  const flush = createFlushFromSignature({ tx: signature, buyer, ts: Date.now() });
  await insertFlush(db, flush);
  await ensurePreviewForFlush(flush);
  await updateFlushAssets(db, flush);
  socket.publish(flush);
  res.json(flush);
});

app.post('/webhook/helius', verifyWebhook, async (req, res) => {
  const payload = req.body as HeliusWebhookPayload;
  const signature = payload?.data?.signature;
  const buyer = payload?.data?.parsed?.info?.buyer ?? 'unknown';
  const mint = payload?.data?.parsed?.info?.mint;
  const expectedMint = process.env.VITE_TOKEN_MINT;
  if (expectedMint && mint !== expectedMint) {
    res.status(202).json({ status: 'ignored' });
    return;
  }
  if (!signature) {
    res.status(400).json({ error: 'invalid' });
    return;
  }
  const flush = createFlushFromSignature({ tx: signature, buyer, ts: payload.data.timestamp * 1000 });
  await insertFlush(db, flush);
  await ensurePreviewForFlush(flush);
  await updateFlushAssets(db, flush);
  socket.publish(flush);
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`🚽 Quantum Toilet backend listening on ${PORT}`);
});
