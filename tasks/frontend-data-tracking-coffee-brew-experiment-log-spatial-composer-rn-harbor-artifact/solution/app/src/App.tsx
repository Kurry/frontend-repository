import { useEffect } from 'react';
import { RecordList } from './components/RecordList';
import { SpatialComposer } from './components/SpatialComposer';
import { DetailsPanel } from './components/DetailsPanel';
import { ExportImport } from './components/ExportImport';
import { useStore } from './store';

function App() {
  const { undo } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  useEffect(() => {
    // WebMCP Contract Bindings
    (window as any).webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      contractVersion: "zto-webmcp-v1",
    });

    (window as any).webmcp_list_tools = async () => [
      {
        name: "query_state",
        module: "brew_experiments",
        description: "Returns the current state of the store",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "export_artifact",
        module: "brew_experiments",
        description: "Exports the session artifact JSON",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "import_artifact",
        module: "brew_experiments",
        description: "Imports a session artifact JSON",
        inputSchema: {
          type: "object",
          properties: {
            jsonString: { type: "string" }
          },
          required: ["jsonString"]
        }
      },
      {
        name: "place_in_spatial_composer",
        module: "brew_experiments",
        description: "Place a selected record in a spatial composer",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            x: { type: "number" },
            y: { type: "number" }
          },
          required: ["id", "x", "y"]
        }
      }
    ];

    (window as any).webmcp_invoke_tool = async (request: any) => {
      if (request.name === "query_state") {
        return { data: useStore.getState() };
      }
      if (request.name === "export_artifact") {
        return { data: useStore.getState().exportArtifact() };
      }
      if (request.name === "import_artifact") {
        const success = useStore.getState().importArtifact(request.arguments.jsonString);
        return { data: { success } };
      }
      if (request.name === "place_in_spatial_composer") {
        useStore.getState().placeInSpatialComposer(request.arguments.id, request.arguments.x, request.arguments.y);
        return { data: { success: true } };
      }
      throw new Error(`Tool ${request.name} not found`);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-200 overflow-hidden text-slate-900 font-sans">
      <header className="flex-none p-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Coffee Brew Experiment Log</h1>
        <p className="text-sm text-slate-400">Spatial Composer & Artifact Provenance</p>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-1/4 md:min-w-[280px] md:max-w-[360px] h-1/3 md:h-full overflow-y-auto border-b md:border-b-0 border-slate-200">
          <RecordList />
        </aside>

        <section className="flex-1 flex flex-col h-1/3 md:h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SpatialComposer />
          </div>
          <div className="flex-none p-4">
            <ExportImport />
          </div>
        </section>

        <aside className="w-full md:w-1/4 md:min-w-[280px] md:max-w-[360px] h-1/3 md:h-full overflow-y-auto border-b md:border-b-0 border-slate-200">
          <DetailsPanel />
        </aside>
      </main>
    </div>
  );
}

export default App;
