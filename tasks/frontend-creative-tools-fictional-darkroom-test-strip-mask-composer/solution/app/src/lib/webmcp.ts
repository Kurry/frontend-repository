import { useStore } from './store';

export const setupWebMCP = () => {
  (window as any).webmcp_session_info = {
    name: "Fictional Darkroom Test-Strip Mask Composer",
    status: "active"
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "strip_and_masks",
        description: "Query and manipulate negative stage, strip, masks, canvas view, preview mode, and renderer.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      },
      {
        name: "passes_and_intersections",
        description: "Query and manipulate exposure passes, intersections, and cell memberships.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      },
      {
        name: "zone_evidence",
        description: "Query and set zone evidence, selection, filtering, curve samples, histogram, and compare checkpoints.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      },
      {
        name: "decisions_and_corrections",
        description: "Manage preferred-zone decisions, annotations, logical clock, and recipe rebase from corrections.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      },
      {
        name: "history_and_review",
        description: "Query and manipulate event DAG history, undo/redo, branch switching, checkpoints, and review/approval workflow.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      },
      {
        name: "artifacts_and_session",
        description: "Manage ZIP/JSON artifacts, import, export, and session reset.",
        inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } }, required: ["action", "payload"] }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();
    const { action, payload } = args;

    try {
      if (name === "strip_and_masks") {
        if(action === 'commit_mask') {
          store.commitMaskEdit(payload.passId, payload.mask);
          return { status: "success", result: { data: store.passes } };
        }
        if(action === 'query_passes') {
          return { status: "success", result: { data: store.passes } };
        }
        return { status: "success", result: { data: "stub" } };
      } else if (name === "passes_and_intersections") {
        return { status: "success", result: { data: "stub" } };
      } else if (name === "zone_evidence") {
        if(action === 'query_zones') {
           return { status: "success", result: { data: Array.from(store.zoneMetrics.entries()) } };
        }
        return { status: "success", result: { data: "stub" } };
      } else if (name === "decisions_and_corrections") {
        if(action === 'commit_zone_decision') {
           store.commitZoneDecision(payload.zoneId, payload.rationale, payload.sources);
           return { status: "success", result: { data: useStore.getState().decisions } };
        }
        if(action === 'commit_recipe_rebase') {
           store.commitRecipeRebase(payload.passId, payload.newFactor);
           return { status: "success", result: { data: useStore.getState().decisions } };
        }
        return { status: "success", result: { data: "stub" } };
      } else if (name === "history_and_review") {
        if (action === 'query_history') {
           return { status: "success", result: { data: store.history } };
        }
        return { status: "success", result: { data: "stub" } };
      } else if (name === "artifacts_and_session") {
        return { status: "success", result: { data: "stub" } };
      }
    } catch(e: any) {
       return { status: "error", error: e.message };
    }

    return { status: "error", error: "Tool not found" };
  };
};
