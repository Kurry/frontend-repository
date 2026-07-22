import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Search, Upload } from 'lucide-react';

export function AuditLens() {
  const { records, selectedInvoiceId, attachEvidenceAndResolve, markConflict } = useStore();
  const [evidenceInput, setEvidenceInput] = useState('');

  const selectedRecord = records.find(r => r.id === selectedInvoiceId);

  // Reset input when selection changes
  useEffect(() => {
    setEvidenceInput('');
  }, [selectedInvoiceId]);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white dark:bg-gray-950 p-8">
        <Search className="w-12 h-12 mb-4 opacity-50" />
        <p>Select an invoice to inspect with Audit Lens</p>
      </div>
    );
  }

  const handleResolve = () => {
    if (evidenceInput.trim()) {
      attachEvidenceAndResolve(selectedRecord.id, evidenceInput);
    }
  };

  const handleConflict = () => {
    markConflict(selectedRecord.id);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 p-6 overflow-y-auto">
      <motion.div
        key={selectedRecord.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl w-full mx-auto"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Audit Lens</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{selectedRecord.id}</code></span>
            <span>•</span>
            <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{selectedRecord.status}</span>
          </div>
        </div>

        <div className="grid gap-6 mb-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div>
            <div className="text-sm text-gray-500 mb-1">Client</div>
            <div className="text-xl">{selectedRecord.clientName}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Amount</div>
              <div className="text-2xl font-mono">${selectedRecord.amount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Due Date</div>
              <div className="text-lg">{new Date(selectedRecord.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            Discrepancy Resolution
            {selectedRecord.auditLensState === 'resolved' && <CheckCircle className="text-green-500 w-5 h-5" />}
            {selectedRecord.auditLensState === 'conflict' && <AlertTriangle className="text-red-500 w-5 h-5" />}
          </h3>

          {selectedRecord.auditLensState === 'resolved' ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
              <div className="font-semibold mb-2">Audit Resolved</div>
              <div className="text-sm mb-1">Evidence attached:</div>
              <div className="font-mono text-sm bg-white dark:bg-gray-950 p-2 rounded">{selectedRecord.evidence}</div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="evidence" className="block text-sm font-medium mb-2">Attach Evidence Document URL / Reference</label>
                <div className="flex gap-2">
                  <input
                    id="evidence"
                    type="text"
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    placeholder="e.g., https://docs.example.com/receipts/123"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && evidenceInput.trim()) {
                        handleResolve();
                      }
                    }}
                  />
                </div>
                {!evidenceInput.trim() && <p className="text-sm text-gray-500 mt-1">Evidence is required to resolve.</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  disabled={!evidenceInput.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Attach & Resolve
                </button>
                <button
                  onClick={handleConflict}
                  className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Mark Conflict
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
