import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StateProvider, useAppState } from './store.jsx'
import { initializeWebMCP } from './webmcp.js'

function WebMCPInitializer({ children }) {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    initializeWebMCP(dispatch, () => state);
  }, [dispatch, state]);

  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StateProvider>
      <WebMCPInitializer>
        <App />
      </WebMCPInitializer>
    </StateProvider>
  </StrictMode>,
)
