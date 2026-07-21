import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Carbon's prebuilt stylesheet references IBM Plex fonts on an external CDN
// (1.www.s81c.com). The studio must be fully self-contained with zero
// third-party requests, so strip every @font-face block from Carbon CSS and
// let the local font stack in src/styles.css take over.
const stripRemoteFonts = () => ({
  name: 'strip-remote-font-faces',
  enforce: 'pre',
  transform(code, id) {
    const normalized = id.replace(/\\/g, '/');
    if (!normalized.includes('@carbon/') || !normalized.endsWith('.css')) return null;
    if (!/https?:\/\//.test(code)) return null;
    const stripped = code.replace(/@font-face\s*\{[^{}]*\}/g, '');
    return { code: stripped, map: null };
  },
});

export default defineConfig({
  plugins: [stripRemoteFonts(), react(), tailwindcss()],
  server: { port: 3000, host: '0.0.0.0' },
});
