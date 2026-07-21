import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import { registerWebMCP } from './webmcp';

document.title = 'The O&A Palette Library — Palette Library';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

// Register WebMCP after mount so handlers can drive the same Pinia store the UI reads.
registerWebMCP();
