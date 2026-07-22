import { useEffect } from 'react';
import { StoryboardCameraPathEditorSession } from './types';

interface WebMCPProps {
  session: StoryboardCameraPathEditorSession;
  dispatch: (action: string, payload: any) => any;
}

export function WebMCP({ session, dispatch }: WebMCPProps) {
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      session_state: session
    });

    (window as any).webmcp_list_tools = () => [
      { name: "editor_select", description: "Select record to edit", inputSchema: { type: "object", properties: { id: { type: "string" } } } },
      { name: "editor_update_property", description: "Update property", inputSchema: { type: "object", properties: { property: { type: "string" }, value: { type: "any" } } } },
      { name: "editor_switch_mode", description: "Switch between edit/view/audit mode", inputSchema: { type: "object", properties: { mode: { type: "string" } } } },
      { name: "editor_preview", description: "Preview", inputSchema: { type: "object" } },
      { name: "editor_set_content", description: "Set content", inputSchema: { type: "object", properties: { content: { type: "any" } } } },
      { name: "entity_create", description: "Create record", inputSchema: { type: "object" } },
      { name: "entity_select", description: "Select record", inputSchema: { type: "object", properties: { id: { type: "string" } } } },
      { name: "entity_update", description: "Update record", inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, tag: { type: "string" } } } },
      { name: "entity_delete", description: "Delete record", inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } } } },
      { name: "entity_toggle", description: "Toggle record state", inputSchema: { type: "object", properties: { id: { type: "string" }, field: { type: "string" }, value: { type: "any" } } } },
      { name: "artifact_export", description: "Export session JSON", inputSchema: { type: "object" } },
      { name: "artifact_import", description: "Import session JSON", inputSchema: { type: "object", properties: { sessionData: { type: "object" } } } },
      { name: "artifact_copy", description: "Copy session JSON", inputSchema: { type: "object" } }
    ];

    (window as any).webmcp_invoke_tool = (tool: string, args: any) => {
      const result = dispatch(tool, args);
      return result || { success: true, result: `Invoked ${tool}` };
    };

    return () => {
      delete (window as any).webmcp_session_info;
      delete (window as any).webmcp_list_tools;
      delete (window as any).webmcp_invoke_tool;
    };
  }, [session, dispatch]);

  return null;
}
