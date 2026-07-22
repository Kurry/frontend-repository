import React, { useState } from 'react';
import { useStore } from './useStore';
import { Download, Upload, Trash } from 'lucide-react';

export function ArtifactTransfer() {
  const { state, reset } = useStore();
  const [importError, setImportError] = useState(null);

  const handleExport = () => {
    const artifact = { schemaVersion: 'v1', exportedAt: new Date().toISOString(), records: state.records, derived: state.derived, history: state.history };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'drum-pattern-v1-audit-lens.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== 'v1') throw new Error('Invalid schemaVersion.');
        data.exportedAt = new Date().toISOString();
        reset({ records: data.records, derived: data.derived, history: data.history, auditLensState: { mode: 'idle', selectedId: null } });
        setImportError(null);
      } catch (err) { setImportError(err.message); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-zinc-200 rounded-md bg-white">
      <h2 className="text-lg font-semibold">Portable Work Artifact</h2>
      <div className="flex gap-3 mt-2">
        <button onClick={handleExport} className="flex-1 flex justify-center items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded text-sm hover:bg-zinc-800"><Download size={16} /> Export Session</button>
        <label className="flex-1 flex justify-center items-center gap-2 border border-zinc-300 px-4 py-2 rounded text-sm cursor-pointer hover:bg-zinc-50"><Upload size={16} /> Import Session<input type="file" accept=".json" className="hidden" onChange={handleImport} /></label>
      </div>
      <button onClick={() => reset(null)} className="flex justify-center items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded text-sm"><Trash size={16} /> Clear Session</button>
      {importError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{importError}</div>}
    </div>
  );
}
