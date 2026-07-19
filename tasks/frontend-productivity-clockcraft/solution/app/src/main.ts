import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { initWebMcp } from './lib/webmcp';

mount(App, {
	target: document.getElementById('app')!
});

initWebMcp();
