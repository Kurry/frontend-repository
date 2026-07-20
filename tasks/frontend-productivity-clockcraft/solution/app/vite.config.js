import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	server: {
		port: 3000,
		host: '0.0.0.0'
	},
	preview: {
		port: 3000,
		host: '0.0.0.0',
		strictPort: true
	},
	resolve: {
		alias: {
			'$app/environment': path.resolve(__dirname, './src/lib/mock-app-environment.ts'),
			'$app/stores': path.resolve(__dirname, './src/lib/mock-app-stores.ts'),
			'$app/navigation': path.resolve(__dirname, './src/lib/mock-app-navigation.ts'),
			'$app/forms': path.resolve(__dirname, './src/lib/mock-app-forms.ts')
		}
	}
});
