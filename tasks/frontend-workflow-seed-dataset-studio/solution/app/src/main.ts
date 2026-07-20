import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { initWebMCP } from './lib/webmcp';

initWebMCP();

mount(App, { target: document.getElementById('app')! });
