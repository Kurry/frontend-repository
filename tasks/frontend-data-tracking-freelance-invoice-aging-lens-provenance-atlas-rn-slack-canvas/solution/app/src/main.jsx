import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppProvider, useAppStore } from './store'
import { registerWebMCP } from './WebMCP'
import './index.css'

const RootComponent = () => {
  const storeContext = useAppStore();

  useEffect(() => {
    registerWebMCP(storeContext);
  }, [storeContext]);

  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <RootComponent />
    </AppProvider>
  </StrictMode>,
)
