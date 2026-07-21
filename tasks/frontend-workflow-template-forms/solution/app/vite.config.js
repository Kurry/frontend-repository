import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function stripRemoteFonts() {
  const scrub = (code) => code
    .replace(/@font-face\s*\{[\s\S]*?url\(\s*['"]?https?:\/\/[^)]+[\s\S]*?\}/gi, '')
    .replace(/url\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)/gi, 'local("Arial")')
    .replace(/@import\s+url\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)\s*;?/gi, '')

  return {
    name: 'strip-remote-fonts',
    enforce: 'pre',
    transform(code, id) {
      const isStyle = /\.(css|scss|sass)([?].*)?$/.test(id) || id.includes('@carbon') || id.includes('@ibm/plex') || id.includes('carbon/styles')
      if (!isStyle) return null
      if (!/https?:\/\//.test(code) && !/@font-face/.test(code)) return null
      const next = scrub(code)
      return next === code ? null : { code: next, map: null }
    },
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type === 'asset' && typeof item.source === 'string' && /\.css$/.test(item.fileName)) {
          item.source = scrub(item.source)
        }
      }
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const end = res.end.bind(res)
        res.end = (chunk, ...args) => {
          if (typeof chunk === 'string' && /text\/css/.test(String(res.getHeader('content-type') || '')) && /https?:\/\//.test(chunk)) {
            chunk = scrub(chunk)
          }
          return end(chunk, ...args)
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [stripRemoteFonts(), react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 3000 },
  preview: { host: '0.0.0.0', port: 3000 },
})
