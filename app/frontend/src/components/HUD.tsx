import { useMemo } from 'react';
import { useFlushStore } from '../state/flushStore';

export const HUD = () => {
  const { rareTicker, timeline } = useFlushStore((s) => ({ rareTicker: s.rareTicker, timeline: s.timeline }));

  const topFlushes = useMemo(() => timeline.slice(0, 5), [timeline]);

  return (
    <div className="hud">
      <div className="branding">
        <h1>Flush the timeline. Split reality.</h1>
        <p>Quantum Toilet — FLUSH∞</p>
      </div>
      <div className="top-flushers">
        <h2>Top Flushes</h2>
        <ul>
          {topFlushes.map((flush) => (
            <li key={flush.id}>
              <span>{flush.traits.material}</span>
              <span>{flush.rarity}</span>
            </li>
          ))}
        </ul>
      </div>
      {rareTicker && <div className="ticker">{rareTicker}</div>}
    </div>
  );
};
