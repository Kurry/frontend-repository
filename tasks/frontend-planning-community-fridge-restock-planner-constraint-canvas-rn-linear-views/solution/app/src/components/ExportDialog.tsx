import React, { useState } from 'react';
import { useStore } from '../store';
import { CommunityFridgeRestockPlannerSession } from '../types';

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const { records, history, clearSession, importSession } = useStore();
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const derivedSummary = {
    totalTasks: records.length,
    byStatus: {
      empty: records.filter((r) => r.status === 'empty').length,
      draft: records.filter((r) => r.status === 'draft').length,
      ready: records.filter((r) => r.status === 'ready').length,
      changed: records.filter((r) => r.status === 'changed').length,
      archived: records.filter((r) => r.status === 'archived').length,
    },
  };

  const sessionData: CommunityFridgeRestockPlannerSession = {
    schemaVersion: 'fridge-restock-v1',
    exportedAt: new Date().toISOString(),
    records,
    derived: derivedSummary,
    history,
  };

  const sessionJson = JSON.stringify(sessionData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionJson);
      alert('Copied to clipboard');
    } catch (e) {
      alert('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([sessionJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridge-restock-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText) as CommunityFridgeRestockPlannerSession;

      if (parsed.schemaVersion !== 'fridge-restock-v1') {
        throw new Error('Invalid schemaVersion. Expected fridge-restock-v1');
      }

      if (!Array.isArray(parsed.records) || !parsed.derived || !Array.isArray(parsed.history)) {
        throw new Error('Missing required fields: records, derived, history');
      }

      // Basic bounds check
      for (const r of parsed.records) {
        if (!r.title || r.title.length > 40) throw new Error(`Invalid title length for record ${r.id}`);
        if (typeof r.quantity !== 'number' || r.quantity <= 0) throw new Error(`Invalid quantity for record ${r.id}`);
        if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status)) throw new Error(`Invalid status for record ${r.id}`);
      }

      parsed.exportedAt = new Date().toISOString(); // regenerate exportedAt
      importSession(parsed);
      onClose();
    } catch (e: any) {
      setError(`Import failed: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold">Session Artifact</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 p-4 border-r flex flex-col">
            <h3 className="font-semibold mb-2">Export Session</h3>
            <pre className="flex-1 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto font-mono mb-4">
              {sessionJson}
            </pre>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex-1 bg-gray-200 py-2 rounded text-sm font-semibold hover:bg-gray-300">Copy JSON</button>
              <button onClick={handleDownload} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700">Download</button>
            </div>
          </div>

          <div className="w-1/2 p-4 flex flex-col">
            <h3 className="font-semibold mb-2">Import / Clear</h3>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setError(null); }}
              placeholder="Paste session JSON here..."
              className="flex-1 border p-3 rounded text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {error && <div className="text-red-600 text-xs mb-2 p-2 bg-red-50 rounded border border-red-200">{error}</div>}
            <div className="flex gap-2 mt-auto">
              <button onClick={() => { clearSession(); onClose(); }} className="flex-1 bg-red-100 text-red-700 py-2 rounded text-sm font-semibold hover:bg-red-200 border border-red-200">Clear Board</button>
              <button onClick={handleImport} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-semibold hover:bg-green-700" disabled={!importText}>Import JSON</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
