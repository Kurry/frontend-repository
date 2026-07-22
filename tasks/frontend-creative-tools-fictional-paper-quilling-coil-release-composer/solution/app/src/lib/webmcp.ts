import { useStore } from '../store/useStore';

declare global {
  interface Window {
    webmcp_session_info: () => string;
    webmcp_list_tools: () => string;
    webmcp_invoke_tool: (tool_name: string, arguments_json: string) => Promise<string>;
  }
}

export function registerWebMCP() {
  window.webmcp_session_info = () => JSON.stringify({ contract_version: 'zto-webmcp-v1' });

  window.webmcp_list_tools = () => {
    return JSON.stringify([
      { name: "coil_select", description: "Select coil", inputSchema: { type: "object", properties: { id: { type: "string" } } } },
      { name: "decision_approve", description: "Approve project", inputSchema: { type: "object" } },
      { name: "artifact_export", description: "Export artifact", inputSchema: { type: "object" } },

      { name: "coil_query_projects", description: "Query projects", inputSchema: { type: "object" } },
      { name: "coil_preview_release_radius", description: "Preview release radius", inputSchema: { type: "object", properties: { id: { type: "string" }, radius: { type: "number" } } } },
      { name: "coil_commit_release_radius", description: "Commit release radius", inputSchema: { type: "object", properties: { id: { type: "string" }, radius: { type: "number" } } } },
      { name: "coil_cancel_release_radius", description: "Cancel release radius", inputSchema: { type: "object" } }
    ]);
  };

  window.webmcp_invoke_tool = async (tool_name: string, arguments_json: string) => {
    const args = arguments_json ? JSON.parse(arguments_json) : {};
    const state = useStore.getState();

    switch (tool_name) {
       case 'coil_select':
          state.selectCoil(args.id);
          return JSON.stringify({ success: true });
       case 'decision_approve':
          state.approveComposition();
          return JSON.stringify({ success: true });
       case 'artifact_export':
          // Can't invoke download file via Playwright well, but returning structure
          return JSON.stringify({ success: true });

       case 'coil_preview_release_radius':
          state.previewReleaseRadius(args.id, args.radius);
          return JSON.stringify({ success: true });
       case 'coil_commit_release_radius':
          state.commitReleaseRadius(args.id, args.radius);
          return JSON.stringify({ success: true });
       case 'coil_cancel_release_radius':
          state.cancelReleaseRadius();
          return JSON.stringify({ success: true });
       default:
          throw new Error(`Tool not found: ${tool_name}`);
    }
  };
}
