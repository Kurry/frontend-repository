import React, { useEffect, useState } from 'react';
import { RecordList } from './RecordList';
import { SpatialComposer } from './SpatialComposer';
import { useStore } from './store';

export const App: React.FC = () => {
  const { spatialState, undo, exportArtifact, importArtifact } = useStore();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportArtifact());
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "bike-maintenance-v1-spatial-composer.json");
    dlAnchorElem.click();
  };

  const capacity_used = spatialState.length;
  const capacity_total = 10;

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-white">
      <header className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">Bike Maintenance Workbench</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Capacity: {capacity_used} / {capacity_total}
          </div>
          <button onClick={undo} className="px-3 py-1 bg-slate-600 rounded hover:bg-slate-500 text-sm">Undo (Ctrl+Z)</button>
          <button onClick={handleExport} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 text-sm">Export JSON</button>
          <button onClick={() => setShowImport(!showImport)} className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 text-sm">Import</button>
        </div>
      </header>

      {showImport && (
        <div className="p-4 bg-gray-100 border-b flex gap-2">
          <textarea
            className="flex-1 p-2 text-xs font-mono border"
            placeholder="Paste JSON artifact here..."
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button onClick={() => { importArtifact(importText); setImportText(''); setShowImport(false); }} className="px-4 bg-green-600 text-white font-bold hover:bg-green-700">Load</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <aside className="w-full md:w-80 h-full border-r shrink-0">
          <RecordList />
        </aside>
        <main className="flex-1 h-full relative">
          <SpatialComposer />
        </main>
      </div>
    </div>
  );
};
