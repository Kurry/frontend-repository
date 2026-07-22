import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerWebMCP } from './webmcp.js'

// Try to register WebMCP tools
try {
  registerWebMCP()
} catch (e) {
  console.warn('WebMCP registration skipped (dev or not ready)', e)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
