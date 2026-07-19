import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { init } from './lib/state.svelte.js';
import { installWebMCP } from './lib/webmcp.js';

init();
installWebMCP();

const app = mount(App, { target: document.getElementById('app') });

export default app;
