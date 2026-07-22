import React, { useState } from 'react';
import type { LessonBlock } from './types';

interface AuditLensProps {
  record: LessonBlock | null;
  onAttachEvidence: (id: string, evidenceId: string) => void;
  onClose: () => void;
}

export const AuditLens: React.FC<AuditLensProps> = ({ record, onAttachEvidence, onClose }) => {
  const [evidenceId, setEvidenceId] = useState('');

  if (!record) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
        <p>Select a record to audit.</p>
      </div>
    );
  }

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceId.trim()) return;
    onAttachEvidence(record.id, evidenceId);
    setEvidenceId('');
  };

  return (
    <div className="p-6 bg-white border border-blue-200 rounded-lg shadow-md ring-1 ring-blue-50">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Audit Lens</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Close audit lens"
        >
          &times;
        </button>
      </div>

      <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded">
        <div className="font-medium text-slate-800 mb-1">{record.title}</div>
        <div className="text-sm text-slate-500 mb-3">Status: {record.status} • Audit: {record.auditState}</div>

        {record.auditState === 'resolved' ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-sm">
            ✓ Discrepancy resolved. Evidence attached: <span className="font-mono">{record.evidenceId}</span>
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            {record.auditState === 'conflict'
              ? "A discrepancy was detected. Attach evidence to resolve it."
              : "Review this record and attach evidence if needed."}
          </div>
        )}
      </div>

      <form onSubmit={handleResolve} className="flex flex-col gap-3">
        <label htmlFor="evidenceInput" className="text-sm font-medium text-slate-700">
          Attach Evidence (ID or URL)
        </label>
        <div className="flex gap-2">
          <input
            id="evidenceInput"
            value={evidenceId}
            onChange={(e) => setEvidenceId(e.target.value)}
            disabled={record.auditState === 'resolved'}
            placeholder="e.g. DOC-12345"
            className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            required
          />
          <button
            type="submit"
            disabled={record.auditState === 'resolved' || !evidenceId.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Resolve Discrepancy
          </button>
        </div>
      </form>
    </div>
  );
};
