import { useEffect } from 'react';
import { Lever } from './components/Lever';
import { TimelineDrawer } from './components/TimelineDrawer';
import { HUD } from './components/HUD';
import { Scene } from './three/Scene';
import { useFlushFeed } from './hooks/useFlushFeed';
import { useFlushStore } from './state/flushStore';

const App = () => {
  useFlushFeed();
  const enableSimulate = __APP_CONFIG__.enableSimulate;
  const simulate = useFlushStore((s) => s.simulateFlush);

  useEffect(() => {
    document.title = __APP_CONFIG__.name;
  }, []);

  return (
    <div className="app-shell">
      <Scene />
      <HUD />
      <Lever />
      <TimelineDrawer />
      {enableSimulate && (
        <button className="simulate-btn" onClick={() => simulate()}>
          Simulate Flush
        </button>
      )}
    </div>
  );
};

export default App;
