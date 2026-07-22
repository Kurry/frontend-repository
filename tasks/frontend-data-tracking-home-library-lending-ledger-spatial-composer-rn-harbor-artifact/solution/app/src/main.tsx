import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { StoreContext, useStore } from './store'
import { initWebMCP } from './webmcp'

function WebMCPBridge({ children }: { children: React.ReactNode }) {
  const { state, dispatch, derived } = useStore();

  // Re-sync WebMCP bridge on every state change to keep get_state fresh
  useEffect(() => {
    initWebMCP(dispatch, () => ({ state, derived }));
  }, [state, dispatch, derived]);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
