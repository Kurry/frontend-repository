import { useStore, FIXED_TODAY } from './store';

const modules = [
  "structured-editor-v1",
  "entity-collection-v1",
  "artifact-transfer-v1",
  "command-session-v1"
];

const tools = [
  {
    name: "editor_select",
    module: "structured-editor-v1",
    description: "Select cards",
    inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } } }
  },
  {
    name: "editor_update_property",
    module: "structured-editor-v1",
    description: "Update card property",
    inputSchema: { type: "object", properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } } }
  },
  {
    name: "editor_switch_mode",
    module: "structured-editor-v1",
    description: "Switch view mode",
    inputSchema: { type: "object", properties: { mode: { type: "string" } } }
  },
  {
    name: "entity_create",
    module: "entity-collection-v1",
    description: "Create a group region",
    inputSchema: { type: "object", properties: { name: { type: "string" }, bounds: { type: "object" } } }
  },
  {
    name: "session_start",
    module: "command-session-v1",
    description: "Start review session",
    inputSchema: { type: "object", properties: { tagFilter: { type: "string" } } }
  },
  {
    name: "session_advance",
    module: "command-session-v1",
    description: "Rate a card",
    inputSchema: { type: "object", properties: { rating: { type: "string" } } }
  },
  {
    name: "session_undo",
    module: "command-session-v1",
    description: "Undo last rating",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "artifact_export",
    module: "artifact-transfer-v1",
    description: "Export deck artifact",
    inputSchema: { type: "object", properties: {} }
  }
];

window.webmcp_session_info = async () => ({
  contract_version: "zto-webmcp-v1",
  contractVersion: "zto-webmcp-v1",
  modules,
  tool_names: tools.map(t => t.name),
  toolNames: tools.map(t => t.name),
  tools: tools.map(t => t.name)
});

window.webmcp_list_tools = async () => tools;

window.webmcp_invoke_tool = async (name, args) => {
  const store = useStore.getState();

  try {
    switch (name) {
      case "editor_select":
        store.selectCards(args.ids);
        return { success: true };
      case "editor_update_property":
        if (args.property === "box") {
           store.moveCardToBox(args.id, args.value, "webmcp adjustment");
        } else {
           store.stageEdit(args.id, { [args.property]: args.value });
        }
        return { success: true };
      case "editor_switch_mode":
        store.setView(args.mode);
        return { success: true };
      case "entity_create":
        store.addGroupRegion({ id: `region-${Date.now()}`, name: args.name, bounds: args.bounds });
        return { success: true };
      case "session_start":
        store.startReview(args.tagFilter);
        return { success: true };
      case "session_advance":
        if (!store.activeSession?.revealed) {
           store.revealCard();
        }
        store.rateCard(args.rating);
        return { success: true };
      case "session_undo":
        store.undoLastRating();
        return { success: true };
      case "artifact_export":
        return {
          success: true,
          artifact: {
            schemaVersion: "leitner-deck/v1",
            exportedAt: new Date().toISOString(),
            fixedToday: FIXED_TODAY,
            cards: store.cards,
            groupRegions: store.groupRegions,
            sessions: store.sessions,
            reviewEvents: store.reviewEvents
          }
        };
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Try to register with standard WebMCP host if present
const host = window.navigator?.modelContext || window.webmcp;
if (host?.registerTool) {
  tools.forEach(tool => {
    try {
      host.registerTool(tool);
    } catch {
      try {
        host.registerTool(tool.name, tool);
      } catch {
        // Browser does not expose WebMCP
      }
    }
  });
}
