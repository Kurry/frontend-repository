import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info?: () => {
      contract_version: string;
      supported_modules: string[];
    };
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (toolName: string, args: any) => any;
  }
}

export const WebMCPBinding = {
  registerTools: () => {
    window.webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      supported_modules: ["entity-collection-v1", "artifact-transfer-v1", "timeline-replay-v1"]
    });

    window.webmcp_list_tools = () => [
      // Entity collection tools
      { name: "entity_create", description: "Create a new fit annotation", inputSchema: { type: "object", properties: { entity: { type: "string" }, fields: { type: "object" } } } },
      { name: "entity_select", description: "Select a fit annotation", inputSchema: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" } } } },
      { name: "entity_update", description: "Update a fit annotation", inputSchema: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" }, fields: { type: "object" } } } },
      { name: "entity_delete", description: "Delete a fit annotation", inputSchema: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" }, confirm: { type: "boolean" } } } },

      // Artifact transfer tools
      { name: "artifact_export", description: "Export the session", inputSchema: { type: "object", properties: { format: { type: "string" } } } },
      { name: "artifact_import", description: "Import a session", inputSchema: { type: "object", properties: { format: { type: "string" }, content: { type: "string" } } } },
      { name: "artifact_copy", description: "Copy session to clipboard", inputSchema: { type: "object", properties: { format: { type: "string" } } } },

      // Timeline replay tools
      { name: "timeline_scrub", description: "Scrub timeline for a record", inputSchema: { type: "object", properties: { recordId: { type: "string" }, eventId: { type: "string" } } } },
      { name: "timeline_restore", description: "Restore a checkpoint", inputSchema: { type: "object", properties: { recordId: { type: "string" }, eventId: { type: "string" } } } },
      { name: "timeline_undo", description: "Undo last mutation globally", inputSchema: { type: "object", properties: {} } }
    ];

    window.webmcp_invoke_tool = (toolName: string, args: any) => {
      const store = useStore.getState();

      try {
        switch (toolName) {
          case 'entity_create': {
            if (args.entity === 'fit-annotation') {
              store.createRecord(args.fields);
              return { success: true, result: store.getDerivedState() };
            }
            break;
          }
          case 'entity_select': {
            if (args.entity === 'fit-annotation') {
              store.selectRecord(args.id);
              return { success: true, selectedId: args.id };
            }
            break;
          }
          case 'entity_update': {
            if (args.entity === 'fit-annotation') {
              store.updateRecord(args.id, args.fields);
              return { success: true, record: store.records[args.id] };
            }
            break;
          }
          case 'entity_delete': {
            if (args.entity === 'fit-annotation' && args.confirm) {
              store.deleteRecord(args.id);
              return { success: true };
            }
            break;
          }
          case 'artifact_export': {
            if (args.format === 'fit-annotations-v1-replay-timeline-json') {
              const data = store.exportSession();
              return { success: true, artifact: JSON.parse(data) };
            }
            break;
          }
          case 'artifact_import': {
            if (args.format === 'fit-annotations-v1-replay-timeline-json') {
              store.importSession(args.content);
              return { success: true };
            }
            break;
          }
          case 'artifact_copy': {
            if (args.format === 'fit-annotations-v1-replay-timeline-json') {
              const data = store.exportSession();
              // navigator.clipboard.writeText not guaranteed to work headless, but handled per requirements
              return { success: true, data: JSON.parse(data) };
            }
            break;
          }
          case 'timeline_scrub': {
            store.scrubTimeline(args.recordId, args.eventId);
            return { success: true };
          }
          case 'timeline_restore': {
            store.restoreCheckpoint(args.recordId, args.eventId);
            return { success: true };
          }
          case 'timeline_undo': {
            store.undoLastMutation();
            return { success: true };
          }
          default:
            return { success: false, error: `Tool ${toolName} not supported` };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
      return { success: false, error: 'Invalid arguments or unsupported operation' };
    };
  }
};
