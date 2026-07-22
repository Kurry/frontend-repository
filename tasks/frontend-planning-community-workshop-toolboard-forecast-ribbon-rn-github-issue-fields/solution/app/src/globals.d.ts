interface Window {
  webmcp_session_info: any;
  webmcp_list_tools: () => any[];
  webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
}
