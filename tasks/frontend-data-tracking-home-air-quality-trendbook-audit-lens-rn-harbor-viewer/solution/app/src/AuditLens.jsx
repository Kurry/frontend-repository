import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AuditLens({ record, onMutate }) {
  const [evidence, setEvidence] = useState(record.evidence || "");
  const [status, setStatus] = useState(record.status);

  useEffect(() => {
    setEvidence(record.evidence || "");
    setStatus(record.status);
  }, [record.id, record.evidence, record.status]);

  const handleResolve = () => {
    if (!evidence.trim()) {
      alert("Evidence is required to resolve discrepancy");
      return;
    }
    onMutate({
      ...record,
      evidence,
      status: "ready",
      audit_discrepancy: "",
      auditLensState: "resolved"
    });
  };

  const isConflict = record.audit_discrepancy !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{record.location} <span className="text-sm font-normal text-slate-500">({record.date})</span></h3>
          <p className="text-3xl font-light mt-1">{record.value} <span className="text-sm text-slate-400">AQI</span></p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
           isConflict ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {isConflict ? 'Conflict' : 'Clear'}
        </div>
      </div>

      {isConflict && (
        <div className="bg-red-50 p-4 rounded border border-red-100 mt-2">
          <p className="text-red-800 text-sm mb-3"><span className="font-semibold">Discrepancy:</span> {record.audit_discrepancy}</p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-700">Attach Evidence</label>
            <input
              type="text"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              placeholder="e.g. valid_sensor_log.txt"
              className="border border-slate-300 rounded px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="mt-4 flex gap-2">
             <button
               onClick={handleResolve}
               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
             >
               Resolve Discrepancy
             </button>
          </div>
        </div>
      )}

      {!isConflict && (
        <div className="bg-slate-50 p-4 rounded border border-slate-100 mt-2 text-sm text-slate-600">
          <p>No active discrepancies. Record is locked and ready.</p>
          {record.evidence && <p className="mt-2 text-xs font-mono bg-slate-200 p-1 inline-block rounded">Evidence: {record.evidence}</p>}
        </div>
      )}
    </div>
  );
}
