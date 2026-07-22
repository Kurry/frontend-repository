import React, { useEffect } from 'react';
import { StoreProvider, useStore, ACTIONS } from './store';
import { SoundLayers } from './SoundLayers';
import { ForecastRibbon } from './ForecastRibbon';
import { ArtifactTransfer } from './ArtifactTransfer';
import { Layers } from 'lucide-react';

function WebMCPBinder() {
  const { state, dispatch, derived } = useStore();

  useEffect(() => {
    const toolMeta = [
      { name: "editor_select", module: "structured-editor-v1", description: "Select record in forecast ribbon", inputSchema: { properties: { id: { type: "string" } } } },
      { name: "editor_update_property", module: "structured-editor-v1", description: "Adjust projection", inputSchema: { properties: { property: { type: "string" }, value: { type: "any" } } } },
      { name: "editor_preview", module: "structured-editor-v1", description: "Compare projected outcomes", inputSchema: {} },
      { name: "entity_create", module: "entity-collection-v1", description: "Create sound layer", inputSchema: { properties: { name: { type: "string" }, state: { type: "string" }, duration: { type: "number" }, volume: { type: "number" } } } },
      { name: "entity_select", module: "entity-collection-v1", description: "Select sound layer", inputSchema: { properties: { id: { type: "string" } } } },
      { name: "entity_update", module: "entity-collection-v1", description: "Update sound layer", inputSchema: { properties: { id: { type: "string" }, updates: { type: "object" } } } },
      { name: "entity_delete", module: "entity-collection-v1", description: "Delete sound layer", inputSchema: { properties: { id: { type: "string" }, confirm: { type: "boolean" } } } },
      { name: "entity_reorder", module: "entity-collection-v1", description: "Reorder sound layers", inputSchema: { properties: { fromIndex: { type: "number" }, toIndex: { type: "number" } } } },
      { name: "artifact_export", module: "artifact-transfer-v1", description: "Export session JSON", inputSchema: {} },
      { name: "artifact_import", module: "artifact-transfer-v1", description: "Import session JSON", inputSchema: { properties: { data: { type: "object" } } } }
    ];

    const handlers = {
      editor_select: (args) => {
        dispatch({ type: ACTIONS.SELECT_RECORD, payload: { id: args.id } });
        return { success: true };
      },
      editor_update_property: (args) => {
        dispatch({ type: ACTIONS.SET_FORECAST_PROJECTION, payload: { ...state.forecastProjection, [args.property]: args.value } });
        return { success: true };
      },
      editor_preview: () => {
        return { success: true, projectionActive: derived.projectionActive, forecastProjection: state.forecastProjection };
      },
      entity_create: (args) => {
        dispatch({ type: ACTIONS.CREATE_RECORD, payload: args });
        return { success: true };
      },
      entity_select: (args) => {
        dispatch({ type: ACTIONS.SELECT_RECORD, payload: { id: args.id } });
        return { success: true };
      },
      entity_update: (args) => {
        dispatch({ type: ACTIONS.UPDATE_RECORD, payload: { id: args.id, updates: args.updates } });
        return { success: true };
      },
      entity_delete: (args) => {
        if (args.confirm) {
           dispatch({ type: ACTIONS.DELETE_RECORD, payload: { id: args.id } });
           return { success: true };
        }
        return { success: false, error: "confirm=true required" };
      },
      entity_reorder: (args) => {
        dispatch({ type: ACTIONS.REORDER_RECORDS, payload: args });
        return { success: true };
      },
      artifact_export: () => {
        return {
          success: true,
          data: {
            schemaVersion: 'soundscape-scene-v1',
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: derived,
            history: state.undoStack.map(h => ({
              recordsCount: h.records.length,
              selectedRecordId: h.selectedRecordId
            }))
          }
        };
      },
      artifact_import: (args) => {
        dispatch({
          type: ACTIONS.SET_STATE,
          payload: { records: args.data.records, selectedRecordId: null, forecastProjection: null }
        });
        return { success: true };
      }
    };

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
      tool_names: toolMeta.map(t => t.name)
    });

    window.webmcp_list_tools = async () => toolMeta;

    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
      const handler = handlers[name];
      if (!handler) throw new Error(`WebMCP tool ${name} is not registered`);
      return handler(args);
    };

    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool,
    };
  }, [state, dispatch, derived]);

  // Global Undo with Ctrl/Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: ACTIONS.UNDO });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return null;
}

function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      <WebMCPBinder />

      {/* Header */}
      <header className="bg-slate-900 text-white h-14 flex items-center px-6 shrink-0 shadow z-20 relative">
        <Layers className="w-5 h-5 text-indigo-400 mr-3" />
        <h1 className="text-lg font-semibold tracking-wide">Soundscape Scene Composer</h1>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Left Sidebar: Sound Layers Collection */}
        <div className="w-full md:w-[350px] shrink-0 border-r border-slate-200 bg-white md:h-full h-[40vh] md:min-h-0 flex flex-col">
          <SoundLayers />
        </div>

        {/* Right Area: Forecast Ribbon */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 md:h-full h-[60vh]">
          <ForecastRibbon />
        </div>
      </div>

      {/* Bottom Area: Portable Artifact */}
      <div className="shrink-0 bg-white">
        <ArtifactTransfer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  );
}
