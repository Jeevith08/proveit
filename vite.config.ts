import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tanstackStart({
        server: { entry: 'server' },
        spa: { enabled: true },
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      port: 5173,
    },
    define: {
      // Expose non-prefixed vars (from .env) as VITE_ vars so both client & SSR can access them
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env['VITE_SUPABASE_URL'] || env['SUPABASE_URL'] || '',
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env['VITE_SUPABASE_ANON_KEY'] || env['SUPABASE_ANON_KEY'] || '',
      ),
    },
  };
});

