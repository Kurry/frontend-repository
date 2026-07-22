export {};

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}
