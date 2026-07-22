import React, { useRef, useState } from 'react';
import { useStore } from './store';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';

export default function ArtifactManager() {
  const { schemaVersion, exportedAt, records, derived, history, importState, clearState } = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const data = { schemaVersion, exportedAt, records, derived, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glaze-atlas-v1-batch-reconciler.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validation
        if (data.schemaVersion !== 'v1') throw new Error("Invalid schema version");
        if (!Array.isArray(data.records)) throw new Error("Missing or invalid records array");
        if (!data.derived || !data.derived.summary) throw new Error("Missing derived summary");
        if (!Array.isArray(data.history)) throw new Error("Missing history array");

        // Field validation for records
        const ids = new Set();
        data.records.forEach(r => {
          if (!r.id || !r.name || !r.status) throw new Error("Record missing required fields");
          if (ids.has(r.id)) throw new Error("Duplicate record ID found");
          ids.add(r.id);
        });

        importState(data);
        setError('');
      } catch (err) {
        setError(`Import failed: ${err.message}`);
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mt-4 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-medium text-gray-800">Portable Work Artifact</h3>
        <p className="text-sm text-gray-500">Export and restore session work.</p>
        {error && (
           <div className="text-red-600 text-sm mt-1 flex items-center gap-1" aria-live="polite">
             <AlertCircle size={14} /> {error}
           </div>
        )}
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={handleExport}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 font-medium"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={() => fileInputRef.current.click()}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 font-medium"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={clearState}
          className="flex items-center justify-center px-3 py-2 border border-red-200 text-red-600 rounded text-sm hover:bg-red-50 font-medium"
          aria-label="Clear state"
          title="Clear state"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
