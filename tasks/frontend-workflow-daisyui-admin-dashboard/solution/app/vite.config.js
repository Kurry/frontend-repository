import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    force: true,
    include: [
      '@heroicons/react/24/outline',
      '@hookform/resolvers/zod',
      '@preact/signals',
      'chart.js',
      'preact',
      'preact/hooks',
      'react-hook-form',
      'zod'
    ]
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact'
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  }
});
