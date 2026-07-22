import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';

export function AuditLens() {
  const { records, auditLensState, resolveAuditDiscrepancy } = useStore();
  const [evidenceText, setEvidenceText] = useState('');

  const selectedRecord = records.find(r => r.id === auditLensState.selectedId);

  useEffect(() => {
    if (selectedRecord) {
      setEvidenceText(selectedRecord.evidence || '');
    }
  }, [selectedRecord?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRecord) {
      resolveAuditDiscrepancy(selectedRecord.id, evidenceText);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Audit Lens</h2>

      <AnimatePresence mode="wait">
        {auditLensState.status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-300"
          >
            Select a record from the collection to audit.
          </motion.div>
        )}

        {auditLensState.status !== 'idle' && selectedRecord && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-4">
              <div className="text-sm text-neutral-500 mb-1">Auditing</div>
              <div className="font-medium text-lg text-neutral-900">{selectedRecord.title || 'Untitled'}</div>
              <div className="text-xs text-neutral-400 font-mono mt-1">{selectedRecord.id}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="evidence" className="block text-sm font-medium text-neutral-700 mb-1">
                  Evidence
                </label>
                <textarea
                  id="evidence"
                  rows={3}
                  className={`w-full rounded-md border ${auditLensState.status === 'conflict' ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300 focus:ring-blue-500'} p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1`}
                  placeholder="Attach evidence to resolve discrepancy..."
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                />
                {auditLensState.status === 'conflict' && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> Evidence cannot be empty to resolve a discrepancy.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Resolve Discrepancy
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
