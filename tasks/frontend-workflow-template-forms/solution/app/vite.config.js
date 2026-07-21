import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function stripRemoteFonts() {
  return {
    name: 'strip-remote-fonts',
    transform(code, id) {
      if (!id.includes('@carbon') || !id.includes('.css')) return null
      const next = code
        .replace(/@font-face\s*\{[^}]*url\((['"]?)https?:\/\/[^)]+\1\)[^}]*\}/gis, '')
        .replace(/url\((['"]?)https?:\/\/[^)]+\1\)/g, 'local("Arial")')
      return next === code ? null : next
    },
  }
}

export default defineConfig({
  plugins: [stripRemoteFonts(), react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 3000 },
})
