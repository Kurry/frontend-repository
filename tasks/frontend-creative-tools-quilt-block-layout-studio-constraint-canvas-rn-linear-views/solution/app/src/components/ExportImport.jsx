import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export function ExportImport({ onClose }) {
  const { exportSession, importSession, clearState } = useStore();
  const [importText, setImportText] = useState('');
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('export'); // 'export' or 'import'

  const handleCopy = async () => {
    try {
      const data = exportSession();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      setError(null);
      const data = JSON.parse(importText);
      const success = importSession(data);
      if (success) {
        onClose();
      } else {
        setError('Invalid schema or values.');
      }
    } catch (e) {
      setError('Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-bold ${tab === 'export' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('export')}
          >
            Export Session
          </button>
          <button
            className={`flex-1 py-3 font-bold ${tab === 'import' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('import')}
          >
            Import Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'export' ? (
            <div className="flex flex-col h-full gap-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto flex-1 text-xs">
                {JSON.stringify(exportSession(), null, 2)}
              </pre>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300 font-bold transition">Copy to Clipboard</button>
                <button onClick={handleDownload} className="flex-1 bg-primary text-white py-2 rounded hover:bg-primary-dark font-bold transition">Download JSON</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              <p className="text-sm text-gray-600">Paste your session JSON below.</p>
              <textarea
                className="w-full flex-1 border rounded p-4 font-mono text-sm"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON here..."
              />
              {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
              <div className="flex gap-2">
                <button onClick={clearState} className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 font-bold transition">Clear State</button>
                <button onClick={handleImport} className="flex-1 bg-primary text-white py-2 rounded hover:bg-primary-dark font-bold transition">Import</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 transition font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}
