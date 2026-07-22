import { useEffect } from 'react';

export default function WebMCP({ state, setState, setSelectedRecordId }) {
  useEffect(() => {
    window.webmcp_session_info = () => ({
      modules: ["entity-collection-v1", "artifact-transfer-v1"],
      bindings: {
        "entity-collection-v1": {
          entity: "air-reading",
          entity_operations: ["create", "select", "update", "delete"],
          entity_fields: ["evidence", "status", "audit_discrepancy"]
        },
        "artifact-transfer-v1": {
          artifact_operations: ["export", "import", "copy"],
          export_formats: ["air-quality-v1-audit-lens.json"],
          import_modes: ["air-quality-v1-audit-lens.json"]
        }
      }
    });

    window.webmcp_list_tools = () => [
      {
        name: "entity_select",
        description: "Select an air-reading record",
        parameters: { id: { type: "string" } }
      },
      {
        name: "entity_create",
        description: "Create an air-reading record",
        parameters: {
          id: { type: "string" },
          status: { type: "string" },
          evidence: { type: "string" },
          audit_discrepancy: { type: "string" },
          value: { type: "number" },
          date: { type: "string" },
          location: { type: "string" }
        }
      },
      {
        name: "entity_update",
        description: "Update an air-reading record",
        parameters: {
          id: { type: "string" },
          evidence: { type: "string" },
          status: { type: "string" }
        }
      },
      {
        name: "entity_delete",
        description: "Delete an air-reading record",
        parameters: { id: { type: "string" } }
      },
      {
        name: "artifact_export",
        description: "Export the current artifact state",
        parameters: { format: { type: "string" } }
      },
      {
        name: "artifact_import",
        description: "Import an artifact state",
        parameters: { format: { type: "string" }, data: { type: "object" } }
      }
    ];

    window.webmcp_invoke_tool = (name, args) => {
      try {
        if (name === "entity_select") {
           const record = state.records.find(r => r.id === args.id);
           if (!record) return JSON.stringify({ error: `Record ${args.id} not found` });
           setSelectedRecordId(args.id);
           return JSON.stringify({ success: true, message: `Selected ${args.id}` });
        }
        if (name === "entity_create") {
           const newRecord = {
             id: args.id,
             status: args.status || 'draft',
             evidence: args.evidence || '',
             audit_discrepancy: args.audit_discrepancy || '',
             value: args.value,
             date: args.date,
             location: args.location,
             auditLensState: 'idle'
           };
           const newRecords = [...state.records, newRecord];
           setState({ ...state, records: newRecords });
           return JSON.stringify({ success: true, message: `Created ${args.id}` });
        }
        if (name === "entity_update") {
           const idx = state.records.findIndex(r => r.id === args.id);
           if (idx === -1) return JSON.stringify({ error: `Record ${args.id} not found` });
           const newRecords = [...state.records];
           newRecords[idx] = { ...newRecords[idx], evidence: args.evidence, status: args.status };
           setState({ ...state, records: newRecords });
           return JSON.stringify({ success: true, message: `Updated ${args.id}` });
        }
        if (name === "entity_delete") {
           const newRecords = state.records.filter(r => r.id !== args.id);
           setState({ ...state, records: newRecords });
           return JSON.stringify({ success: true, message: `Deleted ${args.id}` });
        }
        if (name === "artifact_export") {
           return JSON.stringify({ data: { ...state, exportedAt: new Date().toISOString() } });
        }
        if (name === "artifact_import") {
           if (args.data.schemaVersion !== 'v1') return JSON.stringify({ error: 'Invalid schema' });
           setState({ ...args.data, exportedAt: new Date().toISOString() });
           return JSON.stringify({ success: true });
        }
        return JSON.stringify({ error: `Tool ${name} not found` });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    };
  }, [state, setState, setSelectedRecordId]);

  return null;
}
