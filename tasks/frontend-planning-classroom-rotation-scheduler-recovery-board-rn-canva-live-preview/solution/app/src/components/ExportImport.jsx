import React, { useState } from 'react';
import { computeDerived } from '../store.js';

export function ExportImport({ state, setState }) {
  const [error, setError] = useState('');
  const [importText, setImportText] = useState('');

  const generateArtifact = () => ({
    schemaVersion: 'classroom-rotations-v1',
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived: state.derived,
    history: state.history
  });

  const handleExport = () => {
    const artifact = generateArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classroom-rotations-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      setError('');
      const data = JSON.parse(importText);
      if (data.schemaVersion !== 'classroom-rotations-v1') {
        throw new Error('Invalid schemaVersion');
      }
      if (!Array.isArray(data.records)) {
        throw new Error('Records must be an array');
      }

      const hasDuplicates = new Set(data.records.map(r => r.id)).size !== data.records.length;
      if (hasDuplicates) {
        throw new Error('Duplicate IDs found in records');
      }

      const validStatuses = ['draft', 'ready', 'changed', 'archived'];
      for (const r of data.records) {
        if (!validStatuses.includes(r.status)) {
          throw new Error(`Invalid status: ${r.status}`);
        }
      }

      setState({
        records: data.records,
        derived: computeDerived(data.records),
        history: data.history || [],
        historyIndex: data.history ? data.history.length - 1 : -1
      });
      setImportText('');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Portable Work Artifact</h2>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Export your session history and state to a JSON artifact.</p>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full font-medium"
        >
          Export classroom-rotations-v1.json
        </button>
      </div>

      <div className="border-t pt-6 flex-1 flex flex-col">
        <h3 className="text-sm font-medium mb-2">Import Artifact</h3>
        <textarea
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setError(''); }}
          placeholder="Paste JSON here..."
          className="w-full border p-3 rounded flex-1 min-h-[120px] mb-3 font-mono text-xs bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <button
          onClick={handleImport}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full font-medium mt-auto"
        >
          Validate & Import
        </button>
      </div>
    </div>
  );
}
