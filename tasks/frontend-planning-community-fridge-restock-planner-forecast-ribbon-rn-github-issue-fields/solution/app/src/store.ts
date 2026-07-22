import { create } from 'zustand';
import { State, RestockTask, RecordStatus, CommunityFridgeRestockPlannerSession } from './types';

// For generating unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<State>((set, get) => ({
  records: [],
  selectedRecordId: null,
  history: [],

  createRecord: (task: string, status: RecordStatus) => {
    const id = generateId();
    const newRecord: RestockTask = { id, task, status };

    set((state) => ({
      history: [...state.history, { records: state.records, selectedRecordId: state.selectedRecordId }],
      records: [...state.records, newRecord]
    }));
    return newRecord;
  },

  updateRecord: (id: string, task: string, status: RecordStatus) => {
    let updatedRecord: RestockTask | undefined;

    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          updatedRecord = { ...r, task, status };
          return updatedRecord;
        }
        return r;
      });
      return {
        history: [...state.history, { records: state.records, selectedRecordId: state.selectedRecordId }],
        records: newRecords
      };
    });

    if (!updatedRecord) throw new Error("Record not found");
    return updatedRecord;
  },

  deleteRecord: (id: string) => {
    set((state) => ({
      history: [...state.history, { records: state.records, selectedRecordId: state.selectedRecordId }],
      records: state.records.filter(r => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
    }));
  },

  selectRecord: (id: string | null) => {
    set({ selectedRecordId: id });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        records: prev.records,
        selectedRecordId: prev.selectedRecordId,
        history: state.history.slice(0, -1)
      };
    });
  },

  importSession: (session: CommunityFridgeRestockPlannerSession) => {
    // Basic validation
    if (session.schemaVersion !== "v1" || !Array.isArray(session.records)) {
      throw new Error("Invalid session format");
    }

    // Validate enums
    const validStatuses = ["draft", "ready", "changed", "archived"];
    for (const r of session.records) {
      if (!validStatuses.includes(r.status) || !r.task || !r.id) {
         throw new Error("Invalid record format");
      }
    }

    set({
      records: session.records,
      history: [],
      selectedRecordId: null
    });
  },

  exportSession: (): CommunityFridgeRestockPlannerSession => {
    const state = get();
    const derived = {
      summary: {
        total: state.records.length,
        draft: state.records.filter(r => r.status === "draft").length,
        ready: state.records.filter(r => r.status === "ready").length,
        changed: state.records.filter(r => r.status === "changed").length,
        archived: state.records.filter(r => r.status === "archived").length,
      }
    };
    return {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history // Optionally simplify this if needed
    };
  }
}));

// WebMCP global definitions
declare global {
  interface Window {
    __createRecord: (args: { task: string; status: RecordStatus }) => any;
    __updateRecord: (args: { id: string; task: string; status: RecordStatus }) => any;
    __exportArtifact: () => any;
    __importArtifact: (artifact: string) => any;
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

window.__createRecord = (args) => {
  return useStore.getState().createRecord(args.task, args.status);
};

window.__updateRecord = (args) => {
  return useStore.getState().updateRecord(args.id, args.task, args.status);
};

window.__exportArtifact = () => {
  return useStore.getState().exportSession();
};

window.__importArtifact = (artifactStr: string) => {
  try {
    const parsed = JSON.parse(artifactStr);
    useStore.getState().importSession(parsed);
    return { success: true };
  } catch (e: any) {
    throw new Error(e.message || "Import failed");
  }
};

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-planning-community-fridge-restock-planner-forecast-ribbon-rn-github-issue-fields"
});

window.webmcp_list_tools = async () => ([
  {
    name: "entity_create_record",
    description: "Create a restock task",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["task", "status"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update a restock task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        task: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["id", "task", "status"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the artifact",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import the artifact",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "string" }
      },
      required: ["artifact"]
    }
  }
]);

window.webmcp_invoke_tool = async (name, args) => {
  if (name === "entity_create_record") {
    return window.__createRecord(args);
  }
  if (name === "entity_update_record") {
    return window.__updateRecord(args);
  }
  if (name === "artifact_export_session_json") {
    return window.__exportArtifact();
  }
  if (name === "artifact_import_session_json") {
    return window.__importArtifact(args.artifact);
  }
  throw new Error("Unknown tool");
};
