import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import { setupWebMCP } from './webmcp'

setupWebMCP();
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
