import { useFlavorStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export function AuditLens() {
  const { selectedId, records, lensState, lensEvidence, setLensEvidence, resolveDiscrepancy, updateRecord } = useFlavorStore();

  const record = records.find(r => r.id === selectedId);

  if (!record) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-6 text-center text-slate-500">
        <FileText className="mx-auto mb-2 opacity-50" />
        <p>Select a record to view details and use the Audit Lens.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-2 border-b pb-2">Record Inspector</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">ID</span>
            <span className="font-mono text-xs">{record.id.slice(0,8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{record.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className="capitalize">{record.status}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {record.status !== 'archived' && (
            <button
              onClick={() => updateRecord(record.id, { status: 'archived' })}
              className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
            >
              Archive
            </button>
          )}
          {record.status === 'draft' && (
            <button
              onClick={() => updateRecord(record.id, { status: 'ready' })}
              className="text-xs px-2 py-1 border border-indigo-300 text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100"
            >
              Mark Ready
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={lensState + (record.hasDiscrepancy ? 'disc' : 'ok')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={clsx(
            "border rounded-lg p-4 transition-colors",
            lensState === 'conflict' ? "border-red-300 bg-red-50" :
            lensState === 'resolved' ? "border-teal-300 bg-teal-50" :
            record.hasDiscrepancy ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
          )}
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            Audit Lens
            {record.hasDiscrepancy && <AlertTriangle className="text-amber-500" size={18} />}
            {lensState === 'resolved' && <CheckCircle className="text-teal-500" size={18} />}
          </h2>

          {record.hasDiscrepancy ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                This record has an unresolved discrepancy. Attach evidence to resolve it.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Evidence / Notes</label>
                <textarea
                  value={lensEvidence}
                  onChange={(e) => setLensEvidence(e.target.value)}
                  className="w-full border-slate-300 rounded-md p-2 text-sm border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  rows={3}
                  placeholder="Paste evidence link or notes here..."
                />
              </div>

              {lensState === 'conflict' && (
                <p className="text-xs text-red-600 font-medium">
                  Mutation rejected: Evidence cannot be empty.
                </p>
              )}

              <button
                onClick={resolveDiscrepancy}
                className="w-full py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Resolve Discrepancy
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              {record.auditEvidence ? (
                <div>
                  <p className="mb-2 font-medium text-teal-800">Discrepancy resolved</p>
                  <div className="p-2 bg-white/60 border border-teal-100 rounded text-xs break-all">
                    {record.auditEvidence}
                  </div>
                </div>
              ) : (
                <p>No active discrepancies for this record.</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
