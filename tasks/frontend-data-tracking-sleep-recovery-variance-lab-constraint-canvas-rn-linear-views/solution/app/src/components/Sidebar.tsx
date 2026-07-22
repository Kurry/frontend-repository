import React, { useState } from 'react';
import type { Action, AppState } from '../store';
import { Undo2, Download, Upload, Trash2 } from 'lucide-react';

interface SidebarProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  selectedId: string | null;
}

export function Sidebar({ state, dispatch, selectedId }: SidebarProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const selectedRecord = state.records.find((r) => r.id === selectedId);

  const handleExport = () => {
    const artifact = {
      schemaVersion: 'shapeshift-session-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sleep-recovery-v1-constraint-canvas.json';
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
        if (json.schemaVersion !== 'shapeshift-session-v1') {
          throw new Error('Invalid schema version');
        }
        if (!Array.isArray(json.records) || !json.derived || !Array.isArray(json.history)) {
          throw new Error('Malformed schema: missing required fields');
        }

        // Field-level validation check
        const uniqueIds = new Set();
        for (const record of json.records) {
            if (uniqueIds.has(record.id)) throw new Error('Duplicate IDs found');
            uniqueIds.add(record.id);

            if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(record.status)) {
                throw new Error('Invalid status enum');
            }
            if (record.data.durationHours < 0 || record.data.quality < 0 || record.data.quality > 10) {
                throw new Error('Invalid bounds in data');
            }
        }

        const validState: AppState = {
            records: json.records,
            derived: json.derived,
            history: json.history,
            conflictId: null,
            exportedAt: new Date().toISOString()
        };

        dispatch({ type: 'IMPORT', payload: validState });
        setImportError(null);
      } catch (err: any) {
        setImportError(err.message || 'Failed to import JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdateField = (field: string, value: number) => {
    if (!selectedRecord) return;
    dispatch({
        type: 'UPDATE_RECORD',
        payload: {
            ...selectedRecord,
            data: {
                ...selectedRecord.data,
                [field]: value
            }
        }
    });
  }

  return (
    <div className="w-full md:w-80 bg-white border-l border-gray-200 p-4 flex flex-col h-full overflow-y-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors"
          title="Undo"
        >
          <Undo2 size={16} /> Undo
        </button>
        <button
          onClick={() => dispatch({ type: 'CLEAR' })}
          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded transition-colors"
          title="Clear"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Derived Summary</h3>
        <div className="bg-blue-50 p-3 rounded text-blue-800 text-sm">
          {state.derived.summary}
        </div>
      </div>

      <div className="mb-6 flex-1">
        <h3 className="font-semibold text-gray-800 mb-2">Selected Record</h3>
        {selectedRecord ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">ID</label>
              <div className="text-sm font-medium">{selectedRecord.id}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Status</label>
              <div className="text-sm">{selectedRecord.status}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0"
                max="24"
                value={selectedRecord.data.durationHours}
                onChange={(e) => handleUpdateField('durationHours', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Quality (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={selectedRecord.data.quality}
                onChange={(e) => handleUpdateField('quality', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Select a record on the canvas to view details.</div>
        )}
      </div>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Artifact</h3>
        <div className="flex gap-2">
           <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
           >
            <Download size={14} /> Export
           </button>
           <label className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm cursor-pointer transition-colors">
            <Upload size={14} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
           </label>
        </div>
        {importError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {importError}
            </div>
        )}
      </div>
    </div>
  );
}
