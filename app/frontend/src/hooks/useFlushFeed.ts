import { useEffect } from 'react';
import { useFlushStore } from '../state/flushStore';

export const useFlushFeed = () => {
  const setFlushes = useFlushStore((s) => s.setFlushes);
  const addFlush = useFlushStore((s) => s.addFlush);

  useEffect(() => {
    const controller = new AbortController();
    const loadInitial = async () => {
      try {
        const res = await fetch(`${__APP_CONFIG__.backendUrl}/api/feed/latest`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setFlushes(data.items ?? []);
      } catch (error) {
        console.error('Failed to load initial flushes', error);
      }
    };
    loadInitial();
    return () => controller.abort();
  }, [setFlushes]);

  useEffect(() => {
    const backend = new URL(__APP_CONFIG__.backendUrl);
    const protocol = backend.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${backend.host}${__APP_CONFIG__.wsPath}`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'flush:new') {
          addFlush(message.payload);
        } else if (message.type === 'ready' && Array.isArray(message.payload)) {
          setFlushes(message.payload);
        }
      } catch (error) {
        console.error('Invalid socket message', error);
      }
    };
    return () => socket.close();
  }, [addFlush, setFlushes]);
};
