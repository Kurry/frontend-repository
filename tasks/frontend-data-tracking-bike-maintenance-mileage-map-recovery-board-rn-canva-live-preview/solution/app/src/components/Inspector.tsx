import React, { useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash, RotateCcw, RotateCw, Activity, History } from 'lucide-react';

export const Inspector: React.FC = () => {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { derived, history } = store.current;
  const canUndo = store.past.length > 0;
  const canRedo = store.future.length > 0;

  const handleExport = () => {
    const data = store.exportArtifact();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const success = store.importArtifact(json);
          if (!success) alert("Invalid artifact schema.");
        } catch (err) {
          alert("Failed to parse JSON.");
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Activity size={16} /> Summary & Tools
        </h2>

        <div className="flex gap-1">
          <button
            onClick={store.undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300'}`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={store.redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300'}`}
            title="Redo"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

        {/* Derived State summary */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Derived State</h3>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{derived.totalDistance}</span>
                <span className="text-xs text-slate-500">Total km</span>
             </div>
             <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col">
                <span className="text-2xl font-bold text-green-700">{derived.readyCount}</span>
                <span className="text-xs text-green-600">Ready</span>
             </div>
             <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col">
                <span className="text-2xl font-bold text-red-700">{derived.failedCount}</span>
                <span className="text-xs text-red-600">Failed</span>
             </div>
             <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex flex-col">
                <span className="text-2xl font-bold text-amber-700">{derived.recoveryCount}</span>
                <span className="text-xs text-amber-600">In Recovery</span>
             </div>
          </div>
        </section>

        {/* History Preview */}
        <section>
           <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
             <History size={14} /> Recent Actions
           </h3>
           <div className="space-y-2">
             {history.length === 0 && <p className="text-xs text-slate-400 italic">No actions yet</p>}
             {history.slice(-3).reverse().map((h, i) => (
                <div key={i} className="text-xs flex gap-2 items-start py-1 border-b border-slate-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">{h.action.replace(/_/g, ' ')}</span>
                    <div className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
             ))}
           </div>
        </section>

        {/* Artifact Tools */}
        <section className="mt-auto pt-4 border-t border-slate-200">
           <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Artifact</h3>
           <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors"
              >
                <Download size={16} /> Export JSON
              </button>

              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload size={16} /> Import
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
                </label>

                <button
                  onClick={store.clearState}
                  className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  title="Clear State"
                >
                  <Trash size={16} />
                </button>
              </div>
              <div className="text-center text-[10px] text-slate-400 mt-2">
                 Last exported: {new Date(store.current.exportedAt).toLocaleString()}
              </div>
           </div>
        </section>

      </div>
    </div>
  );
};
