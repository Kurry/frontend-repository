import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Copy, RotateCcw, Plus } from 'lucide-react';

export function ExportImport() {
  const { records, auditLensState, derived, history, importData, clearData, undo, addRecord } = useStore();
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const data = {
      schemaVersion: 'kiln-load-v1',
      exportedAt: new Date().toISOString(),
      records,
      auditLensState,
      derived,
      history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kiln-load-v1-audit-lens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const data = {
      schemaVersion: 'kiln-load-v1',
      exportedAt: new Date().toISOString(),
      records,
      auditLensState,
      derived,
      history
    };

    // Fallback for headless tests
    const textArea = document.createElement('textarea');
    textArea.value = JSON.stringify(data, null, 2);
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.schemaVersion !== 'kiln-load-v1') {
          setImportError('Invalid schemaVersion. Expected kiln-load-v1');
          return;
        }
        if (!Array.isArray(parsed.records)) {
          setImportError('Missing or invalid records array');
          return;
        }

        // Additional field validation
        for (const r of parsed.records) {
          if (!r.id || !r.status) {
            setImportError('Invalid record found. Missing id or status.');
            return;
          }
        }

        importData(parsed);
      } catch (err) {
        setImportError('Malformed JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Workspace & Artifact</h2>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => addRecord({ title: 'New Kiln Piece', status: 'draft', evidence: '' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-md font-medium text-sm hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} /> Add Kiln Piece
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md font-medium text-sm hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={16} /> Undo
          </button>

          <button
            onClick={clearData}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md font-medium text-sm hover:bg-red-50 transition-colors"
          >
            Clear Data
          </button>
        </div>

        <div className="border-t border-neutral-200 my-2"></div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md font-medium text-sm hover:bg-neutral-200 transition-colors"
          >
            <Download size={16} /> Export
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md font-medium text-sm hover:bg-neutral-200 transition-colors"
          >
            <Copy size={16} /> Copy
          </button>
        </div>

        <div>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md font-medium text-sm hover:bg-neutral-50 cursor-pointer transition-colors">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          {importError && (
            <p className="mt-2 text-sm text-red-600 text-center">{importError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
