import { mount } from 'svelte';
import App from './App.svelte';
import { initWebMcp } from './webmcp.js';

mount(App, {
  target: document.getElementById('app')
});

initWebMcp();
