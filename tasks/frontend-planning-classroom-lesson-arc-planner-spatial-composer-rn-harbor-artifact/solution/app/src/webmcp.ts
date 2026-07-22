import { useAppStore } from './store';
import { RecordSchema, SessionSchema } from './schema';

export function setupWebMCP() {
  const toolMeta = [
    {
      name: "entity_create_record",
      module: "entity-collection-v1",
      description: "Create a new lesson block record.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          capacity: { type: "number" },
          status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
        },
        required: ["title", "capacity", "status"]
      }
    },
    {
      name: "entity_read_record",
      module: "entity-collection-v1",
      description: "Read a lesson block record by ID.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_update_record",
      module: "entity-collection-v1",
      description: "Update an existing lesson block record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          capacity: { type: "number" },
          status: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete_record",
      module: "entity-collection-v1",
      description: "Delete a lesson block record.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_list_records",
      module: "entity-collection-v1",
      description: "List all lesson blocks.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "spatial_place_record",
      module: "spatial-composer-v1",
      description: "Place a selected record in a spatial composer zone.",
      inputSchema: {
        type: "object",
        properties: { zoneId: { type: "string" } },
        required: ["zoneId"]
      }
    },
    {
      name: "spatial_undo_mutation",
      module: "spatial-composer-v1",
      description: "Undo the last spatial composer mutation.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "artifact_export_session_json",
      module: "artifact-transfer-v1",
      description: "Export the session artifact.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "artifact_import_session_json",
      module: "artifact-transfer-v1",
      description: "Import a session artifact.",
      inputSchema: {
        type: "object",
        properties: { session: { type: "object" } },
        required: ["session"]
      }
    }
  ];

  const handlers: Record<string, (args: any) => Promise<any>> = {
    entity_create_record: async (args) => {
      const parsed = RecordSchema.omit({ id: true }).parse(args);
      useAppStore.getState().createRecord(parsed);
      return { success: true };
    },
    entity_read_record: async (args) => {
      const rec = useAppStore.getState().records.find(r => r.id === args.id);
      if (!rec) throw new Error("Not found");
      return { record: rec };
    },
    entity_update_record: async (args) => {
      const { id, ...updates } = args;
      useAppStore.getState().updateRecord(id, updates);
      return { success: true };
    },
    entity_delete_record: async (args) => {
      useAppStore.getState().deleteRecord(args.id);
      return { success: true };
    },
    entity_list_records: async () => {
      return { records: useAppStore.getState().records };
    },
    spatial_place_record: async (args) => {
      const res = useAppStore.getState().placeRecord(args.zoneId);
      if (!res.success) throw new Error(res.error);
      return { success: true };
    },
    spatial_undo_mutation: async () => {
      useAppStore.getState().undoMutation();
      return { success: true };
    },
    artifact_export_session_json: async () => {
      const s = useAppStore.getState();
      return {
        session: {
          schemaVersion: 'shapeshift-session-v1',
          exportedAt: new Date().toISOString(),
          records: s.records,
          derived: s.derived,
          history: s.history,
          zones: s.zones,
        }
      };
    },
    artifact_import_session_json: async (args) => {
      const parsed = SessionSchema.parse(args.session);
      useAppStore.getState().clearSession();
      useAppStore.getState().importSession(parsed);
      return { success: true };
    }
  };

  (window as any).webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "spatial-composer-v1"],
    tools: toolMeta.map(t => t.name)
  });

  (window as any).webmcp_list_tools = async () => toolMeta;

  (window as any).webmcp_invoke_tool = async (request: any, separateArguments?: any) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const handler = handlers[name];
    if (!handler) throw new Error(`Tool ${name} not found`);
    return handler(args);
  };
}
