import { useState } from 'react';
import type { WorkRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FileCheck2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  record: WorkRecord | null;
  onAttachEvidenceAndResolve: (id: string, evidence: string) => void;
  onUndo: () => void;
}

export function AuditLens({ record, onAttachEvidenceAndResolve, onUndo }: Props) {
  const [evidenceText, setEvidenceText] = useState('');

  if (!record) {
    return (
      <div className="flex-1 bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center text-gray-400">
        <FileCheck2 size={48} className="mb-4 opacity-20" />
        <p>Select a work task to open the Audit Lens</p>
      </div>
    );
  }

  const isConflict = record.auditLensState === 'conflict';
  const isResolved = record.auditLensState === 'resolved';

  return (
    <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 flex flex-col shadow-sm">
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Audit Lens</h2>
          <p className="text-sm text-gray-500 mt-1">Reviewing: {record.title}</p>
        </div>
        <button
          onClick={onUndo}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
          title="Undo last action (Ctrl+Z)"
        >
          <RotateCcw size={18} />
          <span className="text-sm hidden sm:inline">Undo</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isResolved ? (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-green-50 rounded-lg p-8"
          >
            <CheckCircle2 size={64} className="text-leaf" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Discrepancy Resolved</h3>
              <p className="text-green-700 mt-2 max-w-md">
                Evidence "{record.evidence}" has been securely attached and the record is now verified.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="audit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3
              ${isConflict ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}
            `}>
              <AlertTriangle className={isConflict ? 'text-red-500' : 'text-blue-500'} />
              <div>
                <h4 className={`font-semibold ${isConflict ? 'text-red-800' : 'text-blue-800'}`}>
                  {isConflict ? 'Audit Discrepancy Detected' : 'Pending Verification'}
                </h4>
                <p className={`text-sm mt-1 ${isConflict ? 'text-red-600' : 'text-blue-600'}`}>
                  {isConflict
                    ? 'This task was flagged during the last field review. Attach photographic or log evidence to clear the flag.'
                    : 'Attach evidence to verify the completion of this task.'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence Reference (URL or Log ID)
                </label>
                <input
                  type="text"
                  value={evidenceText}
                  onChange={e => setEvidenceText(e.target.value)}
                  placeholder="e.g. log-2024-05-12 or https://..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
                />
              </div>
              <button
                disabled={!evidenceText.trim()}
                onClick={() => {
                  onAttachEvidenceAndResolve(record.id, evidenceText);
                  setEvidenceText('');
                }}
                className="w-full py-3 px-4 bg-earth hover:bg-[#734A23] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                Attach Evidence & Resolve
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
