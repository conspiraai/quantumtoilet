import { useFlushStore } from '../state/flushStore';
import { FlushCard } from './FlushCard';

export const TimelineDrawer = () => {
  const { drawerOpen, timeline } = useFlushStore((s) => ({ drawerOpen: s.drawerOpen, timeline: s.timeline }));

  return (
    <aside className={`timeline-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
      <header>
        <h2>View Multiverse</h2>
        <p>Every flush fractures the timeline. Mint your favorite divergence.</p>
      </header>
      <div className="timeline-grid">
        {timeline.map((flush) => (
          <FlushCard key={flush.id} flush={flush} />
        ))}
        {timeline.length === 0 && <p className="muted">No flushes yet. Pull the lever!</p>}
      </div>
    </aside>
  );
};
