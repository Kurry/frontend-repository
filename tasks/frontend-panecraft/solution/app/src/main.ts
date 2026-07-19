import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { initWebMcp } from './lib/webmcp';

const app = mount(App, {
  target: document.getElementById('app')!,
});

initWebMcp();

export default app;
