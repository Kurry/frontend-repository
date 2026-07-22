import React, { useState } from 'react';
import { useStore } from '../store';
import { FileSearch, CheckCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuditLens() {
  const { records, activeSelectionId, attachEvidenceAndResolve, undo } = useStore();
  const [evidenceInput, setEvidenceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeRecord = records.find(r => r.id === activeSelectionId);

  const handleResolve = () => {
    if (!activeRecord) return;
    if (!evidenceInput.trim()) {
      setError('Evidence text is required to resolve a discrepancy.');
      return;
    }
    attachEvidenceAndResolve(activeRecord.id, evidenceInput);
    setEvidenceInput('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-blue-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <FileSearch className="w-5 h-5" />
          Audit Lens
        </h2>
        <button
          onClick={undo}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          title="Undo last action (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" /> Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!activeRecord ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full text-slate-400 text-sm p-4 text-center border-2 border-dashed border-slate-100 rounded-lg"
            >
              Select a record from the collection to view audit details and attach evidence.
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3 bg-blue-50 rounded border border-blue-100">
                <h3 className="font-medium text-blue-900">{activeRecord.name}</h3>
                <p className="text-sm text-blue-700">Current Status: <span className="uppercase font-semibold">{activeRecord.status}</span></p>
                {activeRecord.discrepancy && (
                  <p className="text-sm text-red-600 mt-2 font-medium bg-red-50 p-2 rounded">Discrepancy: {activeRecord.discrepancy}</p>
                )}
                {activeRecord.evidence && (
                  <p className="text-sm text-green-700 mt-2 font-medium bg-green-50 p-2 rounded flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Evidence: {activeRecord.evidence}
                  </p>
                )}
              </div>

              {(activeRecord.status !== 'archived' && activeRecord.status !== 'ready') && (
                <div className="space-y-2 mt-4">
                  <label className="block text-sm font-medium text-slate-700">Attach Evidence</label>
                  <textarea
                    value={evidenceInput}
                    onChange={e => { setEvidenceInput(e.target.value); setError(null); }}
                    className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24 ${error ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Enter evidence URL, text, or file reference..."
                  />
                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                  <button
                    onClick={handleResolve}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md shadow-sm transition-colors"
                  >
                    Attach & Resolve
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
