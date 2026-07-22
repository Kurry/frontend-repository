import React, { useEffect } from 'react';
import { Tree } from './components/Tree';
import { FormViews } from './components/FormViews';
import { HistoryPanel } from './components/HistoryPanel';
import { useLambdaStore } from './store';
import { exportProofArtifact, importProofArtifact } from './utils/artifacts';

function App() {
  const reset = useLambdaStore(state => state.reset);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'S' || e.key === 's') {
        const store = useLambdaStore.getState();
        store.simulateDragDetour('APP-ROOT', 'VAR-ARG-Y', 'z', 'capture-avoiding');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = async () => {
    const base64 = await exportProofArtifact();
    const link = document.createElement('a');
    link.href = `data:application/zip;base64,${base64}`;
    link.download = 'lumen-redex-capture-avoiding-proof.zip';
    link.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      await importProofArtifact(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-100 font-sans text-gray-900">
      <header className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-xl font-bold">Fictional Lambda Proof Studio</h1>
        <div className="flex gap-4">
          <button onClick={reset} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded font-medium">Reset</button>
          <button onClick={handleExport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">Export Proof</button>
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium cursor-pointer">
            Import Proof
            <input type="file" className="hidden" accept=".zip" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
          <Tree />
          <FormViews />
        </main>
        <HistoryPanel />
      </div>
    </div>
  );
}

export default App;
