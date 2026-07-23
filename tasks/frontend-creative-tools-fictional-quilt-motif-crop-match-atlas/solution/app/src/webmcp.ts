import { useStore } from './store/useStore';

declare global {
  interface Window {
    webmcp_session_info?: () => any;
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (toolName: string, args: any) => Promise<any>;
  }
}

export function initWebMcp() {
  window.webmcp_session_info = () => ({
    schema: "zto-webmcp-v1",
    status: "active"
  });

  window.webmcp_list_tools = () => [
    {
      name: "query_studies",
      description: "List all studies",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "query_study",
      description: "Get specific study",
      inputSchema: { type: "object", properties: { id: { type: "string" } } }
    },
    {
      name: "select_study",
      description: "Select study",
      inputSchema: { type: "object", properties: { id: { type: "string" } } }
    },
    {
      name: "query_crop",
      description: "Get current canonical crop",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "preview_crop",
      description: "Set transient crop preview",
      inputSchema: { type: "object", properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } } }
    },
    {
      name: "commit_crop",
      description: "Commit the previewed crop",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "cancel_crop",
      description: "Cancel the crop preview",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "query_global_ranking",
      description: "Get match rankings",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "set_match_filters",
      description: "Set match filters",
      inputSchema: { type: "object", properties: { family: { type: "string" } } }
    },
    {
      name: "commit_decision",
      description: "Commit a decision",
      inputSchema: { type: "object", properties: { motifId: { type: "string" }, rationale: { type: "string" }, bestTransform: { type: "string" }, decisionStatus: { type: "string" } } }
    },
    {
      name: "advance_logical_clock",
      description: "Advance logical clock and reveal correction",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "commit_revalidation",
      description: "Commit revalidation",
      inputSchema: { type: "object", properties: { motifId: { type: "string" }, baseDecisionId: { type: "string" } } }
    },
    {
      name: "approve_match",
      description: "Approve the match",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "reset_session",
      description: "Reset session",
      inputSchema: { type: "object", properties: {} }
    }
  ];

  window.webmcp_invoke_tool = async (toolName, args) => {
    const store = useStore.getState();

    switch (toolName) {
      case "query_studies": return store.studies;
      case "query_study": return store.studies.find(s => s.id === args.id);
      case "select_study":
        store.selectStudy(args.id);
        return { success: true };
      case "query_crop": return store.canonicalCrop;
      case "preview_crop":
        store.setPreviewCrop({ x: args.x, y: args.y, width: args.width, height: args.height });
        return { success: true };
      case "commit_crop":
        await store.commitCrop();
        return { success: true };
      case "cancel_crop":
        store.cancelCrop();
        return { success: true };
      case "query_global_ranking": return store.globalRanking;
      case "set_match_filters":
        store.setMatchFilters(args);
        return { success: true };
      case "commit_decision":
        store.commitDecision(args);
        return { success: true };
      case "advance_logical_clock":
        store.advanceLogicalClock();
        return { success: true };
      case "commit_revalidation":
        store.commitRevalidation(args.motifId, args.baseDecisionId);
        return { success: true };
      case "approve_match":
        store.approveMatch();
        return { success: true };
      case "reset_session":
        store.resetSession();
        return { success: true };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
