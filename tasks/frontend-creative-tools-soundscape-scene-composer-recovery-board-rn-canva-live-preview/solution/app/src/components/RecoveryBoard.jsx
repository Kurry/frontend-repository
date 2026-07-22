import React, { useState, useMemo } from 'react';
import { useStore } from '../store.jsx';
import { AlertTriangle, Wrench, CheckCircle2, RotateCcw } from 'lucide-react';

export const RecoveryBoard = () => {
  const { session, updateRecord, undo, canUndo } = useStore();
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // Find all failed records or records needing recovery
  const failedRecords = useMemo(() => {
    return session.records.filter(r => r.status === 'failed');
  }, [session.records]);

  const selectedRecord = useMemo(() => {
    return session.records.find(r => r.id === selectedRecordId);
  }, [session.records, selectedRecordId]);

  const handleSelect = (id) => {
    if (selectedRecordId === id) {
      setSelectedRecordId(null);
    } else {
      setSelectedRecordId(id);
    }
  };

  const handleRecover = (resolutionType) => {
    if (!selectedRecord) return;

    let updates = { status: 'changed', recoveryNotes: '' };

    // Simulate domain-specific recovery actions
    if (resolutionType === 'sync') {
      updates = { ...updates, startTime: 0 };
    } else if (resolutionType === 'mute') {
      updates = { ...updates, volume: 0 };
    } else if (resolutionType === 'archive') {
      updates = { status: 'archived', recoveryNotes: 'Archived via recovery board' };
    }

    updateRecord(selectedRecord.id, updates);
    setSelectedRecordId(null); // clear selection after resolution
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700 overflow-hidden" data-testid="recovery-board-panel">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 backdrop-blur">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench size={18} className="text-amber-500" />
          Recovery Board
        </h2>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm transition-colors"
          aria-label="Undo last mutation"
          data-testid="undo-button"
        >
          <RotateCcw size={16} /> Undo
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {failedRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-lg border border-dashed border-slate-700 p-8 text-center">
            <CheckCircle2 size={48} className="text-green-500/50 mb-4" />
            <p className="text-lg font-medium text-slate-300">All Systems Clear</p>
            <p className="text-sm mt-1">No sound layers currently require recovery.</p>
          </div>
        ) : (
          <>
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 flex gap-3 items-start">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-amber-500 font-medium text-sm">Action Required</h3>
                <p className="text-amber-500/80 text-xs mt-1">
                  {failedRecords.length} record{failedRecords.length !== 1 ? 's' : ''} failed due to conflict or data drift. Select an item to resolve its downstream consequences.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Failed Records</h4>
                {failedRecords.map(record => (
                  <button
                    key={record.id}
                    onClick={() => handleSelect(record.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRecordId === record.id
                        ? 'bg-amber-900/20 border-amber-500 scale-100 shadow-md shadow-amber-900/20'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 scale-95 opacity-80'
                    }`}
                    aria-label={`Select ${record.name} for recovery`}
                    data-testid={`recovery-item-${record.id}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-slate-200">{record.name}</span>
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wide">Conflict</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {record.recoveryNotes || 'Unspecified sync or validation drift.'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="relative">
                {selectedRecord ? (
                  <div className="absolute inset-0 bg-slate-900 border border-amber-500/30 rounded-lg p-4 flex flex-col shadow-inner">
                    <h4 className="text-sm font-medium text-slate-200 mb-4 border-b border-slate-800 pb-2">
                      Resolve: {selectedRecord.name}
                    </h4>

                    <div className="space-y-4 flex-1">
                      <p className="text-xs text-slate-400 bg-slate-800 p-2 rounded">
                        <strong>Downstream Issue:</strong> {selectedRecord.recoveryNotes || 'Data drift detected in timeline rendering context.'}
                      </p>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleRecover('sync')}
                          className="w-full text-left px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded transition-colors"
                          data-testid="resolve-sync"
                        >
                          <div className="font-medium text-blue-400">Reset sync timeline</div>
                          <div className="text-xs text-slate-400">Sets start time to 0s to resolve timeline drift.</div>
                        </button>

                        <button
                          onClick={() => handleRecover('mute')}
                          className="w-full text-left px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded transition-colors"
                          data-testid="resolve-mute"
                        >
                          <div className="font-medium text-blue-400">Mute channel</div>
                          <div className="text-xs text-slate-400">Sets volume to 0% to prevent master clipping.</div>
                        </button>

                        <button
                          onClick={() => handleRecover('archive')}
                          className="w-full text-left px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded transition-colors"
                          data-testid="resolve-archive"
                        >
                          <div className="font-medium text-slate-300">Archive layer</div>
                          <div className="text-xs text-slate-400">Moves to archive without mutating properties.</div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm p-4 text-center">
                    Select a failed record from the list to view resolution paths.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
