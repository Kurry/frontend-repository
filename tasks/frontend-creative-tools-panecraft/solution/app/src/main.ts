import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { initWebMcp } from './lib/webmcp';

const app = mount(App, {
  target: document.getElementById('app')!,
});

initWebMcp();

export default app;
