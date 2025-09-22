import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      __APP_CONFIG__: JSON.stringify({
        name: env.VITE_APP_NAME,
        backendUrl: env.VITE_PUBLIC_BACKEND_URL,
        wsPath: env.VITE_WS_PATH,
        enableSimulate: env.VITE_ENABLE_SIMULATE === 'true'
      })
    }
  };
});
