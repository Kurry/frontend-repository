import React, { useRef, useState } from 'react';
import { useStore, getSessionState, importSession } from '../store';
import { Download, Upload, AlertCircle, Check } from 'lucide-react';

export default function Artifacts() {
  const { derived, exportedAt } = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = () => {
    const state = getSessionState();

    // Regenerate exportedAt for the export artifact
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydration-pattern-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess('Export successful.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        // Validation
        if (parsed.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion, must be 'v1'");
        if (!Array.isArray(parsed.records)) throw new Error("Missing or invalid 'records' array");

        const validStatuses = ['draft', 'ready', 'changed', 'archived'];
        const ids = new Set();

        for (const record of parsed.records) {
          if (!record.id) throw new Error("Record missing ID");
          if (ids.has(record.id)) throw new Error(`Duplicate ID found: ${record.id}`);
          ids.add(record.id);

          if (!validStatuses.includes(record.status)) {
            throw new Error(`Invalid status: ${record.status}`);
          }
          if (typeof record.amount !== 'number' || record.amount <= 0 || record.amount > 5000) {
            throw new Error(`Invalid amount bounds for record ${record.id}`);
          }
        }

        importSession(parsed);
        setSuccess('Import successful.');
        setError(null);
      } catch (err) {
        setError(err.message);
        setSuccess(null);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Portable Work Artifact</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 transition"
        >
          <Download size={16} /> Export Session
        </button>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          id="import-upload"
        />
        <label
          htmlFor="import-upload"
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition cursor-pointer"
        >
          <Upload size={16} /> Import Session
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
          <Check size={16} /> {success}
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
        <p><strong>Derived Summary:</strong> {derived.summary}</p>
        <p><strong>Last Exported:</strong> {exportedAt ? new Date(exportedAt).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
}
