import { useStore } from './store';

export function setupWebMCPBindings() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  (window as any).webmcp_list_tools = () => [
    {
      name: "editor_select",
      description: "Select an entity",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "editor_preview",
      description: "Preview gap weave",
      inputSchema: { type: "object", properties: { gapId: { type: "string" }, requestId: { type: "string" }, benchId: { type: "string" } }, required: ["gapId", "requestId", "benchId"] }
    },
    {
      name: "editor_update_property",
      description: "Update property",
      inputSchema: { type: "object" }
    },
    {
      name: "editor_set_content",
      description: "Commit gap weave",
      inputSchema: { type: "object" }
    },
    {
      name: "entity_select",
      description: "Select schedule entity",
      inputSchema: { type: "object" }
    }
  ];

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = useStore.getState();
    switch (toolName) {
      case "editor_select":
      case "entity_select":
        store.setSelectedEntityId(args.id);
        return { success: true };
      case "editor_preview":
        store.previewWeave(args.gapId, args.requestId, args.benchId);
        return { success: true };
      case "editor_set_content":
        store.commitWeave();
        return { success: true };
      default:
        return { error: `Tool ${toolName} not implemented` };
    }
  };
}
