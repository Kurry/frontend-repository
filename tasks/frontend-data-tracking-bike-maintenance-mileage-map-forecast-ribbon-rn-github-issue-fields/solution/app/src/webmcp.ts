import { useStore } from './store';
import { BikeMaintenanceMileageMapSession } from './types';

export function setupWebMCP() {
  (window as any).webmcp_session_info = () => {
    return {
      appName: "Bike Maintenance Mileage Map",
      version: "1.0.0",
      description: "Manage bike service records and forecast mileage.",
      schema: "bike-maintenance-v1"
    };
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "query_state",
        description: "Returns the current full session artifact and derived state.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "create_record",
        description: "Creates a new service record.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            mileage: { type: "number" },
            date: { type: "string" }
          },
          required: ["title", "mileage", "date"]
        }
      },
      {
        name: "update_record",
        description: "Updates an existing service record.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            mileage: { type: "number" },
            date: { type: "string" },
            status: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "delete_record",
        description: "Deletes a service record by id.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "adjust_forecast",
        description: "Adjusts the projected mileage of a record using the forecast ribbon.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            projectedMileage: { type: "number" }
          },
          required: ["id", "projectedMileage"]
        }
      },
      {
        name: "import_session",
        description: "Imports a full JSON session artifact to restore state.",
        inputSchema: {
          type: "object",
          properties: {
            jsonString: { type: "string" }
          },
          required: ["jsonString"]
        }
      },
      {
        name: "undo",
        description: "Undoes the last action.",
        inputSchema: { type: "object", properties: {} }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
    const store = useStore.getState();

    switch (toolName) {
      case 'query_state':
        return {
          result: {
            state: JSON.parse(store.exportSession()) as BikeMaintenanceMileageMapSession
          }
        };

      case 'create_record':
        store.addRecord({
          title: args.title,
          mileage: args.mileage,
          date: args.date
        });
        return { result: { success: true } };

      case 'update_record':
        store.updateRecord(args.id, args);
        return { result: { success: true } };

      case 'delete_record':
        store.deleteRecord(args.id);
        return { result: { success: true } };

      case 'adjust_forecast':
        store.adjustForecast(args.id, args.projectedMileage);
        return { result: { success: true } };

      case 'import_session':
        store.importSession(args.jsonString);
        return { result: { success: true } };

      case 'undo':
        store.undo();
        return { result: { success: true } };

      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  };
}
