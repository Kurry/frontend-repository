import { useStore, artifactSchema, type Artifact, type Swatch } from './store';

export function initWebMCP() {
  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  (window as any).webmcp_list_tools = () => [
    { name: "entity_create_swatch", description: "Create a swatch" },
    { name: "entity_select_swatch", description: "Toggle selection of a swatch" },
    { name: "entity_update_swatch", description: "Update a swatch" },
    { name: "entity_delete_swatch", description: "Delete a swatch" },
    { name: "entity_toggle_swatch", description: "Toggle selection (alias)" },
    { name: "artifact_export_palette-simulation-v1-batch-reconciler.json", description: "Export session" },
    { name: "artifact_import_palette-simulation-v1", description: "Import session" }
  ];

  (window as any).webmcp_invoke_tool = (toolName: string, args: any = {}) => {
    const state = useStore.getState();

    try {
      if (toolName === "entity_create_swatch") {
        state.createRecord(args.entity as Swatch);
        return { success: true };
      }

      if (toolName === "entity_select_swatch" || toolName === "entity_toggle_swatch") {
        state.toggleSelection(args.id);
        return { success: true };
      }

      if (toolName === "entity_update_swatch") {
        state.updateRecord(args.id, args.updates);
        return { success: true };
      }

      if (toolName === "entity_delete_swatch") {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
        state.deleteRecord(args.id);
        return { success: true };
      }

      if (toolName === "artifact_export_palette-simulation-v1-batch-reconciler.json") {
        const artifact: Artifact = {
          schemaVersion: state.schemaVersion,
          exportedAt: state.exportedAt,
          records: state.records,
          derived: state.derived,
          history: state.history
        };
        return { success: true, artifact };
      }

      if (toolName === "artifact_import_palette-simulation-v1") {
        const parseResult = artifactSchema.safeParse(args.artifact);
        if (!parseResult.success) {
          throw new Error("Invalid artifact schema");
        }
        state.importArtifact(parseResult.data as Artifact);
        return { success: true };
      }

      throw new Error(`Tool ${toolName} not found`);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };
}
