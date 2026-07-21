import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { initWebMcp } from './webmcp';

const app = mount(App, { target: document.getElementById('app')! });
initWebMcp();

export default app;
