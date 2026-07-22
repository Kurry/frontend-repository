import { pushHistory, computeDerived } from './store.js';

export function registerWebMcpTools(currentState, setState) {
  const toolMeta = [
    {
      name: "entity_create_record",
      description: "Creates a new station record.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
        },
        required: ["name", "status"]
      }
    },
    {
      name: "entity_update_record",
      description: "Updates an existing station record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
        },
        required: ["id"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Exports the current application state.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Imports and completely replaces the in-memory application state.",
      inputSchema: {
        type: "object",
        properties: {
          artifact: { type: "object" }
        },
        required: ["artifact"]
      }
    }
  ];

  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    task: "eval-intelligence/frontend-planning-classroom-rotation-scheduler-recovery-board-rn-canva-live-preview"
  });

  window.webmcp_list_tools = async () => toolMeta;

  window.webmcp_invoke_tool = async (request) => {
    const { name, arguments: args } = request;

    if (name === "entity_create_record") {
      const newRecord = {
        id: `rec-${Date.now()}`,
        name: args.name,
        status: args.status,
        failed: false
      };

      setState(prev => pushHistory(prev, [...prev.records, newRecord]));
      return { success: true, record: newRecord };
    }

    if (name === "entity_update_record") {
      setState(prev => {
        const newRecords = prev.records.map(r => {
            if (r.id === args.id) {
                return {
                    ...r,
                    name: args.name ?? r.name,
                    status: args.status ?? r.status,
                    failed: false // repair consequences
                };
            }
            return r;
        });
        return pushHistory(prev, newRecords);
      });
      return { success: true };
    }

    if (name === "artifact_export_session_json") {
      // Must use the real current state in this closure, which we get because
      // registerWebMcpTools is re-run on every render in App.jsx useEffect
      return {
        schemaVersion: 'classroom-rotations-v1',
        exportedAt: new Date().toISOString(),
        records: currentState.records,
        derived: currentState.derived,
        history: currentState.history
      };
    }

    if (name === "artifact_import_session_json") {
      setState(prev => {
        return {
          records: args.artifact.records,
          derived: computeDerived(args.artifact.records),
          history: args.artifact.history || [],
          historyIndex: args.artifact.history ? args.artifact.history.length - 1 : -1
        };
      });
      return { success: true };
    }

    throw new Error(`Tool not found: ${name}`);
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
