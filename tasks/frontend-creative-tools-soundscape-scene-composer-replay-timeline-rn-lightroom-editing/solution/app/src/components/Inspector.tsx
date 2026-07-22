import React, { useState } from 'react';
import { useStore } from '../store/Store';
import { Download, Upload, Trash, Undo2, Copy } from 'lucide-react';
import type { SoundscapeSceneSession } from '../types';

export const Inspector = () => {
  const { state, exportSession, importSession, clearSession, undo, canUndo, derivedSummary } = useStore();
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const session = exportSession();
    navigator.clipboard.writeText(JSON.stringify(session, null, 2));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as SoundscapeSceneSession;
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        importSession(json);
        setImportError('');
      } catch (err) {
        setImportError('Invalid session JSON. Artifact rejected.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="w-full md:w-72 bg-stone-900 border-t md:border-l border-stone-800 flex flex-col h-auto md:h-full shrink-0">
      <div className="p-4 border-b border-stone-800 md:h-auto h-1/3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-200 uppercase tracking-wider">Derived Summary</h2>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 transition-colors"
            title="Undo last mutation"
          >
            <Undo2 size={16} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center text-stone-300 bg-stone-950 p-2 rounded">
            <span>Total Layers</span>
            <span className="font-mono font-medium">{derivedSummary.totalRecords}</span>
          </div>

          <div className="bg-stone-950 p-2 rounded space-y-1 text-xs">
            <div className="text-stone-500 uppercase font-semibold mb-2 tracking-wider">Status Distribution</div>
            {Object.entries(derivedSummary.statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center text-stone-400">
                <span className="capitalize">{status}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-stone-800">
         <h2 className="text-sm font-semibold text-stone-200 uppercase tracking-wider mb-4">Portable Artifact</h2>

         <div className="space-y-2 text-sm">
           <button
             onClick={handleExport}
             className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
           >
             <Download size={16} />
             Export JSON
           </button>

           <button
             onClick={handleCopy}
             className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors border border-stone-700"
           >
             <Copy size={16} />
             Copy to Clipboard
           </button>

           <div className="relative">
             <input
               type="file"
               accept=".json"
               onChange={handleImport}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <div className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors border border-stone-700 pointer-events-none">
               <Upload size={16} />
               Import JSON
             </div>
           </div>

           {importError && <p className="text-xs text-rose-400 mt-1">{importError}</p>}
         </div>
      </div>

      <div className="mt-auto p-4 border-t border-stone-800">
        <button
          onClick={() => { if(confirm('Clear entire session?')) clearSession(); }}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors border border-transparent hover:border-rose-900/50"
        >
          <Trash size={16} />
          Clear Session
        </button>
      </div>
    </div>
  );
};
