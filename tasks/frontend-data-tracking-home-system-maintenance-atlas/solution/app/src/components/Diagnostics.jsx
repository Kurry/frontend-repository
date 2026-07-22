import React, { useState } from 'react';
import { useAppContext } from '../store';
import { GitBranch, CheckCircle, XCircle, Clock } from 'lucide-react';

export const Diagnostics = () => {
  const { state, dispatch } = useAppContext();
  const [newCause, setNewCause] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState(state.symptoms[0]?.id || '');

  const handleTestResult = (id, result) => {
    dispatch({ type: 'UPDATE_HYPOTHESIS', payload: { id, updates: { result } } });
  };

  const handleStatus = (id, status) => {
    dispatch({ type: 'UPDATE_HYPOTHESIS', payload: { id, updates: { status } } });
  };

  const addHypothesis = (e) => {
    e.preventDefault();
    if (!newCause || !selectedSymptom) return;
    dispatch({
      type: 'ADD_HYPOTHESIS',
      payload: { symptomId: selectedSymptom, cause: newCause, status: 'suspected', test: 'Pending test definition', result: null }
    });
    setNewCause('');
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-purple-600" /> Diagnostic Branches
      </h2>

      <form onSubmit={addHypothesis} className="flex gap-2 mb-4 bg-white p-3 border rounded shadow-sm">
        <select className="border rounded p-1 text-sm flex-1" value={selectedSymptom} onChange={e => setSelectedSymptom(e.target.value)}>
          {state.symptoms.map(s => <option key={s.id} value={s.id}>{s.type} ({state.assets.find(a=>a.id===s.assetId)?.name})</option>)}
        </select>
        <input className="border rounded p-1 text-sm flex-2 w-full" placeholder="Possible cause..." value={newCause} onChange={e => setNewCause(e.target.value)} />
        <button type="submit" className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 whitespace-nowrap font-medium">Add Branch</button>
      </form>

      <div className="grid gap-3">
        {state.hypotheses.map(h => {
          const symptom = state.symptoms.find(s => s.id === h.symptomId);
          const assetName = state.assets.find(a => a.id === symptom?.assetId)?.name;

          return (
            <div key={h.id} className={`p-3 border rounded shadow-sm bg-white relative overflow-hidden transition-colors
              ${h.status === 'confirmed' ? 'border-green-400' : ''}
              ${h.status === 'rejected' ? 'border-red-200 opacity-60' : ''}
              ${h.status === 'stale' ? 'border-orange-400 bg-orange-50' : ''}
            `}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">
                    {assetName} - {symptom?.type}
                  </div>
                  <div className="font-medium text-gray-800">{h.cause}</div>
                </div>
                <select
                  className="text-xs border rounded p-1 bg-gray-50"
                  value={h.status}
                  onChange={e => handleStatus(h.id, e.target.value)}
                >
                  <option value="suspected">Suspected</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="stale">Stale</option>
                </select>
              </div>

              <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100 flex justify-between items-center">
                <span className="text-gray-600 font-medium">{h.test}</span>
                <div className="flex gap-2">
                  <button
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${h.result === 'Pass' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => handleTestResult(h.id, 'Pass')}
                  >
                    <CheckCircle size={12} /> Pass
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${h.result === 'Fail' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => handleTestResult(h.id, 'Fail')}
                  >
                    <XCircle size={12} /> Fail
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
