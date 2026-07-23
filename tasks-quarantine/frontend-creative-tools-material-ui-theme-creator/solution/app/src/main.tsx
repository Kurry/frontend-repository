import React from 'react';
import ReactDOM from 'react-dom/client';
// Locally bundled fonts — no CDN.
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'material-symbols/outlined.css';
import './index.css';
import './monacoSetup';
import App from './App';
import { installWebMCP } from './webmcp';

installWebMCP();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
