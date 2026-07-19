import { qwikVite } from '@builder.io/qwik/optimizer';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [qwikVite({ csr: true }), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
