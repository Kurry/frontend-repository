import { useAppStore } from './store';
import type { ClassroomLessonArcPlannerSession, LessonBlock } from './types';

// We need to inject webmcp types into the global scope
declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (request: any, separateArguments?: any) => Promise<any>;
    webmcp: {
        sessionInfo: () => Promise<any>;
        listTools: () => Promise<any[]>;
        invokeTool: (request: any, separateArguments?: any) => Promise<any>;
    };
  }
}

export function registerWebMcp() {
  const store = useAppStore.getState();

  const toolMeta = [
    {
      name: "entity_create_record",
      module: "entity-collection-v1",
      description: "Create a new lesson block.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          duration: { type: "number" },
          lane: { type: "string" }
        },
        required: ["title", "duration", "lane"]
      }
    },
    {
      name: "entity_update_record",
      module: "entity-collection-v1",
      description: "Update an existing lesson block.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          duration: { type: "number" },
          lane: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
        name: "entity_delete_record",
        module: "entity-collection-v1",
        description: "Delete a lesson block",
        inputSchema: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"]
        }
    },
    {
      name: "artifact_export_session_json",
      module: "artifact-transfer-v1",
      description: "Export the current session as JSON.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      module: "artifact-transfer-v1",
      description: "Import a session from JSON.",
      inputSchema: {
        type: "object",
        properties: {
          session: {
              type: "object"
          }
        },
        required: ["session"]
      }
    }
  ];

  const handlers: Record<string, (args: any) => Promise<any>> = {
    entity_create_record: async (args: any) => {
      // Validate boundaries as instructed
      if (args.duration < 10 || args.duration > 120) {
          throw new Error("Invalid duration bound");
      }

      const record: Omit<LessonBlock, "id" | "status"> = {
          title: args.title,
          description: args.description || "",
          duration: args.duration,
          lane: args.lane
      };
      useAppStore.getState().addRecord(record);
      return { success: true };
    },
    entity_update_record: async (args: any) => {
      if (args.duration !== undefined && (args.duration < 10 || args.duration > 120)) {
          throw new Error("Invalid duration bound");
      }

      const { id, ...updates } = args;
      useAppStore.getState().updateRecord(id, updates);
      return { success: true };
    },
    entity_delete_record: async (args: any) => {
        useAppStore.getState().deleteRecord(args.id);
        return { success: true };
    },
    artifact_export_session_json: async () => {
      const data = useAppStore.getState().exportSession();
      return { artifact: data };
    },
    artifact_import_session_json: async (args: any) => {
      const session = args.session || args.artifact || args.data;
      if (!session || session.schemaVersion !== "v1" || !Array.isArray(session.records)) {
          return { error: "Malformed schema" }; // no mutation
      }
      const ids = new Set();
      for (const r of session.records) {
          if (ids.has(r.id)) return { error: "Duplicate IDs" };
          if (r.duration < 10 || r.duration > 120) return { error: "Invalid bounds" };
          ids.add(r.id);
      }
      useAppStore.getState().importSession(session);
      return { success: true };
    }
  };

  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-planning-classroom-lesson-arc-planner-constraint-canvas-rn-linear-views",
    version: "1.0",
    capabilities: ["entity-collection-v1", "artifact-transfer-v1"],
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"],
  });

  window.webmcp_list_tools = async () => toolMeta;

  window.webmcp_invoke_tool = async (request: any, separateArguments?: any) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const handler = handlers[name];
    if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
    return handler(args);
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
