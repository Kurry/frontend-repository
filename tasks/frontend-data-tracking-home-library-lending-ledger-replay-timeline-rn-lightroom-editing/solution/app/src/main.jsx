import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Required WebMCP globals setup
window.webmcp_list_tools = async () => [];
window.webmcp_invoke_tool = async (name, args) => ({});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
