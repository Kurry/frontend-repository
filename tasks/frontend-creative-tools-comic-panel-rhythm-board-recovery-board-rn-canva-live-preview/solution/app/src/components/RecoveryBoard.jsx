import React, { useState, useEffect } from 'react';
import { useStore } from '../Store';
import { Undo, Wrench } from 'lucide-react';

export const RecoveryBoard = () => {
  const { records, selectedId, recoverRecord, undo, canUndo, setSelectedId } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);

  const [content, setContent] = useState('');
  const [timing, setTiming] = useState(0);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (selectedRecord) {
      setContent(selectedRecord.content);
      setTiming(selectedRecord.timing);
      setValidationError('');
    }
  }, [selectedRecord]);

  const handleRecover = () => {
    const t = parseInt(timing, 10);
    if (isNaN(t) || t < 0) {
      setValidationError('Timing must be a positive number');
      return;
    }
    if (!content.trim()) {
      setValidationError('Content is required');
      return;
    }
    recoverRecord(selectedId, { content, timing: t });
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 text-slate-100 rounded shadow-lg overflow-hidden border border-slate-700">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench size={20} className="text-blue-400" />
          Recovery Board
        </h2>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-slate-600 text-sm transition-colors"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {!selectedRecord ? (
          <div className="text-center text-slate-400">
            <Wrench size={48} className="mx-auto mb-4 opacity-20" />
            <p>Select a conflicting panel from the collection to enter the recovery path.</p>
          </div>
        ) : (
          <div className="max-w-md w-full mx-auto space-y-4">
            <div className="bg-red-900/30 border border-red-500/50 p-3 rounded text-red-200 text-sm">
              <strong>Conflict:</strong> {selectedRecord.error || 'Unknown error'}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Content</label>
                <input
                  type="text"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Timing (s)</label>
                <input
                  type="number"
                  value={timing}
                  onChange={e => setTiming(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {validationError && (
              <p className="text-red-400 text-sm animate-pulse">{validationError}</p>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleRecover}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors"
              >
                Apply Recovery & Repair
              </button>
              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
