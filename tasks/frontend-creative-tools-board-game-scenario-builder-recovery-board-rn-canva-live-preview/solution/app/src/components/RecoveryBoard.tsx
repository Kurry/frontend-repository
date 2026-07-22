import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export function RecoveryBoard() {
  const records = useStore((state) => state.records);
  const recoverRecord = useStore((state) => state.recoverRecord);
  const undo = useStore((state) => state.undo);
  const history = useStore((state) => state.history);

  const failedRecords = records.filter(r => r.status === 'failed');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRecord = failedRecords.find(r => r.id === selectedId) || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-700">Recovery Board</h2>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50 text-sm font-medium transition-colors"
            aria-label="Undo last mutation"
          >
            Undo (Ctrl+Z)
          </button>
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded border border-red-200 min-h-[300px] flex gap-6 overflow-x-auto relative">

        {/* Failed list */}
        <div className="w-1/3 min-w-[250px] flex flex-col gap-3">
          <h3 className="font-semibold text-red-900 mb-2">Failed Scenarios</h3>
          <AnimatePresence>
            {failedRecords.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 italic"
              >
                No failed scenarios right now.
              </motion.div>
            )}
            {failedRecords.map((record) => (
              <motion.button
                key={record.id}
                layoutId={`card-${record.id}`}
                onClick={() => setSelectedId(record.id)}
                className={`text-left p-3 rounded border shadow-sm transition-colors ${selectedId === record.id ? 'bg-red-100 border-red-400 ring-2 ring-red-300' : 'bg-white border-red-200 hover:border-red-300'}`}
              >
                <div className="font-semibold text-red-900">{record.title}</div>
                <div className="text-xs text-red-700 mt-1 line-clamp-2">{record.description}</div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Action Panel */}
        <div className="w-2/3 min-w-[300px] bg-white rounded border border-slate-200 p-6 flex flex-col">
          {selectedRecord ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full"
              >
                <h3 className="text-lg font-bold mb-2">Repair & Recover</h3>
                <p className="text-sm text-slate-600 mb-6">Move this failed record into a recovery path and repair its downstream consequences.</p>

                <div className="bg-slate-50 p-4 rounded border border-slate-100 mb-6">
                  <div className="font-medium">{selectedRecord.title}</div>
                  <div className="text-sm text-slate-500 mt-1">{selectedRecord.description}</div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <button
                    onClick={() => {
                      recoverRecord(selectedRecord.id, {
                        title: `${selectedRecord.title} (Recovered)`,
                        difficulty: Math.max(1, selectedRecord.difficulty - 1)
                      });
                      setSelectedId(null);
                    }}
                    className="w-full py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Apply Recovery Path
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p>Select a failed record to begin recovery.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
