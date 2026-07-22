import React, { useEffect } from 'react';
import { useStore } from './store';
import { ScenarioCards } from './ScenarioCards';
import { ScenarioWeaver } from './ScenarioWeaver';
import { Download, Upload, Trash2 } from 'lucide-react';
import './index.css';

function App() {
  const { exportSession, importSession, clearSession } = useStore();

  useEffect(() => {
    // WebMCP Contract Bindings
    window.webmcp_session_info = () => ({
      name: "Scenario Weaver",
      version: "1.0.0"
    });

    window.webmcp_list_tools = () => [
      {
        name: "export_session",
        description: "Export the current session state as JSON",
        parameters: {}
      },
      {
        name: "import_session",
        description: "Import a session state from JSON",
        parameters: {
          sessionData: "object"
        }
      },
      {
        name: "query_state",
        description: "Get the current raw application state",
        parameters: {}
      }
    ];

    window.webmcp_invoke_tool = (name, params) => {
      if (name === 'export_session') {
        return exportSession();
      } else if (name === 'import_session') {
        importSession(params.sessionData);
        return { success: true };
      } else if (name === 'query_state') {
        return useStore.getState();
      }
      throw new Error(`Unknown tool: ${name}`);
    };
  }, [exportSession, importSession]);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-scenario-weaver.json';
    document.body.appendChild(a);
    a.click();
    // Memory constraint: do not remove child immediately to prevent race conditions in headless
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importSession(json);
      } catch (err) {
        alert("Failed to parse JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4 md:p-6 text-gray-900 font-sans">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenario Weaver</h1>
          <p className="text-sm text-gray-600">Board Game Scenario Builder</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={clearSession}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded shadow-sm"
          >
            <Trash2 size={16} className="mr-2" /> Clear
          </button>

          <label className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded shadow-sm cursor-pointer">
            <Upload size={16} className="mr-2" /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm"
          >
            <Download size={16} className="mr-2" /> Export JSON
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] min-h-[500px]">
        <div className="w-full lg:w-1/3 flex flex-col h-full">
          <ScenarioCards />
        </div>

        <div className="w-full lg:w-2/3 flex flex-col h-full">
          <ScenarioWeaver />
        </div>
      </main>
    </div>
  );
}

export default App;
