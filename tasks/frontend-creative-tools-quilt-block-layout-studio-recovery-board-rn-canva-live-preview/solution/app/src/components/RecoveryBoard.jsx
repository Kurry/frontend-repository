import React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function RecoveryBoard() {
  const { records, recoveryBoardSelection, selectRecoveryRecord, mutateRecoveryRecord } = useStore();

  const conflictRecords = records.filter(r => r.status === 'conflict');
  const selectedRecord = records.find(r => r.id === recoveryBoardSelection);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          Recovery Board
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review blocks in conflict state and repair their downstream consequences.
        </p>
      </div>

      <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left column: Conflict Queue */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Conflict Queue ({conflictRecords.length})</h3>
          <div className="flex-1 overflow-auto space-y-3 pr-2">
            <AnimatePresence>
              {conflictRecords.length === 0 && (
                 <motion.div
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                   className="text-sm text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl"
                 >
                   All clear! No conflicts to resolve.
                 </motion.div>
              )}
              {conflictRecords.map(record => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={record.id}
                  onClick={() => selectRecoveryRecord(record.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRecoveryRecord(record.id); }}}
                  className={clsx(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    recoveryBoardSelection === record.id
                      ? "bg-red-50 border-red-300 ring-1 ring-red-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-red-200 shadow-sm hover:shadow"
                  )}
                  data-testid={`conflict-row-${record.id}`}
                >
                  <div className="font-medium text-slate-900">{record.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Dimensions: {record.dimensions}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: Action Board */}
        <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          {selectedRecord && selectedRecord.status === 'conflict' ? (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center h-full text-center" data-testid="recovery-action-panel">
              <motion.div
                layoutId={`record-${selectedRecord.id}`}
                className="w-full max-w-sm"
              >
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedRecord.name}</h3>
                  <p className="text-sm text-red-800 mb-4">This block has conflicting downstream parameters.</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold border border-red-200">
                    STATUS: CONFLICT
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Repair Actions</h4>

                  <button
                    onClick={() => mutateRecoveryRecord(selectedRecord.id, 'draft')}
                    className="w-full group flex items-center justify-between p-4 bg-white border-2 border-amber-200 hover:border-amber-400 rounded-xl transition-all hover:shadow-md text-left"
                    data-testid="btn-recover-draft"
                  >
                    <div>
                      <div className="font-semibold text-amber-900 flex items-center gap-2">
                        Move to Draft <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <div className="text-xs text-amber-700 mt-1">Clears downstream data; requires re-validation.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => mutateRecoveryRecord(selectedRecord.id, 'ready')}
                    className="w-full group flex items-center justify-between p-4 bg-white border-2 border-green-200 hover:border-green-400 rounded-xl transition-all hover:shadow-md text-left"
                    data-testid="btn-recover-ready"
                  >
                    <div>
                      <div className="font-semibold text-green-900 flex items-center gap-2">
                        Force Ready <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <div className="text-xs text-green-700 mt-1">Accepts current parameters and unblocks layout.</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400" data-testid="recovery-empty">
               <AlertCircle size={48} className="mb-4 text-slate-200" />
               <p className="text-center">Select a conflicting record from the queue<br/>to repair downstream consequences.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
