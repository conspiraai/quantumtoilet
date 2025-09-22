import { describe, it, expect } from 'vitest';
import { createServer } from 'http';
import WebSocket from 'ws';
import { FlushSocket } from '../ws';
import { createFlushFromSignature } from '../traits';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('FlushSocket', () => {
  it('emits flush events to subscribers', async () => {
    const server = createServer();
    const flushSocket = new FlushSocket(server, { path: '/flush' });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('invalid address');
    const ws = new WebSocket(`ws://127.0.0.1:${address.port}/flush`);

    const messages: unknown[] = [];
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));

    await wait(100);
    const flush = createFlushFromSignature({ tx: 'sig1', buyer: 'buyer', ts: Date.now() });
    flushSocket.publish(flush);
    await wait(300);

    expect(messages.some((msg) => (msg as any).type === 'flush:new')).toBe(true);

    ws.close();
    server.close();
  });
});
