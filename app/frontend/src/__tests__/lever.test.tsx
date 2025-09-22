import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Lever } from '../components/Lever';
import { useFlushStore } from '../state/flushStore';

const resetStore = () => {
  useFlushStore.setState({
    timeline: [],
    drawerOpen: false,
    rareTicker: null,
    settings: { mute: false, reduceMotion: false, lowPower: false }
  });
};

describe('Lever', () => {
  afterEach(() => resetStore());

  it('toggles drawer with keyboard', () => {
    render(<Lever />);
    const button = screen.getByRole('button', { name: /pull lever/i });
    fireEvent.keyDown(button, { key: ' ' });
    expect(useFlushStore.getState().drawerOpen).toBe(true);
  });
});
