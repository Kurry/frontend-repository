/// <reference types="vite/client" />

declare global {
  interface Window {
    __triageStore?: unknown;
    webmcp_session_info?: () => unknown;
    webmcp_list_tools?: () => unknown;
    webmcp_invoke_tool?: (nameOrRequest: string | { name: string; arguments?: Record<string, unknown> }, args?: Record<string, unknown>) => unknown | Promise<unknown>;
  }
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
      }) => void;
    };
  }
}

export {};
