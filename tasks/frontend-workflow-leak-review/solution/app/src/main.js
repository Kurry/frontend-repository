import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { reviewState } from './lib/state.svelte.js';
import { registerWebMCP } from './lib/webmcp.js';
import { copyExportText, installIconAccessibilityObserver, openImportPicker } from './lib/actions.js';

registerWebMCP(reviewState, {
  copyExport: () => copyExportText(reviewState),
  openImportPicker: () => openImportPicker(reviewState)
});

const app = mount(App, { target: document.getElementById('app') });
installIconAccessibilityObserver();

export default app;
