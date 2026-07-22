import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wrench, ArrowRight, XCircle } from 'lucide-react';

export const RecoveryBoard: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
  const { records, recoverRecord, undo } = useStore();
  const record = records.find(r => r.id === selectedId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRecover = () => {
    if (!record) return;
    if (!reason.trim()) {
      setError("Please provide a reason to complete the mutation.");
      return;
    }
    setError(null);
    // Canonical mutation: move a failed record into a recovery path and repair its downstream consequences
    recoverRecord(record.id, reason);
    setReason('');
  };

  const isFailed = record?.status === 'empty'; // Domain maps failed to 'empty' status for this context
  const isRecovered = record?.status === 'changed' && record?.recoveryBoardState?.resolved;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Wrench size={20} className="text-blue-600" />
          Recovery Board
        </h2>
        <button
          onClick={undo}
          className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          title="Undo last mutation (Ctrl+Z)"
        >
          Undo
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center bg-slate-50 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!record ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-500 flex flex-col items-center justify-center h-full"
            >
              <AlertTriangle size={48} className="text-gray-300 mb-4" />
              <p>Select a record from the collection to manage its recovery path.</p>
            </motion.div>
          ) : isRecovered ? (
            <motion.div
              key="resolved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md border border-purple-200 max-w-md mx-auto w-full text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record Recovered</h3>
              <p className="text-gray-600 mb-4">
                <span className="font-medium text-gray-900">{record.name}</span> has been moved to the changed path.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm text-left border border-gray-100">
                <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Reason provided</p>
                <p className="text-gray-800">{record.recoveryBoardState?.reason}</p>
              </div>
            </motion.div>
          ) : isFailed ? (
            <motion.div
              key="conflict"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-6 rounded-xl shadow-md border border-red-200 max-w-md mx-auto w-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="mt-1 bg-red-100 p-2 rounded-full">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Failed Record Detected</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{record.name}</span> requires intervention.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Reason / Action Taken
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                    placeholder="E.g., Substituted with fresh yeast from backup supply..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleRecover}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium shadow-sm"
                >
                  Repair Downstream Consequences
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto w-full text-center"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">{record.name}</h3>
              <p className="text-gray-500 text-sm mb-4">
                This record is currently in <span className="font-semibold">{record.status}</span> state and does not require recovery.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
