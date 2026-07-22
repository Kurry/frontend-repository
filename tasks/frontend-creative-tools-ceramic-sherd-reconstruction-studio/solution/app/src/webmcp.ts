import { getGlobalState, dispatchGlobal } from "./store";

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = async () => ({
  client_name: "eval-intelligence/frontend-creative-tools-ceramic-sherd-reconstruction-studio",
  client_version: "1.0",
  state_hash: getGlobalState().revisions[getGlobalState().currentRevisionId]?.stateHash || "initial"
});

window.webmcp_list_tools = async () => ({
  tools: [
    // structured-editor-v1
    {
      name: "translate_sherd",
      description: "Translates a sherd by given mm",
      inputSchema: {
        type: "object",
        properties: { sherdId: { type: "string" }, txMm: { type: "number" }, tyMm: { type: "number" } },
        required: ["sherdId", "txMm", "tyMm"]
      }
    },
    // entity-collection-v1
    {
      name: "get_sherd",
      description: "Get sherd details",
      inputSchema: {
        type: "object",
        properties: { sherdId: { type: "string" } },
        required: ["sherdId"]
      }
    },
    // browse-query-v1
    {
      name: "query_candidates",
      description: "Query edge candidates",
      inputSchema: {
        type: "object",
        properties: { status: { type: "string" } }
      }
    },
    // form-workflow-v1
    {
      name: "accept_candidate",
      description: "Accepts an edge match candidate with rationale",
      inputSchema: {
        type: "object",
        properties: { candidateId: { type: "string" }, rationale: { type: "string" } },
        required: ["candidateId", "rationale"]
      }
    },
    // command-session-v1
    {
      name: "reveal_late_fragment",
      description: "Reveals SH-29 at logical clock 20",
      inputSchema: { type: "object", properties: {} }
    },
    // artifact-transfer-v1
    {
      name: "export_artifact",
      description: "Exports the current state as JSON artifact",
      inputSchema: { type: "object", properties: {} }
    }
  ]
});

window.webmcp_invoke_tool = async (name: string, args: any) => {
  const state = getGlobalState();

  try {
    switch (name) {
      case "translate_sherd": {
        const sherd = state.sherds[args.sherdId];
        if (!sherd) throw new Error("Sherd not found");
        dispatchGlobal({
          type: "TRANSFORM_SHERDS",
          updates: [{ id: args.sherdId, transform: { ...sherd.transform, txMm: args.txMm, tyMm: args.tyMm } }]
        });
        return { success: true };
      }
      case "get_sherd": {
        return { success: true, sherd: state.sherds[args.sherdId] };
      }
      case "query_candidates": {
        const candidates = Object.values(state.candidates).filter(c => args.status ? c.status === args.status : true);
        return { success: true, candidates };
      }
      case "accept_candidate": {
        dispatchGlobal({
          type: "UPDATE_CANDIDATE",
          id: args.candidateId,
          update: { status: "accepted", confidence: "supported", rationale: args.rationale }
        });
        return { success: true };
      }
      case "reveal_late_fragment": {
        dispatchGlobal({ type: "REVEAL_LATE_FRAGMENT" });
        return { success: true };
      }
      case "export_artifact": {
        // We only provide a preview string here. The actual files are downloaded via UI interaction.
        return { success: true, preview: JSON.stringify(state).substring(0, 500) };
      }
      default:
        throw new Error(`Tool ${name} not found`);
    }
  } catch (e: any) {
    return { isError: true, error: e.message };
  }
};

export {};
