import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ExportImport: React.FC = () => {
  const { exportSession, importSession, records } = useStore();
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speaker-greenroom-v1-batch-reconciler-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus({ type: 'success', message: 'Session exported successfully.' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const result = importSession(parsed);

      if (result.success) {
        setStatus({ type: 'success', message: 'Session imported successfully.' });
        setImportText('');
      } else {
        setStatus({ type: 'error', message: result.error || 'Import failed.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Invalid JSON format.' });
    }

    setTimeout(() => setStatus(null), 3000);
  };

  const summary = useStore(state => {
    const derived = state.exportSession().derived.summary;
    return derived;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Session Artifacts</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Slots</p>
          <p className="text-xl font-medium text-gray-900">{summary.totalSlots}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Ready</p>
          <p className="text-xl font-medium text-gray-900">{summary.readyCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <Download size={16} /> Export Session
        </button>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Import Artifact</h3>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste speaker-greenroom-v1-batch-reconciler.json here..."
            className="w-full h-32 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2 mb-2 font-mono"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Upload size={16} /> Import & Replace
          </button>
        </div>

        {status && (
          <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${
            status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};
