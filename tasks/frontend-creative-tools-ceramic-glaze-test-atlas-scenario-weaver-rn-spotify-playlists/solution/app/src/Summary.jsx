import { useStore } from './store';
import { ChartLine, Data_1, EventSchedule } from '@carbon/icons-react';
import { useState } from 'react';

export default function Summary() {
  const { derived, exportSession, importSession, clearSession } = useStore();
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);

  const handleExport = () => {
      const data = exportSession();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glaze-atlas-v1-scenario-weaver.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }, 100);
  };

  const handleImport = () => {
      try {
          const data = JSON.parse(importText);
          const res = importSession(data);
          if (!res.success) {
              setImportError('Invalid schema: ' + res.error.message);
          } else {
              setImportError(null);
              setImportText('');
          }
      } catch (e) {
          setImportError('Invalid JSON format');
      }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <ChartLine size={20} /> Derived Summary
            </h2>
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 bg-gray-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-gray-800">{derived.summary.totalTests}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Tests</div>
            </div>
            <div className="flex-1 bg-green-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-700">{derived.summary.readyCount}</div>
                <div className="text-xs text-green-600 uppercase tracking-wider">Ready</div>
            </div>
            <div className="flex-1 bg-orange-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-700">{derived.summary.queuedCount}</div>
                <div className="text-xs text-orange-600 uppercase tracking-wider">Queued</div>
            </div>
        </div>

        <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Data_1 size={16} /> Data Contract
                </h3>
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={handleExport}
                        className="flex-1 bg-gray-800 text-white text-sm py-2 rounded hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Export JSON
                    </button>
                    <button
                        onClick={clearSession}
                        className="flex-1 bg-red-50 text-red-700 text-sm py-2 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Clear All
                    </button>
                </div>

                <div className="text-xs mb-1 font-medium text-gray-600">Import Session</div>
                <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste JSON here..."
                    className="w-full h-24 p-2 border border-gray-300 rounded text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="w-full mt-2 bg-blue-600 text-white text-sm py-2 rounded disabled:opacity-50 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Import
                </button>
                {importError && (
                    <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200 break-words" role="alert" aria-live="polite">
                        {importError}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
