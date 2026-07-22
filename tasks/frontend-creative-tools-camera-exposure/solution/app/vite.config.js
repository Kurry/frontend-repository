import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin(),
    Icons({ compiler: 'solid' })
  ],
  build: {
    target: 'esnext',
  }
});
