import React, { useEffect } from 'react';
import { useStore } from './store';
import ShelfCanvas from './components/ShelfCanvas';
import CurveComposer from './components/CurveComposer';
import BatchExecution from './components/BatchExecution';
import GlazeRules from './components/GlazeRules';
import WitnessSensors from './components/WitnessSensors';
import { exportJSON, exportCSV, exportSVG, exportMarkdown } from './utils/export';
import { importJSON } from './utils/import';
import { registerWebMCP } from './webmcp';

function App() {
  const { viewMode, setViewMode, resetSession } = useStore();

  useEffect(() => {
    registerWebMCP();
  }, []);

  const handleImport = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      importJSON(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-stone-900 text-stone-100 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KILN LOAD & FIRING STUDIO</h1>
          <p className="text-sm font-mono text-stone-400">spatial batch and curve planner</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setViewMode('catalog')} className={`px-3 py-1 rounded ${viewMode === 'catalog' ? 'bg-stone-700' : 'hover:bg-stone-800'}`}>Catalog/Load</button>
           <button onClick={() => setViewMode('curve')} className={`px-3 py-1 rounded ${viewMode === 'curve' ? 'bg-stone-700' : 'hover:bg-stone-800'}`}>Curve</button>
           <button onClick={() => setViewMode('batch')} className={`px-3 py-1 rounded ${viewMode === 'batch' ? 'bg-stone-700' : 'hover:bg-stone-800'}`}>Batch/Results</button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-4">
        {viewMode === 'catalog' && (
           <>
             <div className="md:col-span-8">
               <ShelfCanvas />
             </div>
             <div className="md:col-span-4 flex flex-col gap-4">
               <GlazeRules />
               <WitnessSensors />
             </div>
           </>
        )}

        {viewMode === 'curve' && (
           <div className="md:col-span-12">
             <CurveComposer />
           </div>
        )}

        {viewMode === 'batch' && (
           <div className="md:col-span-12">
             <BatchExecution />
           </div>
        )}
      </main>

      <footer className="bg-stone-200 p-4 border-t flex flex-wrap gap-4 items-center justify-between text-sm">
         <div className="flex gap-2">
            <button className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-700" onClick={exportJSON}>Export JSON</button>
            <button className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-700" onClick={exportCSV}>Export CSV</button>
            <button className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-700" onClick={exportSVG}>Export SVG</button>
            <button className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-700" onClick={exportMarkdown}>Export Markdown</button>
            <label className="bg-stone-600 text-white px-3 py-1 rounded hover:bg-stone-500 cursor-pointer">
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button className="bg-red-800 text-white px-3 py-1 rounded hover:bg-red-700" onClick={resetSession}>Reset Studio</button>
         </div>
      </footer>
    </div>
  );
}

export default App;
