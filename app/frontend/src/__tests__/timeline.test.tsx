import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TimelineDrawer } from '../components/TimelineDrawer';
import { useFlushStore } from '../state/flushStore';

const createFlush = (id: string) => ({
  id,
  tx: `tx-${id}`,
  ts: Date.now(),
  buyer: `buyer-${id}`,
  rarity: 'common' as const,
  seed: id,
  traits: {
    material: 'chrome',
    wormhole: 'pastel_nebula',
    shape: 'elongated',
    accessories: 'quantum_plunger',
    fx: 'stardust'
  },
  image_url: `/flushes/${id}.png`
});

describe('TimelineDrawer', () => {
  it('renders 10 cards after 10 flushes', () => {
    useFlushStore.setState({
      timeline: Array.from({ length: 10 }, (_, i) => createFlush(`${i}`)),
      drawerOpen: true,
      rareTicker: null,
      settings: { mute: false, reduceMotion: false, lowPower: false }
    });
    render(<TimelineDrawer />);
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });
});
