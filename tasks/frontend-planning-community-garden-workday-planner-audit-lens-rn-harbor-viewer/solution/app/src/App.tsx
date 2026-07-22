import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { RecordList } from './components/RecordList';
import { AuditLens } from './components/AuditLens';
import { useWorkdayStore } from './hooks/useWorkdayStore';
import type { RecordStatus } from './types';

// WebMCP Typings
declare global {
  interface Window {
    webmcp_session_info?: () => Promise<any>;
    webmcp_list_tools?: () => Promise<any>;
    webmcp_invoke_tool?: (request: any, separateArguments?: any) => Promise<any>;
    webmcp?: {
      sessionInfo: any;
      listTools: any;
      invokeTool: any;
      registerTool?: (def: any) => void;
    };
  }
  interface Navigator {
    modelContext?: any;
  }
}

function resultText(data: any) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export default function App() {
  const store = useWorkdayStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRecord = useMemo(() => {
    return store.records.find(r => r.id === selectedId) || null;
  }, [store.records, selectedId]);

  const [exportJson, setExportJson] = useState<string | null>(null);

  // Expose WebMCP Handlers
  useEffect(() => {
    const toolMeta = [
      { name: "entity_create_record", module: "entity-collection-v1", description: "Create a work task.", inputSchema: { type: "object", additionalProperties: true, properties: { fields: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }, required: ["fields"] } },
      { name: "entity_update_record", module: "entity-collection-v1", description: "Update a work task status.", inputSchema: { type: "object", additionalProperties: true, properties: { id: { type: "string" }, fields: { type: "object", properties: { status: { type: "string" } } } }, required: ["id", "fields"] } },
      { name: "entity_select_record", module: "entity-collection-v1", description: "Select a work task to open the Audit Lens.", inputSchema: { type: "object", additionalProperties: true, properties: { id: { type: "string" } }, required: ["id"] } },
      { name: "artifact_export_session_json", module: "artifact-transfer-v1", description: "Export the current session as JSON.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json"] } }, required: ["format"] } },
      { name: "artifact_import_session_json", module: "artifact-transfer-v1", description: "Import a session JSON.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { const: "session-json" } }, required: ["mode"] } },
      { name: "artifact_read_session_json", module: "artifact-transfer-v1", description: "Read the current session as JSON.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { const: "session-json" } }, required: ["mode"] } }
    ];

    const pickArgs = (args: any = {}) => {
      const nested = args.data || args.entity_fields || args.payload || args.fields || {};
      return { ...nested, ...args };
    };

    const handlers: Record<string, (args?: any) => Promise<any>> = {
      entity_create_record: async (raw = {}) => {
        const args = pickArgs(raw);
        if (args.title) {
          store.addRecord(args.title);
        }
        return resultText({ visible: true });
      },
      entity_update_record: async (raw = {}) => {
        const args = pickArgs(raw);
        if (args.id && args.status) {
          store.updateRecordStatus(args.id, args.status as RecordStatus);
        }
        return resultText({ visible: true });
      },
      entity_select_record: async (raw = {}) => {
        const args = pickArgs(raw);
        if (args.id) {
          setSelectedId(args.id);
        }
        return resultText({ visible: true });
      },
      artifact_export_session_json: async (raw = {}) => {
        const json = store.getSessionJSON();
        setExportJson(JSON.stringify(json, null, 2));
        return resultText({ artifact: JSON.stringify(json, null, 2), visible: true });
      },
      artifact_import_session_json: async (raw = {}) => {
        const args = pickArgs(raw);
        if (args.artifact || args.content) {
            try {
                const parsed = JSON.parse(args.artifact || args.content);
                store.loadSessionJSON(parsed);
                return resultText({ visible: true });
            } catch (e) {
                return resultText({ error: "Invalid JSON format" });
            }
        }
        return resultText({ error: "Missing artifact payload" });
      },
      artifact_read_session_json: async (raw = {}) => {
        const json = store.getSessionJSON();
        return resultText({ content: json });
      }
    };

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      contractVersion: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1"],
      tool_names: toolMeta.map((tool) => tool.name),
      toolNames: toolMeta.map((tool) => tool.name),
      tools: toolMeta.map((tool) => tool.name),
    });
    window.webmcp_list_tools = async () => toolMeta.map(({ name, module, description, inputSchema }) => ({ name, module, description, inputSchema }));
    window.webmcp_invoke_tool = async (request: any, separateArguments: any = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
      const handler = handlers[name];
      if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
      return handler(args);
    };
    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool,
    };
  }, [store]); // Refresh bindings when store mutates (React closure safe since hooks manage state reference)

  // Keyboard undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          store.loadSessionJSON(json);
        } catch (e) {
          console.error("Invalid JSON");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    store.clearSession();
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4 w-full md:w-1/3 min-w-[300px]">
        <RecordList
          records={store.records}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={store.addRecord}
          onUpdateStatus={store.updateRecordStatus}
          onDelete={store.deleteRecord}
        />

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <h3 className="font-bold text-gray-700">Derived Summary</h3>
          <div className="text-sm">
            <p>Total Tasks: <b>{store.derivedSummary.totalTasks}</b></p>
            <p>Resolved Discrepancies: <b>{store.derivedSummary.resolvedDiscrepancies}</b></p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full md:w-2/3">
        <AuditLens
          record={selectedRecord}
          onAttachEvidenceAndResolve={store.attachEvidenceAndResolve}
          onUndo={store.undo}
        />

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const json = JSON.stringify(store.getSessionJSON(), null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "garden-workday-v1.json";
                a.click();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              Export JSON
            </button>
            <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors cursor-pointer">
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm font-medium transition-colors"
                title="Clear current session"
            >
                Clear
            </button>
          </div>

          <div className="text-xs text-gray-400">
            {store.records.filter(r => r.auditLensState === 'conflict').length > 0
              ? '⚠️ Unresolved Audits Pending'
              : '✓ All Audits Clear'}
          </div>
        </div>
      </div>
    </Layout>
  );
}
