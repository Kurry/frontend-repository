import { useAppStore } from './store';
import type { RecipeFlavorBalanceStudioSession } from './types';

export function setupWebMCP() {
  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "command-session-v1"],
    status: "ready"
  });

  (window as any).webmcp_list_tools = () => {
    return [
      // Entity Collection (flavor-component)
      { name: "entity_create", description: "Create a new flavor component" },
      { name: "entity_update", description: "Update a flavor component" },
      { name: "entity_delete", description: "Delete a flavor component" },
      { name: "entity_select", description: "Select a flavor component" },
      { name: "entity_toggle", description: "Toggle a flavor component selection" },
      // Artifact Transfer
      { name: "artifact_export", description: "Export the session" },
      { name: "artifact_import", description: "Import a session" },
      // Command Session
      { name: "session_start", description: "Start (reconcile batch)" },
      { name: "session_stop", description: "Stop/Clear session" },
      { name: "session_restart", description: "Restart session" },
      { name: "session_advance", description: "Undo last mutation" }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const store = useAppStore.getState();

    switch (name) {
      case "entity_create":
        store.addRecord(args.entity || args);
        return { success: true };
      case "entity_update":
        store.updateRecord(args.id, args.updates || args);
        return { success: true };
      case "entity_delete":
        store.deleteRecord(args.id);
        return { success: true };
      case "entity_select":
      case "entity_toggle":
        store.selectRecord(args.id, args.selected ?? !store.selectedIds.has(args.id));
        return { success: true };

      case "artifact_export":
        const session: RecipeFlavorBalanceStudioSession = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: store.derived,
          history: store.history
        };
        return { success: true, artifact: session };
      case "artifact_import":
        store.importSession(args.artifact || args);
        return { success: true };

      case "session_start":
        store.reconcileBatch();
        return { success: true };
      case "session_stop":
      case "session_restart":
        store.clearSession();
        return { success: true };
      case "session_advance":
        store.undo();
        return { success: true };

      default:
        throw new Error(`Tool ${name} not recognized`);
    }
  };
}
