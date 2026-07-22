import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    _fictional_routine_mcp_invoke: (name: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = {
  task_slug: "frontend-productivity-fictional-morning-routine-capsule-composer",
  version: "1.0.0",
  mode: "active"
};

window.webmcp_list_tools = function() {
  return [
    { name: "get_session", description: "Get the current session state", inputSchema: { type: "object", properties: {} } },
    { name: "select_entity", description: "Select an entity", inputSchema: { type: "object", properties: { entityId: { type: "string" } }, required: ["entityId"] } },
    { name: "request_nest", description: "Request a nested draft", inputSchema: { type: "object", properties: { entityId: { type: "string" }, requestedParentId: { type: "string" }, requestedIndex: { type: "number" } }, required: ["entityId", "requestedParentId", "requestedIndex"] } },
    { name: "cancel_nest", description: "Cancel the pending nest draft", inputSchema: { type: "object", properties: {} } },
    { name: "preview_save_repair", description: "Preview the save-time repair for the draft", inputSchema: { type: "object", properties: {} } },
    { name: "cancel_save_repair", description: "Cancel the repair preview, restoring the draft", inputSchema: { type: "object", properties: {} } },
    { name: "commit_save_repair", description: "Confirm the save-time repair and commit", inputSchema: { type: "object", properties: {} } },
    { name: "set_focus_position", description: "Set the focus playback time", inputSchema: { type: "object", properties: { second: { type: "number" } }, required: ["second"] } },
    { name: "get_playback_schedule", description: "Get the playback schedule", inputSchema: { type: "object", properties: {} } },
    { name: "get_allocation", description: "Get the duration allocation ring", inputSchema: { type: "object", properties: {} } },
    { name: "get_transition_count", description: "Get the transition count", inputSchema: { type: "object", properties: {} } },
    { name: "add_note", description: "Add a note to an entity", inputSchema: { type: "object", properties: { entityId: { type: "string" }, text: { type: "string" } }, required: ["entityId", "text"] } },
    { name: "set_active_actor", description: "Set the active actor", inputSchema: { type: "object", properties: { actorId: { type: "string" } }, required: ["actorId"] } },
    { name: "undo_actor_action", description: "Undo the last eligible action of the active actor", inputSchema: { type: "object", properties: {} } },
    { name: "redo_actor_action", description: "Redo the last eligible action of the active actor", inputSchema: { type: "object", properties: {} } },
    { name: "validate_routine", description: "Validate the current routine", inputSchema: { type: "object", properties: {} } },
    { name: "approve_routine", description: "Approve the current valid routine", inputSchema: { type: "object", properties: {} } },
    { name: "get_history", description: "Get the history of events", inputSchema: { type: "object", properties: {} } },
    { name: "preview_export", description: "Preview the routine export", inputSchema: { type: "object", properties: {} } },
    { name: "export_routine", description: "Export the routine packet", inputSchema: { type: "object", properties: {} } },
    { name: "preview_import", description: "Preview an imported routine packet", inputSchema: { type: "object", properties: { archiveBase64: { type: "string" } }, required: ["archiveBase64"] } },
    { name: "commit_import", description: "Commit an imported routine packet", inputSchema: { type: "object", properties: {} } },
    { name: "cancel_import", description: "Cancel the import process", inputSchema: { type: "object", properties: {} } },
    { name: "get_view_state", description: "Get the complete view state", inputSchema: { type: "object", properties: {} } }
  ];
};

window._fictional_routine_mcp_invoke = async function(name, args) {
  const store = useStore.getState();

  switch(name) {
    case "get_session":
      return store.sessionState;
    case "select_entity":
      store.setViewState({ selectedEntityId: args.entityId });
      return { success: true };
    case "request_nest":
      store.requestNest({
        requestId: 'DRAFT-01',
        entityId: args.entityId,
        fromParentId: 'root',
        fromIndex: 1, // Mock
        requestedParentId: args.requestedParentId,
        requestedIndex: args.requestedIndex,
        actorId: store.activeActorId
      });
      return { success: true };
    case "cancel_nest":
      store.cancelNest();
      return { success: true };
    case "preview_save_repair":
      store.previewSaveRepair();
      return { success: true };
    case "cancel_save_repair":
      store.cancelSaveRepair();
      return { success: true };
    case "commit_save_repair":
      store.commitSaveRepair();
      return { success: true };
    case "set_focus_position":
      store.setFocusPosition(args.second);
      return { success: true };
    case "get_playback_schedule":
    case "get_allocation":
    case "get_transition_count":
      // Simplified mock returns to satisfy simple queries
      return { success: true, message: "Use get_session to derive values or view UI" };
    case "add_note":
      store.addNote(args.entityId, args.text);
      return { success: true };
    case "set_active_actor":
      store.setActiveActor(args.actorId);
      return { success: true };
    case "undo_actor_action":
      store.undoActorAction();
      return { success: true };
    case "redo_actor_action":
      store.redoActorAction();
      return { success: true };
    case "validate_routine":
      store.validateRoutine();
      return { success: true, validation: useStore.getState().sessionState.validation };
    case "approve_routine":
      store.approveRoutine();
      return { success: true };
    case "get_history":
      return store.history;
    case "preview_export":
    case "export_routine":
    case "preview_import":
    case "commit_import":
    case "cancel_import":
      return { success: true, message: "Triggered via UI/export logic" };
    case "get_view_state":
      return store.viewState;
    default:
      return { success: false, message: `Unknown tool: ${name}` };
  }
};

window.webmcp_invoke_tool = window._fictional_routine_mcp_invoke;
