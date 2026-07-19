import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from '@unocss/vite'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  // Vite 8's rolldown-based bundler does not reliably auto-discover the
  // `index.html` entry from the project root in this environment (build
  // fails with [UNRESOLVED_ENTRY] before any real transform happens even
  // though the file exists) -- declare the entry explicitly so `vite build`
  // resolves it. `rolldownOptions` is v8's renamed `rollupOptions`.
  build: {
    rolldownOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})
