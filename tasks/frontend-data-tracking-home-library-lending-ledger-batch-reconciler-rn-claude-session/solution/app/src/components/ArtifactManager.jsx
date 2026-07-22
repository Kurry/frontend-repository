import React, { useRef } from 'react';
import { useStore } from '../store';

export default function ArtifactManager() {
  const { exportArtifact, importArtifact, clearSession } = useStore();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        importArtifact(json);
      } catch (err) {
        console.error("Failed to parse import:", err);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the session? This will wipe all unsaved data.")) {
      clearSession();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-sm bg-white border px-3 py-1.5 rounded font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        Import Artifact
      </button>
      <button
        onClick={handleExport}
        className="text-sm bg-white border px-3 py-1.5 rounded font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        Export Session
      </button>
      <button
        onClick={handleClear}
        className="text-sm bg-red-50 border border-red-200 px-3 py-1.5 rounded font-medium text-red-700 hover:bg-red-100 transition ml-2"
      >
        Clear
      </button>
    </div>
  );
}
