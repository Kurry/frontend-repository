import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// WebMCP Contract
declare global {
  interface Window {
    webmcp_session_info?: any;
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (name: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = {
  app_name: "Household Load-Shift Planner",
  version: "1.0.0"
};
window.webmcp_list_tools = () => [];
window.webmcp_invoke_tool = async () => ({ status: "success" });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
