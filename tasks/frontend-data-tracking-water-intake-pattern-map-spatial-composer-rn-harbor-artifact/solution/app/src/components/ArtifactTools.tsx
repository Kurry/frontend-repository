import React, { useState } from 'react';
import { store } from '../store';
import { Download, Upload, Trash2, Code2 } from 'lucide-react';

export const ArtifactTools = () => {
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const data = store.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydration-pattern-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Clear all data and reset to default seed?')) {
      store.clear();
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      const res = store.import(data);
      if (res.success) {
        setShowImport(false);
        setImportText('');
        setImportErrors([]);
      } else {
        setImportErrors(res.errors);
      }
    } catch (e) {
      setImportErrors(['Invalid JSON format']);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-t border-slate-200 bg-slate-50">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Artifact</h3>

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex justify-center items-center gap-2 py-2 px-3 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={() => setShowImport(!showImport)}
          className="flex-1 flex justify-center items-center gap-2 py-2 px-3 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          onClick={handleClear}
          className="flex-none flex justify-center items-center py-2 px-3 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 outline-none"
          title="Clear session"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showImport && (
        <div className="mt-3 p-3 bg-white border border-slate-200 rounded shadow-sm">
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Code2 className="w-3 h-3" /> Paste Session JSON
          </label>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            className="w-full h-32 p-2 font-mono text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="{ schemaVersion: 'v1', ... }"
          />
          {importErrors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <p className="font-semibold mb-1">Import failed:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {importErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => { setShowImport(false); setImportErrors([]); setImportText(''); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded hover:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              Apply Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
