import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Carbon's prebuilt CSS ships @font-face rules that fetch IBM Plex from an
// external IBM CDN (1.www.s81c.com). The app must make zero outbound requests,
// so rewrite those remote font sources to local() lookups at transform time —
// the browser then falls back to the bundled system font stack, no network.
function stripCarbonExternalFonts() {
  return {
    name: 'strip-carbon-external-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('@carbon') && id.endsWith('.css') && code.includes('s81c.com')) {
        return {
          code: code.replace(/url\(\s*["']?https?:\/\/[^)]*s81c\.com[^)]*["']?\s*\)(\s*format\([^)]*\))?/g, "local('IBM Plex Sans')"),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [stripCarbonExternalFonts(), react(), tailwindcss()],
  server: { port: 3000, host: '0.0.0.0' },
});
