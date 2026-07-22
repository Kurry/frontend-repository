import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, X } from 'lucide-react';

export function ExportImportModal({ isOpen, onClose }) {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState(null);
  const { records, history, importData, clearData } = useStore();

  if (!isOpen) return null;

  const exportData = () => {
    const data = {
      schemaVersion: 'scenario-builder-v1',
      exportedAt: new Date().toISOString(),
      records,
      history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-forecast-ribbon.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.schemaVersion !== 'scenario-builder-v1') {
        throw new Error('Invalid schema version');
      }
      if (!Array.isArray(data.records)) {
        throw new Error('Records must be an array');
      }
      // additional field validations
      for (const r of data.records) {
        if (!r.id || !r.title || !r.state || typeof r.cost !== 'number' || typeof r.likelihood !== 'number') {
          throw new Error('Invalid record fields');
        }
        if (r.cost < 0 || r.cost > 100 || r.likelihood < 0 || r.likelihood > 100) {
          throw new Error('Out of bounds values in import');
        }
      }
      clearData();
      importData(data);
      setError(null);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Data Management</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Export Data</h3>
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold mb-2">Import Data</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-32 p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-2 font-mono text-sm"
              placeholder="Paste JSON data here..."
            />
            {error && <p className="text-red-600 text-sm mb-2" role="alert" aria-live="polite">{error}</p>}
            <button
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-900"
            >
              <Upload className="w-4 h-4" /> Import JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
