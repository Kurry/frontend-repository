import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Expose webmcp standard contracts
if (typeof window !== 'undefined') {
  // webmcp implementation is baked into instruction.md and mapped directly to global window object
  // in index.html, but let's make sure it's accessible here too.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
