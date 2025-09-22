import type { Server as HttpServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { FlushRecord, SocketMessage } from './types';

interface Options {
  path: string;
  onClientReady?: () => Promise<FlushRecord[]>;
}

const HEARTBEAT_INTERVAL = 15000;
const MAX_BUFFER = 10;
const BUNDLE_INTERVAL = 200;

export class FlushSocket {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private queue: FlushRecord[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(server: HttpServer, { path, onClientReady }: Options) {
    this.wss = new WebSocketServer({ server, path });
    this.wss.on('connection', (socket) => this.handleConnection(socket, onClientReady));
    setInterval(() => this.ping(), HEARTBEAT_INTERVAL);
  }

  private async handleConnection(socket: WebSocket, onClientReady?: () => Promise<FlushRecord[]>) {
    this.clients.add(socket);
    socket.on('close', () => this.clients.delete(socket));
    socket.on('error', () => socket.close());
    const payload = onClientReady ? await onClientReady() : [];
    socket.send(JSON.stringify({ type: 'ready', payload } satisfies SocketMessage));
  }

  private ping() {
    for (const socket of this.clients) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' } satisfies SocketMessage));
      }
    }
  }

  private flushQueue() {
    if (this.queue.length === 0) return;
    const payloads = this.queue.splice(0, this.queue.length);
    for (const flush of payloads) {
      const message: SocketMessage = { type: 'flush:new', payload: flush };
      const serialized = JSON.stringify(message);
      for (const socket of this.clients) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(serialized);
        }
      }
    }
  }

  publish(flush: FlushRecord) {
    this.queue.push(flush);
    if (this.queue.length >= MAX_BUFFER) {
      this.flushQueue();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flushQueue();
        this.timer = null;
      }, BUNDLE_INTERVAL);
    }
  }
}
