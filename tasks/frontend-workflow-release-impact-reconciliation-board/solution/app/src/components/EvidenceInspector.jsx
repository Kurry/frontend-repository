import React from 'react';
import { useStore } from '../store';

export function EvidenceInspector() {
  const selectedEntryId = useStore(state => state.selectedEntryId);
  const entries = useStore(state => state.entries);
  const exportData = useStore(state => state.exportData);
  const clearSession = useStore(state => state.clearSession);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'release-impact-pack-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <div className="flex gap-2">
            <button onClick={handleExport} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Export</button>
            <button onClick={clearSession} className="text-xs bg-gray-200 px-2 py-1 rounded">Clear</button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {selectedEntry ? (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{selectedEntry.title}</h3>
            <div className="text-sm text-gray-600 mb-4">
              <strong>Type:</strong> {selectedEntry.changeType} <br/>
              <strong>Status:</strong> {selectedEntry.status}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-800 mb-2">Risk Summary</h4>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="text-sm">High Risk</span>
                 <span className="font-bold text-red-600">0%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic text-center mt-10">
            Select a surface or entry to view details.
          </div>
        )}
      </div>
    </div>
  );
}
