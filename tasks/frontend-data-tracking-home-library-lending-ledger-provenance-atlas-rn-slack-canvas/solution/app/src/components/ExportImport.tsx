import { useState, useRef } from 'react';
import type { HomeLibraryLendingLedgerSession } from '../types';
import type { Action } from '../store';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';

interface ExportImportProps {
  state: HomeLibraryLendingLedgerSession;
  dispatch: React.Dispatch<Action>;
}

export function ExportImport({ state, dispatch }: ExportImportProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // Generate new exportedAt but keep other state
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString(),
      // We don't necessarily need to export history of UI actions, just domain state
      // but to preserve exact round-trips as specified we will include it
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-provenance-atlas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL' });
      setError(null);
    }
  };

  const validateImport = (data: any): data is HomeLibraryLendingLedgerSession => {
    if (!data || typeof data !== 'object') throw new Error("Invalid format");
    if (data.schemaVersion !== 'v1') throw new Error("schemaVersion must be 'v1'");
    if (!Array.isArray(data.records)) throw new Error("records must be an array");

    const idSet = new Set();
    data.records.forEach((r: any, i: number) => {
      if (!r.id || typeof r.id !== 'string') throw new Error(`records[${i}].id is missing or invalid`);
      if (idSet.has(r.id)) throw new Error(`records[${i}].id is duplicate`);
      idSet.add(r.id);

      const validStatuses = ['draft', 'ready', 'changed', 'archived', 'quarantined'];
      if (!validStatuses.includes(r.status)) throw new Error(`records[${i}].status is invalid enum: ${r.status}`);
      if (!r.title || r.title.length > 255) throw new Error(`records[${i}].title invalid length`);
    });
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (validateImport(json)) {
          // Regenerate exportedAt on import for freshness or just load it
          dispatch({ type: 'IMPORT_STATE', payload: json });
          setError(null);
        }
      } catch (err: any) {
        setError(`Import failed: ${err.message}`);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2 relative">
      <button
        onClick={handleExport}
        className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        <Download size={14} /> Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        <Upload size={14} /> Import
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClear}
        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        title="Clear State"
      >
        <Trash2 size={14} />
      </button>

      {error && (
        <div className="absolute top-10 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs w-64 shadow-lg z-50 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">X</button>
        </div>
      )}
    </div>
  );
}
