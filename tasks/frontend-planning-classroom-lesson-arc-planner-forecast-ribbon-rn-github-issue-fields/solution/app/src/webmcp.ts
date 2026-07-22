import { store, ClassroomSession, LessonBlock, LessonStatus, ForecastState } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-planning-classroom-lesson-arc-planner-forecast-ribbon-rn-github-issue-fields",
});

window.webmcp_list_tools = async () => [
  {
    name: "entity_read_collection",
    description: "Read the collection of lesson blocks and derived state.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "entity_create_record",
    description: "Create a new lesson block.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        duration: { type: "number" },
        status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
      },
      required: ["id", "title", "duration", "status"],
    },
  },
  {
    name: "entity_update_record",
    description: "Update an existing lesson block, including forecast state.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        duration: { type: "number" },
        status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
        forecastRibbonState: { type: "string", enum: ["idle", "selected", "changed", "conflict", "resolved"] },
      },
      required: ["id"],
    },
  },
  {
    name: "artifact_export_session_json",
    description: "Export the current session state as JSON artifact.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "artifact_import_session_json",
    description: "Import a session state from a JSON artifact.",
    inputSchema: {
      type: "object",
      properties: {
        document: { type: "object" },
      },
      required: ["document"],
    },
  },
  {
    name: "forecast_ribbon_undo",
    description: "Undo the last mutation.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  }
];

window.webmcp_invoke_tool = async (name: string, args: any) => {
  switch (name) {
    case "entity_read_collection": {
      return store.getState();
    }
    case "entity_create_record": {
      store.addRecord({
        id: args.id,
        title: args.title,
        duration: args.duration,
        status: args.status as LessonStatus,
        forecastRibbonState: 'idle'
      });
      return { success: true };
    }
    case "entity_update_record": {
      const updates: Partial<LessonBlock> = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.duration !== undefined) updates.duration = args.duration;
      if (args.status !== undefined) updates.status = args.status as LessonStatus;
      if (args.forecastRibbonState !== undefined) updates.forecastRibbonState = args.forecastRibbonState as ForecastState;

      store.updateRecord(args.id, updates);
      return { success: true };
    }
    case "artifact_export_session_json": {
      const state = store.getState();
      const exportState = {
        ...state,
        exportedAt: new Date().toISOString()
      };
      return exportState;
    }
    case "artifact_import_session_json": {
      try {
        const session = args.document as ClassroomSession;
        // Basic validation
        if (session.schemaVersion !== 'lesson-arc-v1' || !Array.isArray(session.records)) {
          throw new Error("Invalid schema");
        }
        store.importSession({
          ...session,
          exportedAt: new Date().toISOString()
        });
        return { success: true };
      } catch (e) {
        throw new Error("Import failed: validation error");
      }
    }
    case "forecast_ribbon_undo": {
      store.undo();
      return { success: true };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};
