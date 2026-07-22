import { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash2, Code } from 'lucide-react';

export function SessionManager() {
  const exportSession = useStore(state => state.exportSession);
  const importSession = useStore(state => state.importSession);
  const clearSession = useStore(state => state.clearSession);
  const derived = useStore(state => state.derived);

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      importSession(data);
      setImportText('');
      setImportError('');
      setShowImport(false);
    } catch (e: any) {
      setImportError(e.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col h-full overflow-hidden">
      <h2 className="font-semibold text-sm mb-4 border-b pb-2 flex justify-between items-center">
        <span>Session Manager</span>
        <div className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {derived.totalExperiments} Total • Avg {derived.averageDose.toFixed(1)}g / {derived.averageYield.toFixed(1)}g
        </div>
      </h2>

      <div className="space-y-3 flex-1 overflow-y-auto">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 p-2 rounded border border-blue-200 hover:bg-blue-100 transition-colors text-sm"
        >
          <Download size={16} /> Export Session JSON
        </button>

        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 p-2 rounded border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
        >
          <Upload size={16} /> Import Session
        </button>

        {showImport && (
          <div className="p-3 bg-gray-50 border rounded-md text-sm space-y-2">
            <textarea
              className="w-full p-2 border rounded text-xs font-mono h-32 focus:ring-2 focus:ring-blue-500"
              placeholder="Paste session JSON here..."
              value={importText}
              onChange={e => {
                setImportText(e.target.value);
                setImportError('');
              }}
            />
            {importError && <div className="text-red-500 text-xs">{importError}</div>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Apply Import
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 mt-auto">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                clearSession();
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded border border-transparent hover:border-red-200 transition-colors text-sm"
          >
            <Trash2 size={16} /> Clear Session
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t text-xs text-gray-400 font-mono text-center">
        <Code size={12} className="inline mr-1" /> brew-experiment-v1-forecast-ribbon.json
      </div>
    </div>
  );
}
