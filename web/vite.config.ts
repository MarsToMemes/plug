import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The editor calls the Plug API (server/) on /api.
// (process through globalThis: the web tsconfig has no Node types.)
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const api = env.PLUG_API ?? 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': api } },
  preview: { proxy: { '/api': api } },
  test: { environment: 'node' }
} as never);
