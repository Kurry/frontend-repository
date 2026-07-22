import { useEffect } from 'react';
import { useStore } from '../store/store';

export default function WebMCP() {
  const store = useStore();

  useEffect(() => {
    // Define the tools
    window.webmcp_list_tools = () => {
      return [
        {
          name: "get_state",
          description: "Returns the current session state",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "import_session",
          description: "Imports a valid session JSON object",
          inputSchema: {
            type: "object",
            properties: {
              session: { type: "object" }
            },
            required: ["session"]
          }
        },
        {
          name: "clear_session",
          description: "Clears the current session",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "add_record",
          description: "Creates a new recipe ingredient",
          inputSchema: {
            type: "object",
            properties: {
              record: { type: "object" }
            },
            required: ["record"]
          }
        },
        {
          name: "update_record",
          description: "Updates an existing recipe ingredient",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              updates: { type: "object" }
            },
            required: ["id", "updates"]
          }
        },
        {
          name: "delete_record",
          description: "Deletes a recipe ingredient",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" }
            },
            required: ["id"]
          }
        },
        {
          name: "place_in_composer",
          description: "Places a selected record in the spatial composer",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              x: { type: "number" },
              y: { type: "number" }
            },
            required: ["id", "x", "y"]
          }
        },
        {
          name: "undo",
          description: "Undoes the last action",
          inputSchema: { type: "object", properties: {} }
        }
      ];
    };

    // Define tool invocation
    window.webmcp_invoke_tool = (name, args) => {
      if (name === "get_state") {
        return store.getExportData();
      }
      if (name === "import_session") {
        try {
          store.importSession(args.session);
          return { success: true };
        } catch (e) {
          return { error: e.message };
        }
      }
      if (name === "clear_session") {
        store.clearSession();
        return { success: true };
      }
      if (name === "add_record") {
        store.addRecord(args.record);
        return { success: true };
      }
      if (name === "update_record") {
        store.updateRecord(args.id, args.updates);
        return { success: true };
      }
      if (name === "delete_record") {
        store.deleteRecord(args.id);
        return { success: true };
      }
      if (name === "place_in_composer") {
        store.placeInSpatialComposer(args.id, args.x, args.y);
        return { success: true };
      }
      if (name === "undo") {
        store.undo();
        return { success: true };
      }
      throw new Error(`Tool not found: ${name}`);
    };

    // Standard session info
    window.webmcp_session_info = {
      name: "Recipe Substitution Sandbox WebMCP",
      version: "1.0.0"
    };

    return () => {
      delete window.webmcp_list_tools;
      delete window.webmcp_invoke_tool;
      delete window.webmcp_session_info;
    };
  }, [store]);

  return null;
}
