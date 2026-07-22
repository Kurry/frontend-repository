import React, { useState } from 'react';
import { useAppStore } from './store';
import { ShieldAlert, GitCommit, FileWarning } from 'lucide-react';

export const ProvenanceAtlas = ({ selectedId }) => {
  const { data, quarantineInvoice } = useAppStore();
  const [reason, setReason] = useState('');

  const record = data.records.find(r => r.id === selectedId);

  if (!record) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50">
        <GitCommit size={48} className="mb-4 text-gray-300" />
        <p>Select a record to inspect its lineage.</p>
      </div>
    );
  }

  const handleQuarantine = () => {
    if (!reason.trim()) {
      alert("Quarantine reason is required to reject a bad lineage without partial updates.");
      return;
    }
    quarantineInvoice(record.id, reason);
    setReason('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-white relative">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <GitCommit className="text-blue-600" />
        Provenance Atlas
      </h2>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50 transition-all duration-300">
          <div className="text-sm text-gray-500 uppercase font-semibold mb-2">Record Selection</div>
          <div className="text-lg font-medium">{record.client} <span className="text-gray-400">#{record.id}</span></div>
          <div className="text-sm mt-1">Status: <span className="font-semibold">{record.status}</span></div>
          <div className="text-sm mt-1">Lineage state: <span className={`font-semibold ${record.lineage === 'quarantined' ? 'text-red-600' : 'text-green-600'}`}>{record.lineage}</span></div>
        </div>

        <div className="pl-4 border-l-2 border-blue-200 space-y-4">
          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <div className="text-sm font-medium">Source Evidence</div>
            <div className="text-sm text-gray-600 mt-1 p-3 bg-white border border-gray-200 rounded">
              {record.sourceEvidence ? (
                <span className="flex items-center gap-2 text-yellow-700">
                  <FileWarning size={16} />
                  {record.sourceEvidence}
                </span>
              ) : (
                <span className="text-gray-400 italic">No conflicting evidence found in lineage.</span>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <div className="text-sm font-medium">Lineage Decision</div>

            {record.lineage === 'quarantined' ? (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-red-800 text-sm">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Quarantined</div>
                  <div>Reason: {record.quarantineReason}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4 bg-white border border-gray-200 rounded shadow-sm">
                <p className="text-sm text-gray-600 mb-3">Trace this record to its source evidence. If a bad lineage is found, quarantine it to prevent downstream effects.</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Enter quarantine reason..."
                    className="border border-gray-300 rounded p-2 text-sm w-full"
                    aria-label="Quarantine reason"
                  />
                  <button
                    onClick={handleQuarantine}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={16} />
                    Quarantine Lineage
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
