import React, { useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash2 } from 'lucide-react';
import { createExportPayload, validateImportPayload } from '../utils/artifact';

export function ArtifactManager() {
  const store = useStore();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const payload = createExportPayload(store);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-annotations-v1.json';
    document.body.appendChild(a);
    a.click();
    // Intentionally omit document.body.removeChild(a) per memory guidelines to prevent race conditions in headless
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      store.clearSession();
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const validated = validateImportPayload(payload);
        store.importSession(validated);
        alert("Session imported successfully!");
      } catch (err) {
        alert(`Import failed: ${err.message}. Prior valid state preserved.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
      >
        <Download size={16} /> Export JSON
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-300"
      >
        <Upload size={16} /> Import JSON
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={handleClear}
        className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200"
      >
        <Trash2 size={16} /> Clear Session
      </button>
    </div>
  );
}
