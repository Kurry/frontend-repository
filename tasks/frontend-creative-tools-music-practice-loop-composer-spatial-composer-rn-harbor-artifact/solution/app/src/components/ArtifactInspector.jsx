import React, { useState } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';

export function ArtifactInspector({ summary, exportError, onExport, onImport, onClear }) {
  const [importJson, setImportJson] = useState('');

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-loop-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    onImport(importJson);
    setImportJson('');
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 uppercase tracking-wider text-sm">Derived State & Artifact</h2>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Summary</h3>
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Placed Records:</span>
              <span className="font-mono text-slate-100">{summary.placedCount}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Capacity:</span>
              <span className="font-mono text-indigo-400">{summary.totalCapacity}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Conflicts:</span>
              <span className={`font-mono ${summary.hasConflicts ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                {summary.hasConflicts ? 'YES' : 'NONE'}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Export Session</h3>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <Download size={16} />
            <span>Download Artifact</span>
          </button>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Restore Artifact</h3>
          <form onSubmit={handleImportSubmit} className="space-y-3">
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-md p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              placeholder='{"schemaVersion": "v1", "records": []}'
              aria-label="Paste artifact JSON here"
            />
            {exportError && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{exportError}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!importJson.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                <span>Import JSON</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-2 bg-slate-800 hover:bg-red-900/40 hover:text-red-400 text-slate-400 rounded-md transition-colors text-sm font-medium border border-transparent hover:border-red-900/50"
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
