import { useEffect } from 'react';
import { useFlavorStore } from '../store';

export function WebMCP() {
  useEffect(() => {
    // Expose tools on window object to comply with the requirement
    window.webmcp_session_info = () => ({
        version: "1.0.0",
        task: "Recipe Flavor Balance Studio"
    });

    window.webmcp_list_tools = () => {
      return [
        {
          name: "query_state",
          description: "Query current flavor balance state",
          input_schema: { type: "object", properties: {} }
        },
        {
          name: "seed_state",
          description: "Seed the flavor balance state for testing",
          input_schema: {
            type: "object",
            properties: {
              records: { type: "array" }
            },
            required: ["records"]
          }
        },
        {
          name: "create_record",
          description: "Create a new flavor component record",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              intensity: { type: "number" },
              balance: { type: "string" },
              hasDiscrepancy: { type: "boolean" }
            },
            required: ["name", "intensity", "balance"]
          }
        },
        {
            name: "update_record",
            description: "Update an existing flavor component record",
            input_schema: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    updates: { type: "object" }
                },
                required: ["id", "updates"]
            }
        },
        {
            name: "resolve_discrepancy",
            description: "Resolve discrepancy with evidence",
            input_schema: {
                type: "object",
                properties: {
                    evidence: { type: "string" }
                },
                required: ["evidence"]
            }
        },
        {
            name: "undo",
            description: "Undo the last action",
            input_schema: { type: "object", properties: {} }
        },
        {
            name: "export_import",
            description: "Clear and import a JSON artifact",
            input_schema: {
                type: "object",
                properties: {
                    data: { type: "string" }
                },
                required: ["data"]
            }
        }
      ];
    };

    window.webmcp_invoke_tool = async (name, args) => {
      if (!window.useFlavorStore) throw new Error("Store not initialized");
      const state = window.useFlavorStore.getState();

      switch (name) {
        case "query_state":
          return { result: JSON.stringify(state.getExportableState()) };
        case "seed_state":
          state.seed(args.records);
          return { result: "Seeded successfully" };
        case "create_record":
          state.addRecord({
              name: args.name,
              intensity: args.intensity,
              balance: args.balance,
              status: 'draft',
              hasDiscrepancy: args.hasDiscrepancy || false
          });
          return { result: "Record created successfully" };
        case "update_record":
          state.updateRecord(args.id, args.updates);
          return { result: "Record updated successfully" };
        case "resolve_discrepancy":
          state.setLensEvidence(args.evidence);
          const success = state.resolveDiscrepancy();
          if (!success) {
            return { error: "Failed to resolve. Ensure evidence is provided and record is selected." };
          }
          return { result: "Discrepancy resolved successfully" };
        case "undo":
          state.undo();
          return { result: "Undo successful" };
        case "export_import":
          const importRes = state.importState(args.data);
          if (importRes.success) return { result: "Import successful" };
          return { error: importRes.error };
        default:
          throw new Error("Unknown tool: " + name);
      }
    };
  }, []);

  return null;
}
