import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const staticOutput = process.env.VERT_BUILD_OUT || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: staticOutput,
			assets: staticOutput,
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
	}
};

export default config;
