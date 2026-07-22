import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = {
  task_id: "frontend-data-tracking-bike-maintenance-mileage-map-recovery-board-rn-canva-live-preview",
  session_version: "1.0.0"
};

window.webmcp_list_tools = function() {
  return [
    {
      name: "query_state",
      description: "Query the current state of bike service records and recovery board",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "create_record",
      description: "Create a new bike service record",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["title", "status"]
      }
    },
    {
      name: "update_record",
      description: "Update an existing bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_record",
      description: "Delete a bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "move_to_recovery",
      description: "Move a failed record into a recovery path and repair its downstream consequences",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          recoveryAction: { type: "string" }
        },
        required: ["id", "recoveryAction"]
      }
    },
    {
      name: "undo_last_mutation",
      description: "Undo the last mutation",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "export_artifact",
      description: "Export the portable work artifact",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "import_artifact",
      description: "Import the portable work artifact",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    },
    {
      name: "clear_state",
      description: "Clear the current state",
      inputSchema: { type: "object", properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = function(name: string, args: any) {
  const store = useStore.getState();

  try {
    switch (name) {
      case "query_state":
        return store.current;

      case "create_record": {
        const distance = args.distance !== undefined ? args.distance : 0;
        store.createRecord({
          title: args.title,
          status: args.status,
          distance: distance,
          notes: args.notes
        });
        return { success: true, state: useStore.getState().current };
      }

      case "update_record": {
        const updateData: any = {};
        if (args.title !== undefined) updateData.title = args.title;
        if (args.status !== undefined) updateData.status = args.status;
        if (args.distance !== undefined) updateData.distance = args.distance;
        if (args.notes !== undefined) updateData.notes = args.notes;
        store.updateRecord(args.id, updateData);
        return { success: true, state: useStore.getState().current };
      }

      case "delete_record":
        store.deleteRecord(args.id);
        return { success: true, state: useStore.getState().current };

      case "move_to_recovery":
        store.moveToRecovery(args.id, args.recoveryAction);
        return { success: true, state: useStore.getState().current };

      case "undo_last_mutation":
        store.undo();
        return { success: true, state: useStore.getState().current };

      case "export_artifact":
        return JSON.parse(store.exportArtifact());

      case "import_artifact":
        const success = store.importArtifact(args.data);
        if (!success) throw new Error("Invalid artifact format");
        return { success: true, state: useStore.getState().current };

      case "clear_state":
        store.clearState();
        return { success: true, state: useStore.getState().current };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return { error: error.message };
  }
};
