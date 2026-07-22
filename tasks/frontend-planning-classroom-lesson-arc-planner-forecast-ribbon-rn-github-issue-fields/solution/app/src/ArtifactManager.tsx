import React, { useState } from 'react';
import { useStore, store, ClassroomSession } from './store';
import { Download, Upload, Trash2, AlertTriangle, FileJson, CheckCircle2 } from 'lucide-react';

export default function ArtifactManager() {
  const session = useStore(state => state);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const exportState = {
      ...session,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the entire session? This will reset all in-memory state.")) {
      store.clearSession();
      setImportText('');
      setImportStatus('idle');
    }
  };

  const handleImport = () => {
    try {
      if (!importText.trim()) throw new Error("Import cannot be empty.");

      const parsed = JSON.parse(importText) as any;

      // Strict field-level validation
      if (parsed.schemaVersion !== 'lesson-arc-v1') {
        throw new Error("Invalid schemaVersion. Expected 'lesson-arc-v1'.");
      }

      if (!Array.isArray(parsed.records)) {
        throw new Error("Invalid format: 'records' must be an array.");
      }

      const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
      const seenIds = new Set<string>();

      for (const r of parsed.records) {
        if (!r.id || typeof r.id !== 'string') throw new Error("Record missing or invalid ID.");
        if (seenIds.has(r.id)) throw new Error(`Duplicate ID found: ${r.id}`);
        seenIds.add(r.id);

        if (!r.title || typeof r.title !== 'string') throw new Error(`Record ${r.id} missing title.`);
        if (typeof r.duration !== 'number' || r.duration < 5 || r.duration > 240) throw new Error(`Record ${r.id} has invalid duration. Must be 5-240.`);
        if (!validStatuses.includes(r.status)) throw new Error(`Record ${r.id} has invalid status '${r.status}'.`);
      }

      store.importSession({
        ...parsed,
        exportedAt: new Date().toISOString() // regenerate exportedAt on import
      });

      setImportStatus('success');
      setImportError('');
      setImportText('');
    } catch (e: any) {
      setImportStatus('error');
      setImportError(e.message || "Failed to parse JSON.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <FileJson size={20} className="text-slate-600"/> Session Artifact
          </h2>
          <p className="text-sm text-slate-500 mt-1">Export and restore actual session work.</p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} /> Clear Session
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Export Panel */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Export State</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download size={16} /> Download JSON
            </button>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 h-[calc(100%-3rem)] overflow-y-auto">
            <pre className="text-xs text-emerald-400 font-mono">
              {JSON.stringify({
                ...session,
                exportedAt: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        </div>

        {/* Import Panel */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Import State</h3>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors shadow-sm"
            >
              <Upload size={16} /> Validate & Import
            </button>
          </div>

          {importStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex gap-2 items-start">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <strong className="block mb-1">Import Rejected</strong>
                {importError}
              </div>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm flex gap-2 items-center">
              <CheckCircle2 size={16} />
              Session successfully restored.
            </div>
          )}

          <textarea
            value={importText}
            onChange={e => {
              setImportText(e.target.value);
              setImportStatus('idle');
            }}
            placeholder="Paste lesson-arc-v1-forecast-ribbon.json content here..."
            className="flex-1 w-full bg-white border border-slate-300 rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

      </div>
    </div>
  );
}
