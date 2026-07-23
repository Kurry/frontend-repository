import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';

export default defineConfig({
  // sveltePhosphorOptimize() rewrites `import { XIcon } from 'phosphor-svelte'` into
  // per-icon subpath imports (`phosphor-svelte/lib/XIcon`) at transform time. Without
  // it, Vite dev must parse/pre-bundle the entire ~6k-file phosphor-svelte barrel on
  // first navigation, which alone blew the 2s cold-load interactivity budget.
  plugins: [tailwindcss(), svelte(), sveltePhosphorOptimize()]
});
