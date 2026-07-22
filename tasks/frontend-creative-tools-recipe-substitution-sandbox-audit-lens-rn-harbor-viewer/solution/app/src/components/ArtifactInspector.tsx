import React, { useState } from 'react';
import { useStore } from '../store';
import { SessionSchema } from '../types';
import { Download, Upload, Code } from 'lucide-react';

export function ArtifactInspector() {
  const { getDerivedState, getSession, importSession } = useStore();
  const derived = getDerivedState();
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const session = getSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = SessionSchema.parse(json);
        // Valid import, replace state
        importSession(parsed);
        setImportError(null);
      } catch (err: any) {
        setImportError(`Import failed: ${err.message || 'Invalid schema'}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-slate-500" />
        Artifact Inspector
      </h2>

      <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Derived Summary</h3>
        <p className="text-sm text-slate-600 font-medium">{derived.summary}</p>
        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          <span>Total Qty: {derived.totalQuantity}</span>
          <span>Ready: {derived.readyCount}</span>
          <span>Conflicts: {derived.conflictCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-md shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Export Session JSON
        </button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Import Session JSON"
          />
          <button className="flex items-center justify-center gap-2 w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-medium py-2 rounded-md transition-colors pointer-events-none">
            <Upload className="w-4 h-4" /> Import Session JSON
          </button>
        </div>

        {importError && (
          <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 p-1.5 rounded">{importError}</p>
        )}
      </div>
    </div>
  );
}
