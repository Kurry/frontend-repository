import { useState, useEffect } from 'react';
import { useStore } from './store';
import { ShieldCheck, ShieldAlert, Paperclip, Check, FileCheck2 } from 'lucide-react';

export function AuditLens() {
  const { state, resolveAudit } = useStore();
  const selectedRecordId = state.auditLensState.selectedRecordId;
  const record = state.records.find(r => r.id === selectedRecordId);

  const [evidenceAttached, setEvidenceAttached] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState('ready');

  useEffect(() => {
    if (record) {
      setEvidenceAttached(record.evidenceAttached || false);
      setResolutionStatus(record.status || 'ready');
    }
  }, [record]);

  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center p-8 text-center text-gray-500">
        <div>
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Select a service record from the list to view its audit lens.</p>
        </div>
      </div>
    );
  }

  const handleResolve = () => {
    resolveAudit({
      id: record.id,
      evidence: evidenceAttached,
      status: resolutionStatus
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className={`p-4 border-b rounded-t-lg text-white ${record.auditDiscrepancy ? 'bg-red-600' : 'bg-primary-600'}`}>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {record.auditDiscrepancy ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          Audit Lens: {record.title}
        </h2>
        {record.auditDiscrepancy && (
          <p className="text-sm text-red-100 mt-1">
            This record has an audit discrepancy and requires evidence resolution.
          </p>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-gray-500 mb-1">Service Date</span>
            <span className="font-medium">{record.date}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Mileage</span>
            <span className="font-medium">{record.mileage} miles</span>
          </div>
        </div>

        {record.notes && (
          <div>
            <span className="block text-gray-500 mb-1 text-sm">Notes</span>
            <p className="bg-gray-50 p-3 rounded text-sm border border-gray-200">
              {record.notes}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-gray-500" />
            Resolve Discrepancy
          </h3>

          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              checked={evidenceAttached}
              onChange={(e) => setEvidenceAttached(e.target.checked)}
            />
            <span className="flex items-center gap-2 text-sm font-medium">
              <Paperclip className="w-4 h-4 text-gray-400" />
              Attach Verification Evidence
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Domain Status
            </label>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button
            className={`w-full py-2 px-4 rounded-lg font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors ${
              !evidenceAttached && record.auditDiscrepancy
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            }`}
            onClick={handleResolve}
            disabled={!evidenceAttached && record.auditDiscrepancy}
          >
            <Check className="w-5 h-5" />
            Resolve & Update State
          </button>
        </div>
      </div>
    </div>
  );
}
