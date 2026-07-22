import React, { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Download, Upload, Trash2, Check, AlertCircle } from 'lucide-react';
import { ArtifactSchema } from '../schemas';

export const ArtifactExportImport = () => {
  const { session, importSession, clearSession } = useStore();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null);

  const handleExport = () => {
    // Regenerate timestamp to fulfill "regenerates exportedAt" constraint
    const artifactToExport = {
      ...session,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(artifactToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('Exported successfully', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const result = ArtifactSchema.safeParse(json);

        if (result.success) {
          importSession(result.data);
          showStatus('Imported successfully', 'success');
        } else {
          showStatus('Invalid artifact format', 'error');
          console.error(result.error);
        }
      } catch (err) {
        showStatus('Failed to parse JSON', 'error');
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all state? This cannot be undone.')) {
      clearSession();
      showStatus('Session cleared', 'success');
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4" data-testid="export-import-panel">
      <h3 className="text-sm font-semibold mb-3 text-slate-300">Portable Artifact</h3>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded text-sm transition-colors"
          data-testid="export-btn"
        >
          <Download size={16} /> Export Session
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded text-sm transition-colors"
          data-testid="import-btn"
        >
          <Upload size={16} /> Import Session
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json,application/json"
          className="hidden"
        />

        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 w-full mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 py-2 rounded border border-red-900/50 text-sm transition-colors"
          data-testid="clear-btn"
        >
          <Trash2 size={16} /> Clear Session
        </button>
      </div>

      {status && (
        <div className={`mt-3 p-2 rounded text-xs flex items-center gap-1 ${
          status.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
        }`}>
          {status.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          {status.message}
        </div>
      )}
    </div>
  );
};
