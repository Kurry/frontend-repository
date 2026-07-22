import { useEffect, useState } from 'react';
import { Canvas } from './components/Canvas';
import { PassStack } from './components/PassStack';
import { LinkedEvidence } from './components/LinkedEvidence';
import { useStore } from './lib/store';
import { exportZip } from './lib/export';
import { importZip } from './lib/import';
import { setupWebMCP } from './lib/webmcp';

function App() {
  const store = useStore();
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    setupWebMCP();
  }, []);

  const handleExport = async () => {
    await exportZip(useStore.getState());
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files.length > 0) {
      await importZip(e.target.files[0], store);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-900 text-neutral-100 overflow-hidden font-sans">
      <header className="flex-none h-12 bg-neutral-950 border-b border-neutral-800 flex items-center px-4 justify-between">
        <h1 className="text-sm font-bold tracking-wider uppercase text-neutral-400">Darkroom Composer</h1>
        <div className="flex gap-2 text-xs">
           <button className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700" onClick={() => setShowReview(true)}>Review & Approve</button>
           <button className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 text-white" onClick={handleExport}>Export ZIP</button>
           <label className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700 cursor-pointer">
             Import
             <input type="file" className="hidden" accept=".zip,.json" onChange={handleImport} />
           </label>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
         <Canvas />
         <PassStack />
      </main>

      <LinkedEvidence />

      {showReview && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded max-w-md w-full border border-neutral-700">
            <h2 className="text-lg font-bold mb-4">Review Project</h2>
            <div className="text-sm mb-4">
              <p>Passes Edited: {store.passes.some(p => p.id === 'pass-04' && p.mask.xMm === 100) ? 'Yes' : 'No'}</p>
              <p>Decision Fresh: {store.decisions.some(d => d.status === 'fresh') ? 'Yes' : 'No'}</p>
              <p>Total Events: {store.history.length}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-neutral-800 rounded" onClick={() => setShowReview(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 rounded text-white" onClick={() => setShowReview(false)}>Approve Recipe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
