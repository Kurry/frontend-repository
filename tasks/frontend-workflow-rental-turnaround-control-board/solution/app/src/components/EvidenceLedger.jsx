import React from 'react';
import { useStore } from '../store';

export const EvidenceLedger = () => {
  const observations = useStore(state => state.observations);
  const evidence = useStore(state => state.evidence);
  const activeEvidenceId = useStore(state => state.activeEvidenceId);
  const setActiveEvidence = useStore(state => state.setActiveEvidence);
  const tasks = useStore(state => state.tasks);

  return (
    <div className="mt-4 border p-4 bg-white rounded shadow-sm">
      <h3 className="font-bold mb-2">Findings & Evidence Ledger</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
        {observations.map(obs => {
          const ev = evidence.find(e => e.hash === obs.evidenceHash);
          const isActive = activeEvidenceId === obs.evidenceHash;
          const relatedTasks = tasks.filter(t => t.locus === obs.fixtureId);

          return (
            <div
              key={obs.id}
              className={`border p-2 rounded flex flex-col items-center cursor-pointer transition-colors ${isActive ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveEvidence(obs.evidenceHash)}
            >
              {ev && <img src={ev.thumbnail} alt={obs.note} className="w-16 h-16 object-cover mb-2 border border-gray-200" />}
              <div className="text-xs text-center font-semibold">{obs.note}</div>
              <div className="text-[10px] text-gray-500">{obs.severity} | {obs.fixtureId}</div>
              {relatedTasks.length > 0 && (
                <div className="mt-1 text-[10px] bg-green-100 text-green-800 px-1 rounded w-full text-center">
                  {relatedTasks.map(t => t.status).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
