/// <reference types="vite/client" />

declare global {
  interface Window {
    webmcp?: { registerTool?: (definition: unknown) => void }
    webmcpTools?: Record<string, { execute: (args?: Record<string, unknown>) => Promise<unknown> | unknown }>
    webmcp_list_tools?: () => unknown
    webmcp_invoke_tool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>
    webmcp_session_info?: () => unknown
  }
}

export {}
