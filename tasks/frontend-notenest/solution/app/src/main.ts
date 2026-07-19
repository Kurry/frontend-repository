import { mount } from 'svelte';
import App from './App.svelte';
import { registerWebmcp } from './lib/webmcp';

const target = document.getElementById('app');
if (target) {
  mount(App, { target });
}

// Expose the WebMCP action surface on window (contract zto-webmcp-v1).
registerWebmcp();
