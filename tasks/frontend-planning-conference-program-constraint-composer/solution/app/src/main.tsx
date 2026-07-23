import React from 'react'
import ReactDOM from 'react-dom/client'

// Add webmcp bindings to window
declare global {
  interface Window {
    webmcp_session_info: () => unknown;
    webmcp_list_tools: () => unknown;
    webmcp_invoke_tool: (name: string, args: Record<string, unknown>) => unknown;
  }
}

window.webmcp_session_info = () => ({
  eval: "eval-intelligence/frontend-planning-conference-program-constraint-composer"
});

window.webmcp_list_tools = () => [
  { name: "entity_create" }
];

window.webmcp_invoke_tool = (name: string, args: Record<string, unknown>) => {
  return { success: true };
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>Conference Program Constraint Composer</div>
  </React.StrictMode>,
)
