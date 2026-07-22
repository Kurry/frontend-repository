import React, { useRef, useState } from 'react';
import { useStore, useDerivedSummary } from '../store';
import { Download, Upload, Activity } from 'lucide-react';

export const Inspector: React.FC = () => {
  const { records, actionHistory, importSession } = useStore();
  const derivedSummary = useDerivedSummary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const sessionData = {
      schemaVersion: 'task-specific-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: derivedSummary,
      history: actionHistory,
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1-handoff-map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = importSession(json);
        if (!result.success) {
          setImportError(result.error || 'Import failed');
        } else {
          setImportError(null);
        }
      } catch (err) {
        setImportError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
       fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Summary
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Total Records:</span>
            <span className="font-medium text-gray-800">{records.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Ready for Handoff:</span>
            <span className="font-medium text-green-600">{derivedSummary.totalReady}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Avg Mileage:</span>
            <span className="font-medium text-gray-800">{derivedSummary.averageMileage.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold mb-3">Artifact Transfer</h3>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 p-2 rounded transition-colors text-sm font-medium border border-blue-200"
          >
            <Download className="w-4 h-4" />
            Export Artifact
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 hover:bg-gray-50 p-2 rounded transition-colors text-sm font-medium border border-gray-300"
          >
            <Upload className="w-4 h-4" />
            Import Artifact
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImport}
          />
          {importError && (
             <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
               {importError}
             </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1">
        <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wider">History Log</h3>
        <div className="space-y-1">
          {actionHistory.slice(-10).reverse().map((log, i) => (
            <div key={i} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0 truncate" title={log}>
              {log}
            </div>
          ))}
          {actionHistory.length === 0 && <div className="text-xs text-gray-400">No actions yet</div>}
        </div>
      </div>
    </div>
  );
};
