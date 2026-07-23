import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Carbon's prebuilt stylesheet ships @font-face rules pointing at an IBM CDN.
// Strip them so the locally bundled IBM Plex files in src/fonts are the only
// font source — no outbound requests at runtime.
const stripRemoteFontFaces = () => ({
  name: 'strip-remote-font-faces',
  enforce: 'pre',
  transform(code, id) {
    const file = id.split('?')[0]
    if (!file.endsWith('.css') || !file.includes('@carbon/styles')) return null
    if (!code.includes('@font-face')) return null
    return {
      code: code.replace(/@font-face\s*\{[^{}]*\}/g, ''),
      map: null,
    }
  },
})

export default defineConfig({
  plugins: [stripRemoteFontFaces(), react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 3000 },
})
