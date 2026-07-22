export function createWebMcpTools(state) {
  return [
    {
      name: "editor_select",
      description: "Select a record in the spatial composer",
      execute: async (args) => {
        state.setSelectedRecordId(args.id);
        return { success: true };
      }
    },
    {
      name: "editor_update_property",
      description: "Place a selected record in a spatial composer and rebalance capacity",
      execute: async (args) => {
        // args: id, x, y, capacity
        state.placeRecordInComposer(args.id, { x: args.x, y: args.y }, args.capacity);
        return { success: true };
      }
    },
    {
      name: "entity_create",
      description: "Create a practice segment",
      execute: async (args) => {
        state.addRecord({
          id: `record-${Date.now()}`,
          name: args.name || 'New Segment',
          status: 'empty',
          capacity: args.capacity || 10,
          composerPosition: null
        });
        return { success: true };
      }
    },
    {
      name: "entity_update",
      description: "Update a practice segment",
      execute: async (args) => {
        state.updateRecord(args.id, { status: args.status, capacity: args.capacity });
        return { success: true };
      }
    },
    {
      name: "entity_delete",
      description: "Delete a practice segment",
      execute: async (args) => {
        if (!args.confirm) return { success: false, message: "Delete requires confirm=true" };
        state.deleteRecord(args.id);
        return { success: true };
      }
    },
    {
      name: "artifact_export",
      description: "Export the session to JSON",
      execute: async () => {
        return { success: true, artifact: state.generateExport() };
      }
    },
    {
      name: "artifact_import",
      description: "Import a session from JSON",
      execute: async (args) => {
        state.importSession(args.jsonString);
        return { success: true };
      }
    }
  ];
}
