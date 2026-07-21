import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],
  base: './',
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    target: 'esnext',
  },
});
