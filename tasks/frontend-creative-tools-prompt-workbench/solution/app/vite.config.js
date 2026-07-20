import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Carbon's prebuilt stylesheet ships @font-face rules that fetch IBM Plex from
// the 1.www.s81c.com CDN. The app must stay fully local, so strip those blocks
// here; src/styles.css declares the same families from bundled woff2 files.
function stripCarbonRemoteFonts() {
  return {
    name: 'strip-carbon-remote-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@carbon/styles')) return null
      if (!code.includes('@font-face')) return null
      const stripped = code.replace(/@font-face\s*\{[^}]*\}/g, '')
      return { code: stripped, map: null }
    },
  }
}

export default defineConfig({
  plugins: [stripCarbonRemoteFonts(), react(), tailwindcss()],
})
