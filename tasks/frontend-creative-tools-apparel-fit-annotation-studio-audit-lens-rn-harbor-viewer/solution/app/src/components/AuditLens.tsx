import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { FileWarning, CheckCircle2, FileUp, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuditLens({
  selectedId,
  onClose
}: {
  selectedId: string | null;
  onClose: () => void;
}) {
  const { session, attachEvidenceAndResolve, undo } = useStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const record = session.records.find(r => r.id === selectedId);

  // Keyboard job switching: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, undo]);

  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-lg shadow-sm border border-gray-200">
        <FileWarning className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select an annotation to audit</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 bg-white rounded-lg shadow-sm border border-gray-200">
        <XCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">Record not found</p>
      </div>
    );
  }

  const handleAttachEvidence = () => {
    setErrorMsg(null);
    const res = attachEvidenceAndResolve(record.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to resolve audit discrepancy');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          Audit Lens
          {record.auditLensState === 'conflict' && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800">
              Conflict
            </span>
          )}
          {record.auditLensState === 'resolved' && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
              Resolved
            </span>
          )}
        </h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-200">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${record.id}-${record.auditLensState}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{record.title}</h3>
              <p className="text-sm text-gray-500">ID: {record.id}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-900 capitalize">{record.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Measurement</span>
                <span className="font-medium text-gray-900">{record.measurement}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Evidence</span>
                <span className="font-medium text-gray-900">{record.evidenceAttached ? 'Attached' : 'Missing'}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}

            {record.auditLensState === 'resolved' ? (
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-12 h-12 mb-3" />
                <p className="font-medium">Audit Discrepancy Resolved</p>
                <p className="text-sm text-gray-500 mt-1">Evidence attached and verified.</p>
              </div>
            ) : (
              <button
                onClick={handleAttachEvidence}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <FileUp className="w-5 h-5" />
                Attach Evidence & Resolve
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
