import { WebMCPProvider } from './WebMCPProvider';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './store/index.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <WebMCPProvider><App /></WebMCPProvider>
    </AppProvider>
  </StrictMode>,
)
