import React, { useState, useEffect } from 'react';
import { useStore } from './useStore';
import { Undo, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';

export function AuditLens() {
  const { state, set, pushHistory, undo } = useStore();
  const [evidenceInput, setEvidenceInput] = useState('');

  const { auditLensState, records, derived } = state;
  const selectedRecord = records.find(r => r.id === auditLensState.selectedId);

  useEffect(() => {
     if (auditLensState.selectedId && !selectedRecord) {
         set(s => { s.auditLensState.selectedId = null; s.auditLensState.mode = 'idle'; });
     }
  }, [auditLensState.selectedId, selectedRecord, set]);

  const handleSelect = (id) => {
    set(s => {
      s.auditLensState.selectedId = id;
      const r = s.records.find(r => r.id === id);
      if (r && r.status === 'changed') s.auditLensState.mode = 'conflict';
      else if (r) s.auditLensState.mode = 'selected';
    });
    setEvidenceInput('');
  };

  const attachEvidenceAndResolve = () => {
    if (!selectedRecord || !evidenceInput.trim()) return;
    pushHistory(JSON.parse(JSON.stringify(state)));
    set(s => {
      const record = s.records.find(r => r.id === s.auditLensState.selectedId);
      if (record) { record.evidence = evidenceInput.trim(); record.status = 'ready'; s.auditLensState.mode = 'resolved'; }
    });
    setEvidenceInput('');
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-zinc-200 rounded-md bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            Audit Lens
            {auditLensState.mode === 'conflict' && <AlertTriangle size={16} className="text-amber-500" />}
            {auditLensState.mode === 'resolved' && <CheckCircle2 size={16} className="text-green-500" />}
        </h2>
        <button onClick={undo} disabled={state.history.length === 0} className="flex items-center gap-1 text-sm px-2 py-1 bg-zinc-100 rounded text-zinc-600 disabled:opacity-50 hover:bg-zinc-200"><Undo size={14} /> Undo</button>
      </div>
      <div className="flex flex-col gap-3">
          <div className="text-sm flex justify-between bg-zinc-50 p-2 rounded border border-zinc-100">
             <span>Derived Summary</span>
             <span className="font-medium">Total: {derived.summary.total} | Discrepancies: {derived.summary.discrepancies} | Resolved: {derived.summary.resolved}</span>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Select Record for Audit</label>
             <select className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900" value={auditLensState.selectedId || ''} onChange={e => handleSelect(e.target.value)}>
                 <option value="" disabled>-- Select a record --</option>
                 {records.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
             </select>
          </div>
          {selectedRecord && (
              <div className="flex flex-col gap-3 mt-2 border border-zinc-200 p-3 rounded bg-zinc-50">
                  <div className="flex justify-between text-sm"><span className="font-semibold">{selectedRecord.name}</span><span className="uppercase text-xs font-bold">{selectedRecord.status}</span></div>
                  {auditLensState.mode === 'conflict' ? (
                      <div className="flex flex-col gap-2">
                          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded border">Audit Discrepancy Detected.</p>
                          <div className="flex gap-2">
                              <input type="text" value={evidenceInput} onChange={e => setEvidenceInput(e.target.value)} placeholder="Evidence URL or Note" className="border rounded px-3 py-1 text-sm flex-1" />
                              <button onClick={attachEvidenceAndResolve} disabled={!evidenceInput.trim()} className="bg-zinc-900 text-white px-3 py-1 rounded text-sm disabled:opacity-50 flex items-center gap-1"><FileUp size={14} /> Attach & Resolve</button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-sm text-zinc-500">
                          {selectedRecord.evidence ? <div><span className="text-green-600 font-medium">Resolved with evidence:</span> {selectedRecord.evidence}</div> : <span>No audit discrepancies found.</span>}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
}
