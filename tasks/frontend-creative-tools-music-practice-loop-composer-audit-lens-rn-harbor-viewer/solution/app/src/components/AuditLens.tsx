import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShieldCheck, ShieldAlert, FileText, X, Check, Search, Undo2 } from 'lucide-react';

export const AuditLens: React.FC = () => {
  const { auditLens, records, attachEvidence, resolveConflict, undoLastMutation, selectRecordForAudit } = useStore();
  const [evidenceInput, setEvidenceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = records.find(r => r.id === auditLens.selectedRecordId);

  useEffect(() => {
    setEvidenceInput('');
    setError(null);
  }, [auditLens.selectedRecordId]);

  const handleAttach = () => {
    if (!evidenceInput.trim()) {
      setError('Evidence cannot be empty. Please provide context.');
      return;
    }
    if (selectedRecord) {
      attachEvidence(selectedRecord.id, evidenceInput);
      setEvidenceInput('');
      setError(null);
    }
  };

  const handleResolve = () => {
    if (selectedRecord) {
      resolveConflict(selectedRecord.id);
    }
  };

  if (!selectedRecord) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-l border-slate-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
          <Search className="text-slate-300" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">Audit Lens Idle</h3>
        <p className="text-slate-500 max-w-xs">
          Select a practice segment from the collection to view details, attach evidence, or resolve discrepancies.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 relative">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={18} className="text-slate-500" />
          Audit Lens
        </h3>
        <button
          onClick={() => selectRecordForAudit(null)}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Close Audit Lens"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Selected Target</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              auditLens.mode === 'conflict' ? 'bg-amber-100 text-amber-700' :
              auditLens.mode === 'resolved' ? 'bg-green-100 text-green-700' :
              auditLens.mode === 'changed' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              Mode: {auditLens.mode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{selectedRecord.title}</h2>
          <p className="text-slate-500">{selectedRecord.instrument} • {selectedRecord.bpm} BPM</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="block text-xs font-medium text-slate-500 mb-1">Domain Status</span>
              <span className="font-semibold text-slate-700 capitalize">{selectedRecord.status}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="block text-xs font-medium text-slate-500 mb-1">ID</span>
              <span className="font-mono text-xs text-slate-600 truncate">{selectedRecord.id.split('-')[0]}</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          {selectedRecord.auditConflict && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Audit Discrepancy Found</h4>
                  <p className="text-sm text-amber-700 mb-3">{selectedRecord.auditConflict}</p>
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    <Check size={16} />
                    Resolve Discrepancy
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedRecord.auditEvidence && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Evidence Attached</h4>
                  <p className="text-sm text-green-700">{selectedRecord.auditEvidence}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-3">Attach New Evidence</h4>
          <textarea
            value={evidenceInput}
            onChange={(e) => setEvidenceInput(e.target.value)}
            className="w-full h-24 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm mb-3 resize-none"
            placeholder="Paste source link, notes, or verification details..."
          />
          {error && <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>}
          <button
            onClick={handleAttach}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            Attach to Record
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
        <button
          onClick={undoLastMutation}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
          aria-label="Undo last action"
        >
          <Undo2 size={16} />
          Undo Last Change
        </button>
      </div>
    </div>
  );
};
