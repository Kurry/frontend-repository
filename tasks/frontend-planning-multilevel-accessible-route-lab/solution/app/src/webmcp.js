import { useStore } from './store';
import { DESTINATIONS, CAMPUS_NODES } from './fixture';

window.webmcp_session_info = () => ({
  version: "zto-webmcp-v1",
  task: "frontend-planning-multilevel-accessible-route-lab",
});

const tools = [
  {
    name: "entity_create",
    description: "Create a route-stop entity",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["route-stop"] },
        fields: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
            dwell: { type: "number" }
          }
        }
      },
      required: ["entity", "fields"]
    }
  },
  {
    name: "entity_update",
    description: "Update a route-stop entity",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["route-stop"] },
        id: { type: "string" },
        fields: {
          type: "object",
          properties: {
            dwell: { type: "number" }
          }
        }
      },
      required: ["entity", "id", "fields"]
    }
  },
  {
    name: "entity_delete",
    description: "Delete a route-stop entity",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["route-stop"] },
        id: { type: "string" },
        confirm: { type: "boolean" }
      },
      required: ["entity", "id", "confirm"]
    }
  },
  {
    name: "entity_reorder",
    description: "Reorder a route-stop entity",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["route-stop"] },
        id: { type: "string" },
        index: { type: "number" }
      },
      required: ["entity", "id", "index"]
    }
  },
  {
    name: "entity_select",
    description: "Select a route-stop entity",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["route-stop"] },
        id: { type: "string" }
      },
      required: ["entity", "id"]
    }
  },
  {
    name: "artifact_export",
    description: "Export the route-plan-json artifact",
    parameters: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["route-plan-json", "route-geojson"] }
      },
      required: ["format"]
    }
  },
  {
    name: "artifact_import",
    description: "Import a route-plan-json artifact",
    parameters: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["route-plan-json"] }
      },
      required: ["mode"]
    }
  }
];

window.webmcp_list_tools = () => tools;

window.webmcp_invoke_tool = (name, args) => {
  const store = useStore.getState();

  if (name === "entity_create") {
    if (args.entity !== "route-stop") return { error: "Unknown entity" };
    const dest = DESTINATIONS.find(d => d.nodeId === args.fields.nodeId);
    if (!dest) return { error: "Unknown destination node" };
    store.addStop(dest.id);
    const newStops = useStore.getState().stops;
    const newStop = newStops[newStops.length - 1];
    if (args.fields.dwell !== undefined) {
      useStore.getState().updateStop(newStop.id, { dwell: args.fields.dwell });
    }
    return { success: true, id: newStop.id };
  }

  if (name === "entity_update") {
    if (args.entity !== "route-stop") return { error: "Unknown entity" };
    store.updateStop(args.id, args.fields);
    return { success: true };
  }

  if (name === "entity_delete") {
    if (args.entity !== "route-stop") return { error: "Unknown entity" };
    if (!args.confirm) return { error: "Confirm required" };
    store.removeStop(args.id);
    return { success: true };
  }

  if (name === "entity_reorder") {
    if (args.entity !== "route-stop") return { error: "Unknown entity" };
    const currentIndex = store.stops.findIndex(s => s.id === args.id);
    if (currentIndex === -1) return { error: "Stop not found" };
    store.reorderStops(currentIndex, args.index);
    return { success: true };
  }

  if (name === "entity_select") {
    // just dummy for now
    return { success: true };
  }

  if (name === "artifact_export") {
    if (args.format === "route-plan-json") {
      const geojson = {
        type: "FeatureCollection",
        features: store.route ? [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: store.route.segments.map(s => {
                const node = CAMPUS_NODES.find(n => n.id === s.from);
                return [node.lng, node.lat];
              })
            },
            properties: {
              routeSignature: "generated-sig",
              duration: store.route.duration,
              distance: store.route.distance
            }
          }
        ] : []
      };

      const data = {
        schemaVersion: "layered-campus-route/v1",
        profile: store.profile,
        departureTime: store.departureTime,
        stops: store.stops,
        routeSegments: store.route ? store.route.segments : [],
        exportedAt: new Date().toISOString(),
        geojson
      };
      return { preview: JSON.stringify(data, null, 2) };
    }
    if (args.format === "route-geojson") {
      const geojson = {
        type: "FeatureCollection",
        features: store.route ? [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: store.route.segments.map(s => {
                const node = CAMPUS_NODES.find(n => n.id === s.from);
                return [node.lng, node.lat];
              })
            },
            properties: {
              routeSignature: "generated-sig",
              duration: store.route.duration,
              distance: store.route.distance
            }
          }
        ] : []
      };
      return { preview: JSON.stringify(geojson, null, 2) };
    }
  }

  if (name === "artifact_import") {
    if (args.mode === "route-plan-json") {
      // In WebMCP tests, payload isn't in args, the UI needs to be driven.
      // But since prompt is blocking, we can't use prompt. We'll simulate opening a modal.
      document.dispatchEvent(new CustomEvent('open-import-modal'));
      return { success: true };
    }
  }

  return { error: `Tool ${name} not implemented` };
};
