import React, { useRef, useState } from 'react';
import type { AppState } from '../types';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';

interface ArtifactExportProps {
  currentState: AppState;
  onImport: (state: AppState) => void;
  onClear: () => void;
}

export const ArtifactExport: React.FC<ArtifactExportProps> = ({ currentState, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const dataToExport = {
      ...currentState,
      exportedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "fridge-restock-v1-scenario-weaver.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as AppState;

        // Basic schema validation
        if (parsed.schemaVersion !== 'v1') throw new Error("Invalid schema version. Expected 'v1'.");
        if (!Array.isArray(parsed.records)) throw new Error("Missing or invalid 'records' array.");
        if (!parsed.derived || typeof parsed.derived !== 'object') throw new Error("Missing or invalid 'derived' state.");

        // Regenerate exportedAt to reflect import time or new active state time
        parsed.exportedAt = new Date().toISOString();

        onImport(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON file format.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace State</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Export Workspace
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          <Upload className="w-4 h-4" />
          Import Data
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          aria-label="Import JSON file"
        />

        <button
          onClick={onClear}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors font-medium text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Clear Data
        </button>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Last Exported: {currentState.exportedAt ? new Date(currentState.exportedAt).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};
