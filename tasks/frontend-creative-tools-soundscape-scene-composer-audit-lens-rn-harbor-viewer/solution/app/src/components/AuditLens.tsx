import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShieldCheck, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuditLens() {
  const { records, selectedRecordId, attachEvidenceAndResolve } = useStore();

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const [evidence, setEvidence] = useState('');
  const [discrepancy, setDiscrepancy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedRecord) {
      setEvidence(selectedRecord.auditLensState.evidence || '');
      setDiscrepancy(selectedRecord.auditLensState.discrepancy || '');
      setError('');
    }
  }, [selectedRecord]);

  if (!selectedRecord) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-slate-200 border-dashed p-8 text-center">
        <Search className="w-12 h-12 mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">No Record Selected</h3>
        <p className="text-sm">Select a sound layer from the collection to view or resolve audit discrepancies.</p>
      </div>
    );
  }

  const isResolved = selectedRecord.auditLensState.resolved;

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence.trim()) {
      setError('Evidence is required to resolve a discrepancy.');
      return;
    }
    if (!discrepancy.trim()) {
      setError('Discrepancy description is required.');
      return;
    }
    setError('');
    attachEvidenceAndResolve(selectedRecord.id, evidence, discrepancy);
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Audit Lens
        </h2>
        {isResolved ? (
          <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> PENDING
          </span>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Target Record</h3>
          <p className="text-lg font-semibold text-slate-800">{selectedRecord.name}</p>
          <div className="text-xs text-slate-500 mt-1 flex gap-4">
            <span>ID: {selectedRecord.id}</span>
            <span className="uppercase">Status: {selectedRecord.status}</span>
          </div>
        </div>

        {isResolved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Recorded Discrepancy</label>
              <p className="text-sm text-green-900 bg-white/50 p-2 rounded border border-green-100">
                {selectedRecord.auditLensState.discrepancy}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Attached Evidence</label>
              <p className="text-sm text-green-900 bg-white/50 p-2 rounded border border-green-100">
                {selectedRecord.auditLensState.evidence}
              </p>
            </div>
            <p className="text-xs text-green-700 pt-2 border-t border-green-200/50 mt-4">
              This record has been fully audited and resolved.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleResolve} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discrepancy Description
              </label>
              <textarea
                value={discrepancy}
                onChange={(e) => setDiscrepancy(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                rows={3}
                placeholder="Describe the discrepancy..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Attach Evidence
              </label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                rows={3}
                placeholder="Provide evidence to resolve the discrepancy..."
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              Resolve Discrepancy
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
