import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => Record<string, any>[];
    webmcp_invoke_tool: (toolId: string, args: Record<string, any>) => Promise<Record<string, any>>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    capabilities: [
      "entity-collection-v1",
      "structured-editor-v1",
      "artifact-transfer-v1"
    ]
  });

  window.webmcp_list_tools = () => [
    {
      id: "entity-collection-create",
      title: "Create Color",
      module: "entity-collection-v1",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, hex: { type: "string" } },
        required: ["name", "hex"]
      }
    },
    {
      id: "entity-collection-select",
      title: "Select Color",
      module: "entity-collection-v1",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      id: "entity-collection-update",
      title: "Update Color",
      module: "entity-collection-v1",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, updates: { type: "object" } },
        required: ["id", "updates"]
      }
    },
    {
      id: "entity-collection-delete",
      title: "Delete Color",
      module: "entity-collection-v1",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"]
      }
    },
    {
      id: "editor-select",
      title: "Branch Scenario",
      module: "structured-editor-v1",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      id: "editor-update_property",
      title: "Update Scenario Hex",
      module: "structured-editor-v1",
      parameters: {
        type: "object",
        properties: { property: { type: "string" }, value: { type: "string" } },
        required: ["property", "value"]
      }
    },
    {
      id: "editor-set_content",
      title: "Resolve Scenario",
      module: "structured-editor-v1",
      parameters: {
        type: "object",
        properties: { content: { type: "string" } },
        required: ["content"]
      }
    },
    {
      id: "artifact-import",
      title: "Import Session",
      module: "artifact-transfer-v1",
      parameters: {
        type: "object",
        properties: { data: { type: "object" } },
        required: ["data"]
      }
    },
    {
      id: "artifact-export",
      title: "Export Session",
      module: "artifact-transfer-v1",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  window.webmcp_invoke_tool = async (toolId: string, args: Record<string, any>) => {
    const store = useStore.getState();

    switch (toolId) {
      case 'entity-collection-create': {
        store.createRecord({ name: args.name, hex: args.hex });
        return { status: 'success' };
      }
      case 'entity-collection-select': {
        const record = store.records.find(r => r.id === args.id);
        return record ? { status: 'success', entity: record } : { status: 'error', message: 'Not found' };
      }
      case 'entity-collection-update': {
        store.updateRecord(args.id, args.updates);
        return { status: 'success' };
      }
      case 'entity-collection-delete': {
        if (!args.confirm) return { status: 'error', message: 'confirm=true required' };
        store.deleteRecord(args.id);
        return { status: 'success' };
      }
      case 'editor-select': {
        store.branchToScenario(args.id);
        return { status: 'success' };
      }
      case 'editor-update_property': {
        if (args.property === 'hex') {
          store.updateScenarioHex(args.value);
          return { status: 'success' };
        }
        return { status: 'error', message: 'Unknown property' };
      }
      case 'editor-set_content': {
        // We use set_content mapped to "Resolve Scenario" based on PRD
        store.resolveScenario(args.content as any);
        return { status: 'success' };
      }
      case 'artifact-import': {
        const result = store.importSession(args.data);
        if (result.success) return { status: 'success' };
        return { status: 'error', errors: result.errors };
      }
      case 'artifact-export': {
        const data = store.exportSession();
        return { status: 'success', data };
      }
      default:
        throw new Error(`Tool not found: ${toolId}`);
    }
  };
}
