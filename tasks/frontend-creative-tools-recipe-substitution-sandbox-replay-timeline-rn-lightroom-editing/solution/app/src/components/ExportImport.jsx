import React, { useRef, useState } from 'react';
import { useStore } from '../store';

export function ExportImport() {
  const { exportArtifact, importArtifact, clearData } = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        importArtifact(text);
        setError(null);
      } catch (err) {
        setError('Failed to import file. Invalid format.');
      }
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center mt-6">
      <div>
        <h3 className="font-semibold">Session Artifact</h3>
        <p className="text-sm text-gray-400">Export your work or import a previous session.</p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <div className="flex gap-3">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => clearData()}
          className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear Workspace
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Import
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
        >
          Export Artifact
        </button>
      </div>
    </div>
  );
}
