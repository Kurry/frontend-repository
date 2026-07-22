import { useEffect } from 'react';
import { StationsCollection } from './components/StationsCollection';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { LinkedSummary } from './components/LinkedSummary';
import { undo, addStation, deleteStation, updateStation, moveStation, getState, importState, clearSession } from './store';
import { Station } from './types';

// WebMCP Typings
declare global {
  interface Window {
    webmcp_session_info?: () => Promise<any>;
    webmcp_list_tools?: () => Promise<any>;
    webmcp_invoke_tool?: (request: any, separateArguments?: any) => Promise<any>;
    webmcp?: any;
  }
}

function App() {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    // Implement WebMCP Contract
    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      contractVersion: "zto-webmcp-v1",
      task: "eval-intelligence/frontend-planning-classroom-rotation-scheduler-constraint-canvas-rn-linear-views"
    });

    const toolMeta = [
      {
        name: "entity_create_record",
        module: "entity-collection-v1",
        description: "Creates a new station record",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            lane: { type: "string" },
            teacher: { type: "string" },
            capacity: { type: "number" }
          },
          required: ["name", "teacher", "capacity"]
        }
      },
      {
        name: "entity_read_record",
        module: "entity-collection-v1",
        description: "Reads a station record",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "entity_update_record",
        module: "entity-collection-v1",
        description: "Updates a station record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            updates: { type: "object" }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "entity_delete_record",
        module: "entity-collection-v1",
        description: "Deletes a station record",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "entity_list_records",
        module: "entity-collection-v1",
        description: "Lists all station records",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "entity_query_records",
        module: "entity-collection-v1",
        description: "Queries station records",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "object" }
          }
        }
      },
      {
        name: "editor_select",
        module: "structured-editor-v1",
        description: "Selects a record",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "editor_update_property",
        module: "structured-editor-v1",
        description: "Updates a property (e.g. lane) of a record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            property: { type: "string" },
            value: { type: "string" }
          },
          required: ["id", "property", "value"]
        }
      },
      {
        name: "artifact_export_session_json",
        module: "artifact-transfer-v1",
        description: "Exports the session state as JSON",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        module: "artifact-transfer-v1",
        description: "Imports the session state from JSON",
        inputSchema: {
          type: "object",
          properties: { json: { type: "string" } },
          required: ["json"]
        }
      },
      {
        name: "artifact_clear_session",
        module: "artifact-transfer-v1",
        description: "Clears the session",
        inputSchema: { type: "object", properties: {} }
      }
    ];

    window.webmcp_list_tools = async () => toolMeta;

    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const args = Object.keys(separateArguments).length > 0 ? separateArguments : (request.arguments || {});
      const name = request.name;
      const state = getState();

      try {
        switch (name) {
          case "entity_create_record": {
            addStation(args as Omit<Station, "id" | "status">);
            return { _result: "Created", current_state: getState() };
          }
          case "entity_read_record": {
            const record = state.records.find(r => r.id === args.id);
            return record ? { _result: record } : { _error: "Not found" };
          }
          case "entity_update_record": {
            updateStation(args.id, args.updates);
            return { _result: "Updated", current_state: getState() };
          }
          case "entity_delete_record": {
            deleteStation(args.id);
            return { _result: "Deleted", current_state: getState() };
          }
          case "entity_list_records": {
            return { _result: state.records };
          }
          case "entity_query_records": {
            return { _result: state.records };
          }
          case "editor_select": {
            return { _result: "Selected" };
          }
          case "editor_update_property": {
            if (args.property === "lane") {
              const success = moveStation(args.id, args.value);
              if (!success) throw new Error("Move failed due to constraint");
            } else {
              updateStation(args.id, { [args.property]: args.value });
            }
            return { _result: "Updated", current_state: getState() };
          }
          case "artifact_export_session_json": {
            return { _result: state };
          }
          case "artifact_import_session_json": {
            importState(args.json);
            return { _result: "Imported", current_state: getState() };
          }
          case "artifact_clear_session": {
            clearSession();
            return { _result: "Cleared", current_state: getState() };
          }
          default:
            throw new Error(`Tool ${name} not implemented`);
        }
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: e.message || "Unknown error" }] };
      }
    };

    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool,
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-800 antialiased font-sans flex-col md:flex-row bg-gray-50">
      <div className="md:w-80 w-full md:border-r border-b border-gray-200 shrink-0 h-[30vh] md:h-full z-20">
        <StationsCollection />
      </div>
      <div className="flex-1 h-[40vh] md:h-full z-10 relative">
        <ConstraintCanvas />
      </div>
      <div className="md:w-64 w-full md:border-l border-t border-gray-200 shrink-0 h-[30vh] md:h-full z-20">
        <LinkedSummary />
      </div>
    </div>
  );
}

export default App;
