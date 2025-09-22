import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type Rarity = 'common' | 'mythic' | 'black_hole';

export interface FlushTraits {
  material: string;
  wormhole: string;
  shape: string;
  accessories: string;
  fx: string;
}

export interface Flush {
  id: string;
  tx: string;
  ts: number;
  buyer: string;
  rarity: Rarity;
  seed: string;
  traits: FlushTraits;
  image_url?: string;
  metadata_url?: string;
}

interface StoreState {
  timeline: Flush[];
  drawerOpen: boolean;
  rareTicker: string | null;
  settings: {
    mute: boolean;
    reduceMotion: boolean;
    lowPower: boolean;
  };
  setFlushes: (flushes: Flush[]) => void;
  addFlush: (flush: Flush) => void;
  toggleDrawer: () => void;
  setSetting: (key: keyof StoreState['settings'], value: boolean) => void;
  simulateFlush: () => Promise<void>;
}

const backendUrl = __APP_CONFIG__.backendUrl;

export const useFlushStore = create<StoreState>()(
  immer((set, _get) => ({
    timeline: [],
    drawerOpen: false,
    rareTicker: null,
    settings: {
      mute: false,
      reduceMotion: false,
      lowPower: false
    },
    setFlushes: (flushes) => set((state) => {
      state.timeline = flushes;
    }),
    addFlush: (flush) =>
      set((state) => {
        state.timeline.unshift(flush);
        if (state.timeline.length > 200) {
          state.timeline.pop();
        }
        if (flush.rarity !== 'common') {
          state.rareTicker = `${flush.rarity.replace('_', ' ')} flush detected for ${flush.buyer.slice(0, 6)}`;
        }
      }),
    toggleDrawer: () =>
      set((state) => {
        state.drawerOpen = !state.drawerOpen;
      }),
    setSetting: (key, value) =>
      set((state) => {
        state.settings[key] = value;
      }),
    simulateFlush: async () => {
      if (!__APP_CONFIG__.enableSimulate) return;
      const buyer = 'SimulatedBuyer-' + Math.random().toString(36).slice(2, 8);
      const signature = crypto.randomUUID();
      const res = await fetch(`${backendUrl}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer, signature })
      });
      if (!res.ok) {
        console.error('Failed to simulate flush');
      }
    }
  }))
);
