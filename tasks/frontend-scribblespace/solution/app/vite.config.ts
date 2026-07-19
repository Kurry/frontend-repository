import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Pin the HTML entry explicitly (absolute path) rather than relying on
    // default cwd-relative auto-detection — works around builds that report
    // "[UNRESOLVED_ENTRY] Cannot resolve entry module index.html" despite
    // index.html existing at the project root.
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
  },
});
