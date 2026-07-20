import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Self-contained SPA: all deps bundled locally, no CDN imports.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: { chunkSizeWarningLimit: 4000 }
});
