import React, { useState } from 'react';
import { Download, Upload, Copy, Check, AlertCircle } from 'lucide-react';

export default function ExportImport({ artifactData, onImport }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState(null);

  const jsonString = JSON.stringify(artifactData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-caption-v1-handoff-map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      if (!importText.trim()) {
        setError('Paste JSON to import.');
        return;
      }
      const data = JSON.parse(importText);

      // Validation
      if (data.schemaVersion !== 'v1') {
        throw new Error("Invalid schemaVersion. Expected 'v1'.");
      }
      if (!Array.isArray(data.records)) {
        throw new Error("Invalid format: 'records' must be an array.");
      }

      const validStatuses = ['draft', 'ready', 'changed', 'archived'];
      const ids = new Set();

      for (const record of data.records) {
        if (!record.id || typeof record.id !== 'string') throw new Error("Record missing valid 'id'.");
        if (ids.has(record.id)) throw new Error(`Duplicate record ID found: ${record.id}`);
        ids.add(record.id);

        if (!validStatuses.includes(record.status)) {
          throw new Error(`Invalid status '${record.status}' on record ${record.id}.`);
        }
      }

      onImport(data);
      setImportText('');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-96 bg-gray-50 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Portable Artifact</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900">Export Session</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Download JSON"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="bg-gray-900 rounded-md p-3 max-h-64 overflow-y-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {jsonString}
            </pre>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Import Session</h3>
          <textarea
            className={`w-full h-32 p-2 text-xs font-mono border rounded-md focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Paste photo-caption-v1-handoff-map.json content here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          ></textarea>
          {error && (
            <div className="mt-2 text-xs text-red-600 flex items-start">
              <AlertCircle size={14} className="mr-1 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleImport}
            className="mt-3 w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none"
          >
            <Upload size={16} className="mr-2" />
            Import & Restore
          </button>
        </div>

      </div>
    </div>
  );
}
