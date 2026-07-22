import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash } from 'lucide-react';

export const ArtifactManager = () => {
  const exportSession = useStore(state => state.exportSession);
  const importSession = useStore(state => state.importSession);
  const clearSession = useStore(state => state.clearSession);

  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kiln-load-v1.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importSession(json);
        if (!success) {
          setImportError('Invalid schema. Expected v1.');
        } else {
          setImportError('');
        }
      } catch (err) {
        setImportError('Malformed JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10 relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ceramic Kiln Load Composer</h1>
      </div>
      <div className="flex gap-3 items-center">
        {importError && <span className="text-red-500 text-sm font-medium" aria-live="polite">{importError}</span>}
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import artifact"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Download size={16} /> Export
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          onClick={clearSession}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Clear session"
        >
          <Trash size={16} /> Clear
        </button>
      </div>
    </div>
  );
};
