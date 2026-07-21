import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CDN_FONT_RE = /url\(\s*["']?https:\/\/[^)]*s81c\.com[^)]*["']?\s*\)/g
const stripUrls = (css) => css.replace(CDN_FONT_RE, 'local("IBM Plex Sans")')

function stripCdnFonts() {
  return {
    name: 'strip-carbon-cdn-fonts',
    transform(code, id) {
      if (!id.endsWith('.css') || !code.includes('s81c.com')) return null
      return { code: stripUrls(code), map: null }
    },
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type === 'asset' && asset.fileName.endsWith('.css') && typeof asset.source === 'string' && asset.source.includes('s81c.com')) {
          asset.source = stripUrls(asset.source)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [stripCdnFonts(), react(), tailwindcss()],
  server: { port: 3000, host: '0.0.0.0' },
})
