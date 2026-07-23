import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Monaco's esm worker entry points are not compatible with the dep optimizer;
    // serve them unbundled so `?worker` imports resolve in dev (bundled in build).
    exclude: ['monaco-editor'],
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor', '@monaco-editor/react']
        }
      }
    }
  }
})
