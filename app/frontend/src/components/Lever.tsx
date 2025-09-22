import { useCallback } from 'react';
import { useFlushStore } from '../state/flushStore';

export const Lever = () => {
  const toggleDrawer = useFlushStore((s) => s.toggleDrawer);

  const handleActivate = useCallback(() => {
    toggleDrawer();
  }, [toggleDrawer]);

  return (
    <button
      className="lever"
      onClick={handleActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleActivate();
        }
      }}
      aria-label="Pull Lever"
    >
      Pull Lever
    </button>
  );
};
