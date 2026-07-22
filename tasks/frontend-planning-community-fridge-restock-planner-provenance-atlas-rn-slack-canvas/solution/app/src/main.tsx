import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.js'
import { useAppStore } from './store.js'
import { setupWebMCP } from './webmcp.js'

function Root() {
  const store = useAppStore();

  useEffect(() => {
    setupWebMCP(() => store);
  }, [store]);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
