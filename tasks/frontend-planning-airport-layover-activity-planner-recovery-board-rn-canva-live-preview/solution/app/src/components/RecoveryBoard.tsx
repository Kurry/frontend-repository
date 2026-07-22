import { useState, useEffect } from 'react';
import { useStore } from '../store';

export function RecoveryBoard() {
  const { records, selectedId, applyRecoveryMutation } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);

  const [recoveryPathId, setRecoveryPathId] = useState('');
  const [downstreamImpact, setDownstreamImpact] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setRecoveryPathId('');
    setDownstreamImpact('');
    setError('');
  }, [selectedId]);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 border-dashed text-gray-400">
        <p>Select a record to inspect</p>
      </div>
    );
  }

  const isFailed = selectedRecord.status === 'failed';
  const isResolved = selectedRecord.status === 'resolved';

  const handleApply = () => {
    if (!recoveryPathId.trim()) {
      setError('Recovery Path ID is required');
      return;
    }
    if (!downstreamImpact.trim()) {
      setError('Downstream Impact resolution notes are required');
      return;
    }

    setError('');
    applyRecoveryMutation(selectedRecord.id, recoveryPathId, downstreamImpact);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Recovery Board</h2>
        <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${
          isFailed ? 'bg-red-100 text-red-800 border-red-200' :
          isResolved ? 'bg-blue-100 text-blue-800 border-blue-200' :
          'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          State: {isFailed ? 'conflict' : isResolved ? 'resolved' : 'idle'}
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedRecord.title}</h3>
          <p className="text-sm text-gray-500">ID: {selectedRecord.id}</p>
        </div>

        {isFailed ? (
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h4 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
                ⚠️ Conflict Detected
              </h4>
              <p className="text-sm text-red-700">
                Current Impact: {selectedRecord.downstreamImpact || 'Unknown'}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Resolution Path</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Recovery Path ID
                </label>
                <input
                  type="text"
                  value={recoveryPathId}
                  onChange={e => {
                    setRecoveryPathId(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., ALT-FLIGHT-992"
                  className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${error && !recoveryPathId.trim() ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repaired Downstream Impact
                </label>
                <textarea
                  value={downstreamImpact}
                  onChange={e => {
                    setDownstreamImpact(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Describe how the impact is resolved..."
                  rows={3}
                  className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${error && !downstreamImpact.trim() ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                onClick={handleApply}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Apply Recovery Mutation
              </button>
            </div>
          </div>
        ) : isResolved ? (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
             <div className="text-4xl mb-3">✅</div>
             <h4 className="text-blue-900 font-bold mb-2">Record Recovered</h4>
             <p className="text-sm text-blue-800 mb-4 text-left bg-white p-3 rounded shadow-sm border border-blue-100">
               <strong>Path:</strong> {selectedRecord.recoveryPathId} <br/>
               <strong>Impact:</strong> {selectedRecord.downstreamImpact}
             </p>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-gray-500">
             This record is in <strong>{selectedRecord.status}</strong> state. No recovery action needed.
          </div>
        )}
      </div>
    </div>
  );
}
