import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import { MotionConfig } from 'motion/react';
import { registerWebMCP } from './webmcp';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* useDur and the reduced-motion stylesheet own the zero-duration policy.
        Keeping Motion's detector off avoids its development-only console warning. */}
    <MotionConfig reducedMotion="never">
      <App />
    </MotionConfig>
  </React.StrictMode>,
);

registerWebMCP();
