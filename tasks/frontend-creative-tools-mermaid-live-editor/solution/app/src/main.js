import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { init } from './lib/state.svelte.js';
import { installWebMCP } from './lib/webmcp.js';

init();
installWebMCP();

const app = mount(App, { target: document.getElementById('app') });

export default app;
