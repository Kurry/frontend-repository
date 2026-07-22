import { useStore } from './store';

const contractInfo = {
  contract_version: "zto-webmcp-v1",
  modules: [
    "structured-editor-v1",
    "entity-collection-v1",
    "artifact-transfer-v1"
  ]
};

const getStore = () => useStore.getState();

const tools = [
  // structured-editor-v1
  {
    name: "editor_select",
    description: "Select a scenario card for editing",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "editor_update_property",
    description: "Update a property of the selected scenario card (e.g. cost, likelihood, state)",
    input_schema: {
      type: "object",
      properties: {
        property: { type: "string" },
        value: { type: ["string", "number"] }
      },
      required: ["property", "value"]
    }
  },
  {
    name: "editor_switch_mode",
    description: "Switch editor modes (not explicitly needed but provided for contract)",
    input_schema: { type: "object", properties: { mode: { type: "string" } }, required: ["mode"] }
  },

  // entity-collection-v1
  {
    name: "collection_query",
    description: "Query scenarios, optionally filtered by state",
    input_schema: {
      type: "object",
      properties: { filter_by_state: { type: "string" } },
      required: []
    }
  },

  // artifact-transfer-v1
  {
    name: "artifact_export",
    description: "Export the current session state as JSON",
    input_schema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "artifact_import",
    description: "Import a JSON session artifact",
    input_schema: {
      type: "object",
      properties: { data: { type: "string" } },
      required: ["data"]
    }
  }
];

export function initWebMCP() {
  window.webmcp_session_info = () => contractInfo;

  window.webmcp_list_tools = () => tools;

  window.webmcp_invoke_tool = (name, args) => {
    const store = getStore();

    switch (name) {
      // structured-editor-v1
      case 'editor_select': {
        const { id } = args;
        const recordExists = store.records.find(r => r.id === id);
        if (!recordExists) return JSON.stringify({ error: 'Record not found' });
        store.setSelectedId(id);
        return JSON.stringify({ success: true, selectedId: id });
      }
      case 'editor_update_property': {
        const { property, value } = args;
        const id = store.selectedId;
        if (!id) return JSON.stringify({ error: 'No record selected' });

        let validValue = value;
        if (property === 'cost' || property === 'likelihood') {
          validValue = Number(value);
          if (isNaN(validValue) || validValue < 0 || validValue > 100) {
            return JSON.stringify({ error: 'Value out of bounds (0-100)' });
          }
        }
        if (property === 'title' && typeof validValue === 'string') {
            if (validValue.trim() === '') return JSON.stringify({ error: 'Title cannot be empty' });
            const isDuplicate = store.records.some(r => r.id !== id && r.title.toLowerCase() === validValue.trim().toLowerCase());
            if (isDuplicate) return JSON.stringify({ error: 'Title must be unique' });
        }

        store.updateRecord(id, { [property]: validValue });
        return JSON.stringify({ success: true, id, property, value: validValue });
      }
      case 'editor_switch_mode': {
        return JSON.stringify({ success: true, message: 'Mode switched' });
      }

      // entity-collection-v1
      case 'collection_query': {
        const { filter_by_state } = args;
        let result = store.records;
        if (filter_by_state && filter_by_state !== 'all') {
          result = result.filter(r => r.state === filter_by_state);
        }
        return JSON.stringify({ records: result });
      }

      // artifact-transfer-v1
      case 'artifact_export': {
        const data = {
          schemaVersion: 'scenario-builder-v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          history: store.history
        };
        return JSON.stringify({ artifact: JSON.stringify(data, null, 2) });
      }
      case 'artifact_import': {
        try {
          const parsed = JSON.parse(args.data);
          if (parsed.schemaVersion !== 'scenario-builder-v1') {
            return JSON.stringify({ error: 'Invalid schema version' });
          }
          store.clearData();
          store.importData(parsed);
          return JSON.stringify({ success: true });
        } catch (e) {
          return JSON.stringify({ error: e.message });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  };
}
