import React from 'react';
import { useStore } from '../store';
import { CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';

export default function Settlement() {
  const attempts = useStore(s => s.attempts);
  const recordAttempt = useStore(s => s.recordAttempt);

  // Dummy deterministic batch simulation for the PRD spec
  const runSimulatedBatch = () => {
    if (attempts.length > 0) return;

    // deterministically record two successes, one partial, and one failure
    recordAttempt({ id: 'att_1', type: 'success', amount: 1500, description: 'Alice to Bob', date: new Date().toISOString() });
    recordAttempt({ id: 'att_2', type: 'success', amount: 2000, description: 'Charlie to Bob', date: new Date().toISOString() });
    recordAttempt({ id: 'att_3', type: 'partial', amount: 500, targetAmount: 1200, description: 'Diana to Alice', date: new Date().toISOString() });
    recordAttempt({ id: 'att_4', type: 'failure', amount: 0, targetAmount: 850, description: 'Charlie to Diana', date: new Date().toISOString() });
  };

  const retryFailed = () => {
    recordAttempt({ id: `att_${Date.now()}`, type: 'success', amount: 850, description: 'Charlie to Diana (Retry)', date: new Date().toISOString() });
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Simulated Settlement Batch</h2>
          <p className="text-gray-500">Run partial payment workflows</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={runSimulatedBatch}
            disabled={attempts.length > 0}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            Trigger First Batch
          </button>
          <button
            onClick={retryFailed}
            disabled={attempts.filter(a => a.type === 'failure').length === 0}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
          >
            Retry Failed/Remaining
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-700">Append-only Attempts Log</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {attempts.length === 0 ? (
             <div className="p-8 text-center text-gray-500">No settlement attempts recorded.</div>
          ) : (
            attempts.map(att => (
              <div key={att.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  {att.type === 'success' && <CheckCircle2 className="text-green-500 mr-4" size={24} />}
                  {att.type === 'partial' && <CircleDashed className="text-amber-500 mr-4" size={24} />}
                  {att.type === 'failure' && <AlertCircle className="text-red-500 mr-4" size={24} />}

                  <div>
                    <div className="font-medium text-gray-900">{att.description}</div>
                    <div className="text-sm text-gray-500">{new Date(att.date).toLocaleString()} &bull; <span className="uppercase text-xs">{att.type}</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg ${att.type === 'failure' ? 'text-gray-400' : 'text-gray-900'}`}>
                    ${(att.amount / 100).toFixed(2)}
                  </div>
                  {att.targetAmount && (
                    <div className="text-xs text-gray-500">of ${(att.targetAmount / 100).toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
