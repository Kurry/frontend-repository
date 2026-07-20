/// <reference types="svelte" />

declare global {
  interface Window {
    __stagegateConsole?: unknown;
    webmcp_session_info?: () => unknown;
    webmcp_list_tools?: () => unknown;
    webmcp_invoke_tool?: (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>;
  }
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema?: Record<string, unknown>;
        execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
      }) => void;
      unregisterTool?: (name: string) => void;
    };
  }
}

export {};
