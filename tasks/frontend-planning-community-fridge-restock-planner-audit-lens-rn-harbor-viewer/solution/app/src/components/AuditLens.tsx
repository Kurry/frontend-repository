import { useState } from 'react';
import { useRestockState } from '../hooks/useRestockState';
import { ArrowLeft, Check, AlertCircle, Undo2, Link2 } from 'lucide-react';
import { clsx } from 'clsx';

export function AuditLens() {
  const { state, setAuditRecordId, resolveAuditDiscrepancy, undoLastAction } = useRestockState();
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const record = state.records.find(r => r.id === state.currentAuditRecordId);

  if (!record) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted border-l p-8 h-full">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p>Select a task to view in Audit Lens</p>
      </div>
    );
  }

  const isResolved = record.auditLensState?.status === 'RESOLVED';
  const isConflict = record.auditLensState?.status === 'CONFLICT';

  const handleResolve = () => {
    if (!evidenceUrl.trim()) {
      setError('Evidence URL is required to resolve discrepancy.');
      return;
    }
    setError('');
    resolveAuditDiscrepancy(record.id, evidenceUrl, notes);
  };

  return (
    <div className="flex-1 flex flex-col border-l bg-white h-full relative">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuditRecordId(null)}
            className="p-1 hover:bg-gray-200 rounded text-muted"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="font-bold">Audit Lens</h2>
        </div>
        {state.history.length > 0 && (
          <button
            onClick={undoLastAction}
            className="text-xs flex items-center gap-1 text-muted hover:text-foreground"
            title="Undo last action"
          >
            <Undo2 size={14} /> Undo
          </button>
        )}
      </div>

      <div className="p-6 flex-1 overflow-auto flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold mb-1">{record.title}</h3>
          <p className="text-muted text-sm">{record.location} • Status: <span className="font-semibold">{record.status}</span></p>
        </div>

        <div className={clsx(
          "p-4 rounded border transition-all duration-300",
          isResolved ? "bg-green-50 border-green-200" : isConflict ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isResolved ? <Check className="text-success" /> : <AlertCircle className={isConflict ? "text-error" : "text-primary"} />}
            <h4 className="font-bold">
              {isResolved ? 'Audit Resolved' : 'Audit Discrepancy'}
            </h4>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            {isResolved
              ? 'Evidence has been attached and the record is synchronized.'
              : 'Attach evidence to this record to resolve the audit discrepancy.'}
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">Evidence URL (Required)</label>
              <div className="flex relative">
                <Link2 size={14} className="absolute left-2 top-2.5 text-muted" />
                <input
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="border rounded p-2 pl-7 text-sm w-full bg-white"
                  disabled={isResolved}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Resolution notes..."
                className="border rounded p-2 text-sm w-full bg-white min-h-[80px]"
                disabled={isResolved}
              />
            </div>

            {error && <div className="text-xs text-error">{error}</div>}

            {!isResolved && (
              <button
                onClick={handleResolve}
                className="bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                Attach Evidence & Resolve
              </button>
            )}

            {isResolved && record.auditLensState && (
              <div className="mt-4 pt-4 border-t text-xs text-muted flex flex-col gap-1">
                <div>Attached Evidence: <a href={record.auditLensState.evidenceUrl} className="text-primary hover:underline">{record.auditLensState.evidenceUrl}</a></div>
                {record.auditLensState.notes && <div>Notes: {record.auditLensState.notes}</div>}
                <div>Resolved At: {new Date(record.auditLensState.resolvedAt!).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-xs text-muted">
        <div>Derived Summary:</div>
        <div className="font-semibold">
          {state.derived.resolvedCount} Resolved / {state.derived.totalCount} Total
        </div>
      </div>
    </div>
  );
}
