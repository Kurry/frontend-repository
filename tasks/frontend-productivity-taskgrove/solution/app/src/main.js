import { mount } from 'svelte';
import App from './App.svelte';
import { initWebMcp } from './webmcp.js';

initWebMcp();

mount(App, {
  target: document.getElementById('app')
});
