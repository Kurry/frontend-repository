/// <reference types="vite/client" />

interface Window {
  webmcp_session_info?: {
    version: string;
    description: string;
  };
  webmcp_list_tools?: () => any[];
  webmcp_invoke_tool?: (name: string, args: any) => any;
}
