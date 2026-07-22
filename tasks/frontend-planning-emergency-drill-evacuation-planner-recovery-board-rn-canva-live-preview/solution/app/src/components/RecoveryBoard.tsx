import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { DomainState } from '../types';
import { AlertTriangle, CheckCircle, Undo2, XCircle } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

export function RecoveryBoard() {
  const { records, recoveryState, selectedRecordId, resolveRecovery, undo, undoStack, selectForRecovery } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const [repairNotes, setRepairNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  useEffect(() => {
    if (selectedRecordId) {
      setRepairNotes('');
      setError(null);
    }
  }, [selectedRecordId]);

  const handleResolve = (status: DomainState) => {
    if (!selectedRecord) return;

    if (status === 'archived' && repairNotes.trim() === '') {
      setError('Archiving from recovery requires repair notes.');
      return;
    }

    resolveRecovery(selectedRecord.id, status, {
      description: repairNotes ? `${selectedRecord.description}

Recovery Notes: ${repairNotes}` : selectedRecord.description,
    });
    setError(null);
  };

  const handleCancel = () => {
    selectForRecovery('');
    setError(null);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" />
          Recovery Board
        </h2>
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo last action (Cmd/Ctrl+Z)"
        >
          <Undo2 size={16} />
          Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedRecord || recoveryState === 'idle' || recoveryState === 'resolved' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-8"
            >
              <CheckCircle className="text-slate-300 mb-4" size={48} />
              <p className="text-lg font-medium text-slate-600">No active recovery</p>
              <p className="text-sm mt-2 max-w-[250px]">
                Select a failed record from the checkpoints list to move it into the recovery path.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-amber-200 rounded-lg p-5 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                    Failed Checkpoint
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecord.title}</h3>
                  <div className="text-sm text-slate-500 mt-0.5">{selectedRecord.area}</div>
                </div>
                <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 mb-5 border border-slate-100">
                {selectedRecord.description || <span className="text-slate-400 italic">No description provided</span>}
              </div>

              {error && (
                <div className="mb-4 text-sm bg-red-50 text-red-700 p-3 rounded border border-red-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Repair & Recovery Notes
                  </label>
                  <textarea
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="Document downstream consequences and repair actions..."
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    rows={4}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    Resolve Status
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResolve('changed')}
                      className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-md hover:bg-blue-100 font-medium transition-colors text-sm"
                    >
                      Mark Changed
                    </button>
                    <button
                      onClick={() => handleResolve('ready')}
                      className="flex-1 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md hover:bg-green-100 font-medium transition-colors text-sm"
                    >
                      Mark Ready
                    </button>
                    <button
                      onClick={() => handleResolve('archived')}
                      className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-200 font-medium transition-colors text-sm"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
