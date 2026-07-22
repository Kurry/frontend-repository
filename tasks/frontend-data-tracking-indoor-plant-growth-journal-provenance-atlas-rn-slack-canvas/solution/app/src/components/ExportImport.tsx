import React, { useRef, useState } from 'react';
import { IndoorPlantGrowthJournalSession } from '../store';
import { Download, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface ExportImportProps {
  onExport: () => IndoorPlantGrowthJournalSession;
  onImport: (session: IndoorPlantGrowthJournalSession) => void;
  onClear: () => void;
}

export function ExportImport({ onExport, onImport, onClear }: ExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const session = onExport();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "plant-growth-v1-provenance-atlas.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        if (json.schemaVersion !== 'plant-growth-v1') {
          throw new Error("Invalid schemaVersion. Expected 'plant-growth-v1'");
        }
        if (!Array.isArray(json.records)) {
          throw new Error("Invalid format: records must be an array");
        }

        const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
        const ids = new Set();

        for (const record of json.records) {
          if (!record.id) throw new Error("Record missing id");
          if (ids.has(record.id)) throw new Error(`Duplicate record id: ${record.id}`);
          ids.add(record.id);

          if (!validStatuses.includes(record.status)) {
            throw new Error(`Invalid status '${record.status}' for record ${record.id}`);
          }
          if (typeof record.heightCm !== 'number' || record.heightCm < 0) {
            throw new Error(`Invalid heightCm for record ${record.id}. Must be a non-negative number.`);
          }
        }

        onImport(json as IndoorPlantGrowthJournalSession);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Portable Artifact</h3>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 flex-1 justify-center"
          >
            <Download size={16} /> Export
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 flex-1 justify-center"
          >
            <Upload size={16} /> Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
            title="Clear Session"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {importError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
