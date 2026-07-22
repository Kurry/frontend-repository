import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WebMCPContext } from './WebMCPContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WebMCPContext>
      <App />
    </WebMCPContext>
  </React.StrictMode>,
)
