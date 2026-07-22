import React, { useEffect } from 'react';
import SpatialComposer from './SpatialComposer';
import ColorsCollection from './ColorsCollection';
import { useStore } from './state';
import { setupWebMCP } from './webmcp';

function App() {
  const { derived, records, clear, importArtifact, history } = useStore();

  useEffect(() => {
    setupWebMCP();
  }, []);

  const handleExport = () => {
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: derived,
      history: history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palette-harmony-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        importArtifact(data);
      } catch (err) {
        console.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4">
      <header className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold">Palette Harmony Matrix</h1>
          <p className="text-sm text-gray-500">Spatial Composer & Evidence Artifact Inspector</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clear}
            className="px-4 py-2 text-sm border rounded text-red-600 hover:bg-red-50"
          >
            Clear Session
          </button>

          <div className="relative">
             <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Import Session JSON"
             />
             <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50 w-full text-center pointer-events-none">
               Import JSON
             </button>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
          >
            Export JSON
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        <div className="md:col-span-1 h-full">
          <ColorsCollection />
        </div>

        <div className="md:col-span-2 flex flex-col gap-4 h-full">
          <div className="flex-1 min-h-0">
            <SpatialComposer />
          </div>

          <div className="h-48 bg-white border rounded p-4 shadow-sm overflow-y-auto">
            <h3 className="font-semibold mb-2">Derived Summary View</h3>
            <p className="text-sm text-gray-600 mb-2">Total Capacity: {derived.totalCapacity}</p>
            <div className="flex flex-wrap gap-2">
              {records.filter(r => r.status === 'ready' || r.status === 'changed').map(r => (
                 <div key={r.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: r.hex}}></div>
                   <span className="text-xs font-mono">{r.capacity}</span>
                 </div>
              ))}
            </div>

            <h4 className="font-medium text-sm mt-4 mb-1">Session Lineage</h4>
            <div className="text-xs font-mono text-gray-500 max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
               {history.length === 0 ? 'No events.' : history.slice(-5).map((h, i) => (
                 <div key={i}>[{new Date(h.timestamp).toLocaleTimeString()}] {h.type}</div>
               ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
