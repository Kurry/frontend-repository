import { useStore } from './store';
import { BikeRecord } from './types';

interface ToolSchema {
  name: string;
  description: string;
  parameters: any;
}

const tools: ToolSchema[] = [
  {
    name: "create_record",
    description: "Creates a new bike service record",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        mileage: { type: "number" },
        service_type: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["id", "mileage", "service_type", "status"]
    }
  },
  {
    name: "query_records",
    description: "Queries all existing bike service records.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "mutate_spatial_composer",
    description: "Places a selected record in a spatial composer and rebalances capacity.",
    parameters: {
      type: "object",
      properties: {
        record_id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" }
      },
      required: ["record_id", "x", "y"]
    }
  },
  {
    name: "query_derived_state",
    description: "Queries the derived spatial capacity summary and state.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "undo_mutation",
    description: "Reverses the last recorded mutation.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "export_artifact",
    description: "Exports the full portable artifact to a JSON string payload.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "import_artifact",
    description: "Imports and loads a previously exported portable JSON payload.",
    parameters: {
      type: "object",
      properties: {
        payload: { type: "string" }
      },
      required: ["payload"]
    }
  }
];

// Attach to window
(window as any).webmcp_session_info = () => ({
  taskId: "frontend-data-tracking-bike-maintenance-mileage-map-spatial-composer-rn-provenance-artifact",
  schemaVersion: "v1"
});

(window as any).webmcp_list_tools = () => tools;

(window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
  const store = useStore.getState();

  switch (toolName) {
    case 'create_record':
      store.addRecord(args as BikeRecord);
      return { success: true, record: args };

    case 'query_records':
      return { records: store.records };

    case 'mutate_spatial_composer':
      store.mutateSpatialComposer(args.record_id, args.x, args.y);
      return { success: true };

    case 'query_derived_state':
      const capacity_used = store.spatialState.length;
      return {
        capacity_used,
        capacity_total: 10,
        spatialState: store.spatialState
      };

    case 'undo_mutation':
      store.undo();
      return { success: true };

    case 'export_artifact':
      return { payload: store.exportArtifact() };

    case 'import_artifact':
      store.importArtifact(args.payload);
      return { success: true };

    default:
      throw new Error(`Tool not found: ${toolName}`);
  }
};
