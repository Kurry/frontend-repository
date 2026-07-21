import { MotionConfig } from "motion/react";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <MotionConfig reducedMotion="user"><App /></MotionConfig>
    </Provider>
  );
}
