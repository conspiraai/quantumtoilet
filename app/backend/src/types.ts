import type { FlushTraits } from './traits';

export type Rarity = 'common' | 'mythic' | 'black_hole';

export interface FlushRecord {
  id: string;
  tx: string;
  ts: number;
  seed: string;
  buyer: string;
  traits: FlushTraits;
  rarity: Rarity;
  image_url?: string | null;
  metadata_url?: string | null;
}

export interface FlushRow extends FlushRecord {
  traits: FlushTraits;
  rarity: Rarity;
}

export interface FlusherStatsRow {
  wallet: string;
  total_flushes: number;
  mythics: number;
  blackholes: number;
}

export interface NewFlushInput {
  tx: string;
  buyer: string;
  ts: number;
}

export interface HeliusWebhookPayload {
  type: string;
  data: {
    signature: string;
    slot: number;
    source: string;
    accountData: unknown[];
    parsed: {
      type: string;
      info: {
        mint: string;
        buyer: string;
        amount: string;
      };
    };
    timestamp: number;
  };
}

export interface FlushEvent {
  type: 'flush:new';
  payload: FlushRecord;
}

export type SocketMessage = FlushEvent | { type: 'ping' } | { type: 'ready'; payload: FlushRecord[] };
