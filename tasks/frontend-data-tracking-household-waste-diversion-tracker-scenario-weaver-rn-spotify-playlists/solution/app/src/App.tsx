import React, { useEffect, useState } from "react";
import { StoreContext, useAppStore, useStore } from "./store";
import { WasteEventCollection } from "./components/WasteEventCollection";
import { ScenarioWeaver } from "./components/ScenarioWeaver";
import "./index.css";

declare global {
  interface Window {
    webmcp_session_info?: () => Promise<any>;
    webmcp_list_tools?: () => Promise<any[]>;
    webmcp_invoke_tool?: (request: any, separateArgs?: any) => Promise<any>;
  }
}

function MainApp() {
  const store = useStore();
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");

  useEffect(() => {
    // Keyboard undo
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        store.undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);

  useEffect(() => {
    // WebMCP Contract
    const toolMeta = [
      {
        name: "entity_create_record",
        module: "entity-collection-v1",
        description: "Create a new waste event record.",
        inputSchema: { type: "object", properties: { name: { type: "string" }, weightLb: { type: "number" }, status: { type: "string", enum: ["draft", "ready", "changed", "archived"] } }, required: ["name", "weightLb", "status"] }
      },
      {
        name: "entity_update_record",
        module: "entity-collection-v1",
        description: "Update a waste event record, e.g. branch scenario.",
        inputSchema: { type: "object", properties: { id: { type: "string" }, weightLb: { type: "number" }, status: { type: "string" }, scenarioState: { type: "string" } }, required: ["id"] }
      },
      {
        name: "entity_delete_record",
        module: "entity-collection-v1",
        description: "Delete a waste event record.",
        inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
      },
      {
        name: "artifact_export_session_json",
        module: "artifact-transfer-v1",
        description: "Export current session as JSON.",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "artifact_import_session_json",
        module: "artifact-transfer-v1",
        description: "Import session JSON.",
        inputSchema: { type: "object", properties: { data: { type: "object" } }, required: ["data"] }
      }
    ];

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1"],
      tools: toolMeta.map(t => t.name)
    });

    window.webmcp_list_tools = async () => toolMeta;

    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});

      switch (name) {
        case "entity_create_record":
          store.addRecord({ name: args.name, weightLb: args.weightLb, status: args.status, scenarioState: "idle", date: new Date().toISOString().split("T")[0] });
          return { success: true };
        case "entity_update_record":
          if (args.scenarioState === "changed" && args.weightLb !== undefined) {
             store.branchScenario(args.id, args.weightLb);
          } else {
             store.updateRecord(args.id, args);
          }
          return { success: true };
        case "entity_delete_record":
          if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
          store.deleteRecord(args.id);
          return { success: true };
        case "artifact_export_session_json":
          return { artifact: store.exportData() };
        case "artifact_import_session_json":
          store.importData(args.data);
          return { success: true };
        default:
          throw new Error(`Tool ${name} not found`);
      }
    };
  }, [store]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.exportData()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "waste-diversion-v1-scenario-weaver.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportText = () => {
    try {
      const parsed = JSON.parse(importJson);
      store.importData(parsed);
      setImportJson("");
      setImportError("");
    } catch (e) {
      setImportError("Malformed JSON schema. Fix format to recover.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        <div className="flex-1 flex flex-col gap-6">
           <header className="mb-4">
             <h1 className="text-3xl font-extrabold tracking-tight">Household Waste Diversion Tracker</h1>
             <p className="text-gray-600">Manage waste events. Undo with Cmd/Ctrl+Z.</p>
           </header>

           <WasteEventCollection />
           <ScenarioWeaver />
        </div>

        <aside className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-white p-4 rounded shadow border">
            <h3 className="text-lg font-bold mb-2">Derived Summary</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>Total Weight: <span className="font-semibold" data-testid="summary-total">{store.derived.totalWeight}</span> lbs</li>
              <li>Draft Count: {store.derived.draftCount}</li>
              <li>Ready Count: {store.derived.readyCount}</li>
              <li>Changed Count: {store.derived.changedCount}</li>
              <li>Archived Count: {store.derived.archivedCount}</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded shadow border">
            <h3 className="text-lg font-bold mb-2">Artifact Transfer</h3>
            <button onClick={handleExport} className="w-full bg-green-600 text-white p-2 rounded mb-4" data-testid="export-btn">
              Export Session JSON
            </button>
            <button onClick={() => store.clearData()} className="w-full bg-red-100 text-red-700 p-2 rounded mb-4" data-testid="clear-btn">
              Clear All Data
            </button>
            <hr className="my-2" />
            <h4 className="text-sm font-semibold mb-1">Import JSON</h4>
            {importError && <div className="text-red-500 text-xs mb-1" role="alert">{importError}</div>}
            <textarea
              aria-label="Import JSON payload"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full border p-1 text-xs font-mono h-24 mb-2"
              placeholder="Paste JSON here"
            />
            <button onClick={handleImportText} className="w-full bg-gray-200 text-gray-800 p-2 rounded" data-testid="import-btn">
              Import
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}

function App() {
  const store = useAppStore();
  return (
    <StoreContext.Provider value={store}>
      <MainApp />
    </StoreContext.Provider>
  );
}

export default App;
