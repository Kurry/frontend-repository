import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { exportState, validateImport } from '../utils/export';
import { Download, Upload, AlertTriangle } from 'lucide-react';

export function ExportImport() {
  const store = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleExport = () => {
    const data = exportState(store);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const result = validateImport(json);
        if (result.success) {
          store.importState(result.data);
          setError(null);
        } else {
          setError("Invalid artifact schema. " + result.error.errors[0].message);
        }
      } catch (err) {
        setError("Failed to parse JSON file.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md font-medium text-sm transition-colors shadow-sm"
        data-testid="btn-export"
      >
        <Download size={16} /> Export Artifact
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-sm transition-colors"
        data-testid="btn-import"
      >
        <Upload size={16} /> Import Artifact
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
        data-testid="input-import-file"
      />

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-start gap-2" data-testid="import-error">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
