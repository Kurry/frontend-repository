import type { AppState } from "./store";
import type { IngredientRecord, DomainStatus, PantryNutritionStockLedgerSession } from "./types";

declare global {
  interface Window {
    __store: {
      getState: () => AppState;
      dispatch: any;
    };
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}

export {};

window.webmcp_session_info = async () => {
  return {
    taskId: "eval-intelligence/frontend-data-tracking-pantry-nutrition-stock-ledger-constraint-canvas-rn-linear-views",
    contractVersion: "1.0",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  };
};

window.webmcp_list_tools = async () => {
  return [
    {
      name: "entity_create_record",
      description: "Create an ingredient record in the collection.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          status: { type: "string" },
          notes: { type: "string" }
        },
        required: ["name", "quantity", "unit"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an ingredient record in the collection.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          status: { type: "string" },
          notes: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete_record",
      description: "Delete an ingredient record in the collection.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_query_records",
      description: "Query ingredient records.",
      inputSchema: {
        type: "object",
        properties: {
          filter: { type: "object" }
        }
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the session artifact as JSON.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session artifact.",
      inputSchema: {
        type: "object",
        properties: {
          payload: { type: "object" }
        },
        required: ["payload"]
      }
    }
  ];
};

window.webmcp_invoke_tool = async (toolName: string, args: any) => {
  const store = window.__store;
  if (!store) throw new Error("Store not initialized");

  switch (toolName) {
    case "entity_create_record": {
      const { name, quantity, unit, status, notes } = args;
      const newRecord: IngredientRecord = {
        id: crypto.randomUUID(),
        name,
        quantity,
        unit,
        status: (status as DomainStatus) || "empty",
        notes: notes || "",
        constraintCanvasState: { x: 0, y: 0 }
      };
      store.dispatch({ type: "CREATE_RECORD", payload: newRecord });
      return { success: true, record: newRecord };
    }

    case "entity_update_record": {
      const { id, ...updates } = args;
      const state = store.getState();
      const existing = state.records.find((r: IngredientRecord) => r.id === id);
      if (!existing) throw new Error(`Record ${id} not found`);

      const updatedRecord = { ...existing, ...updates };
      store.dispatch({ type: "UPDATE_RECORD", payload: updatedRecord });
      return { success: true, record: updatedRecord };
    }

    case "entity_delete_record": {
      const { id } = args;
      store.dispatch({ type: "DELETE_RECORD", payload: id });
      return { success: true, id };
    }

    case "entity_query_records": {
      return { success: true, records: store.getState().records };
    }

    case "artifact_export_session_json": {
      const state = store.getState();
      const lanes: DomainStatus[] = ["empty", "draft", "ready", "changed", "archived"];
      const derived = {
        summary: {
          totalIngredients: state.records.length,
          statusCounts: lanes.reduce((acc, lane) => {
            acc[lane] = state.records.filter((r) => r.status === lane).length;
            return acc;
          }, {} as Record<DomainStatus, number>)
        }
      };

      const artifact: PantryNutritionStockLedgerSession = {
        schemaVersion: "nutrition-stock-v1",
        exportedAt: new Date().toISOString(),
        records: state.records,
        derived,
        history: state.history
      };

      return { success: true, artifact };
    }

    case "artifact_import_session_json": {
      const payload = args.payload;

      if (payload.schemaVersion !== "nutrition-stock-v1") {
        throw new Error("Invalid schemaVersion");
      }
      if (!payload.records || !payload.derived || !payload.history) {
        throw new Error("Missing required fields");
      }

      const newState = {
        records: payload.records,
        history: payload.history,
        undoStack: [],
        selectedRecordId: null,
      };

      store.dispatch({ type: "IMPORT_STATE", payload: newState });
      return { success: true, message: "Import successful" };
    }

    default:
      throw new Error(`Tool ${toolName} not found`);
  }
};
