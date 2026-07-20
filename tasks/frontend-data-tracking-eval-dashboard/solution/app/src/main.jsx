import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalTheme } from '@carbon/react';
import './carbon.scss';
import './styles.css';
import App from './App';
import { registerWebMcpTools } from './webmcp';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalTheme theme="g10">
      <App />
    </GlobalTheme>
  </React.StrictMode>,
);

window.setTimeout(registerWebMcpTools, 0);
