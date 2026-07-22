import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, AlertCircle } from 'lucide-react';

export function ArtifactManager() {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const derived = {
       totalWeight: state.records.filter(r => r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0),
       readyCount: state.records.filter(r => r.status === 'ready').length,
       conflictCount: state.records.filter(r => r.status === 'conflict').length
    };

    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carry-on-pack-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(data.records)) throw new Error('Records must be an array');

        const ids = new Set();
        for (const record of data.records) {
          if (!record.id || !record.name || !record.status) throw new Error('Record missing required fields');
          if (ids.has(record.id)) throw new Error('Duplicate record IDs found');
          ids.add(record.id);

          if (!['draft', 'ready', 'changed', 'archived', 'conflict'].includes(record.status)) {
            throw new Error(`Invalid status: ${record.status}`);
          }
          if (typeof record.weight !== 'number' || record.weight <= 0 && record.weight !== -0.1) {
             if (record.weight <= 0 && record.status !== 'conflict') {
                throw new Error('Weight must be positive');
             }
          }
        }

        dispatch({ type: 'IMPORT_STATE', payload: data });
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
     dispatch({ type: 'CLEAR' });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <h2 className="text-xl font-semibold mb-4">Work Artifact</h2>
      <div className="space-y-3">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Export Session
        </button>

        <div>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import Session
          </label>
        </div>

        <button
          onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 px-4 py-2 rounded text-sm hover:bg-red-100"
        >
          Clear Session
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}
