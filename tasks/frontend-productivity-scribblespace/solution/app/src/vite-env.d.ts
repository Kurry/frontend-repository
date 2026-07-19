/// <reference types="vite/client" />

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, unknown>;
    webmcp_list_tools: () => { name: string; description: string }[];
    webmcp_invoke_tool: (name: string, args?: Record<string, unknown>) => unknown;
  }
}

export {};
