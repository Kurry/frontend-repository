import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const stripExternalCarbonFonts = () => ({
  name: 'strip-external-carbon-fonts',
  transform(code, id) {
    if (!id.includes('@carbon/styles/css/styles.css')) return null
    return code.replace(/@font-face\s*{[^}]*url\([^)]*s81c\.com[^}]*}\s*/g, '')
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), stripExternalCarbonFonts()],
  server: { host: '0.0.0.0', port: 3000 },
})
