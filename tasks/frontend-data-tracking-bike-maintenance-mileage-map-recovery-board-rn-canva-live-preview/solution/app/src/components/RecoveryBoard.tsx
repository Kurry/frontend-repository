import React, { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const RecoveryBoard: React.FC = () => {
  const { current, moveToRecovery, selectRecordForRecovery } = useStore();
  const [recoveryInput, setRecoveryInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedId = current.recoveryBoardState?.selectedRecordId;
  const failedRecords = current.records.filter(r => r.status === 'failed');
  const recoveryRecords = current.records.filter(r => r.status === 'recovery');

  const selectedRecord = current.records.find(r => r.id === selectedId);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setError("Select a record first");
      return;
    }
    if (!recoveryInput.trim()) {
      setError("Recovery action is required");
      return;
    }
    moveToRecovery(selectedId, recoveryInput);
    setRecoveryInput('');
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg shadow-lg border border-slate-800 overflow-hidden text-slate-100">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
        <Wrench size={18} className="text-amber-500" />
        <h2 className="text-lg font-semibold text-white">Recovery Board</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">

        {/* Failed Queue */}
        <section>
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex justify-between">
            <span>Needs Recovery</span>
            <span className="bg-red-500/20 text-red-400 px-2 rounded-full text-xs py-0.5">{failedRecords.length}</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {failedRecords.length === 0 ? (
               <div className="text-sm text-slate-500 italic w-full text-center py-4 bg-slate-800/30 rounded-lg border border-slate-800/50">
                 No failed records
               </div>
            ) : (
              <AnimatePresence>
                {failedRecords.map(record => (
                  <motion.button
                    layoutId={`rec-${record.id}`}
                    key={record.id}
                    onClick={() => {
                        selectRecordForRecovery(record.id);
                        setError(null);
                    }}
                    className={`text-left p-3 rounded-lg border transition-all w-full max-w-sm ${
                      selectedId === record.id
                        ? 'bg-amber-900/40 border-amber-500/50 ring-1 ring-amber-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-slate-200">{record.title}</span>
                      <AlertTriangle size={14} className="text-red-400 mt-0.5" />
                    </div>
                    <div className="text-xs text-slate-400 truncate">{record.notes || 'No notes'}</div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Active Mutation Area */}
        {selectedRecord && selectedRecord.status === 'failed' && (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden"
           >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Resolve Issue</h3>

              <div className="flex items-center gap-4 mb-4">
                 <div className="flex-1 bg-slate-900 p-3 rounded-md border border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Failed Record</div>
                    <div className="text-sm font-medium">{selectedRecord.title}</div>
                 </div>
                 <ArrowRight className="text-slate-500 shrink-0" />
                 <div className="flex-1 bg-amber-950/30 p-3 rounded-md border border-amber-900/50 border-dashed">
                    <div className="text-xs text-amber-500/70 mb-1">Target State</div>
                    <div className="text-sm font-medium text-amber-100">Recovery Path</div>
                 </div>
              </div>

              {error && <div className="text-xs text-red-400 mb-3">{error}</div>}

              <form onSubmit={handleRecover} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Action taken (e.g. Parts ordered)"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Move to Recovery
                </button>
              </form>
           </motion.div>
        )}

        {/* Recovered Items */}
        <section className="mt-auto pt-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" /> In Recovery
          </h3>
          <div className="flex flex-wrap gap-2">
             {recoveryRecords.map(record => (
                <motion.div
                  layoutId={`rec-${record.id}`}
                  key={record.id}
                  className="bg-slate-800 border border-slate-700 p-2 px-3 rounded-md text-xs flex items-center gap-2"
                >
                  <span className="text-slate-300 truncate max-w-[150px] font-medium">{record.title}</span>
                  <span className="text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded text-[10px]">Recovery</span>
                </motion.div>
             ))}
          </div>
        </section>

      </div>
    </div>
  );
};
