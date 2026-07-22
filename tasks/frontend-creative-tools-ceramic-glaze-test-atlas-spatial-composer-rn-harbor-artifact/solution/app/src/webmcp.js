export const registerWebMCP = (getState, importState, seedState) => {
  window.webmcp_session_info = {
    version: "1.0",
    task: "ceramic-glaze-test-atlas"
  };

  window.webmcp_list_tools = () => {
    return JSON.stringify([
      {
        name: "seed_collection",
        description: "Seed a deterministic collection with empty, boundary, valid, and conflict states.",
        parameters: {}
      },
      {
        name: "query_state",
        description: "Query the current state of the application.",
        parameters: {}
      },
      {
        name: "import_artifact",
        description: "Import a saved artifact with field-level validation.",
        parameters: {
          artifact: "object"
        }
      }
    ]);
  };

  window.webmcp_invoke_tool = (name, paramsStr) => {
    try {
      const params = paramsStr ? JSON.parse(paramsStr) : {};

      switch (name) {
        case "seed_collection":
          const seededArtifact = {
            schemaVersion: "v1",
            records: [
              { id: '1', name: 'Boundary Low', status: 'draft', glaze: 'Clear', capacity: 0 },
              { id: '2', name: 'Boundary High', status: 'ready', glaze: 'Celadon', capacity: 100 },
              { id: '3', name: 'Valid Item', status: 'changed', glaze: 'Tenmoku', capacity: 50 },
              { id: '4', name: 'Conflict Item', status: 'archived', glaze: 'Shino', capacity: 75 }
            ],
            derived: { totalCapacity: 225 },
            history: []
          };
          seedState(seededArtifact);
          return JSON.stringify({ success: true, message: "Seeded collection." });

        case "query_state":
          return JSON.stringify({ success: true, state: getState() });

        case "import_artifact":
          if (!params.artifact) {
             return JSON.stringify({ success: false, error: "Missing artifact parameter" });
          }
          importState(params.artifact);
          return JSON.stringify({ success: true, message: "Imported artifact." });

        default:
          return JSON.stringify({ success: false, error: `Tool ${name} not found` });
      }
    } catch (e) {
      return JSON.stringify({ success: false, error: e.message });
    }
  };
};
