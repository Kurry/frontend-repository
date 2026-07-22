import React, { useState } from 'react';
import { UserPlus, CheckCircle, Undo2, AlertCircle } from 'lucide-react';

export default function HandoffMap({ selectedRecord, onHandoffUpdate, onUndo, canUndo }) {
  const [handoffForm, setHandoffForm] = useState({ owner: '', readiness: 'idle' });
  const [error, setError] = useState(null);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <UserPlus size={48} className="mb-4 text-gray-300" />
        <p>Select a photo sequence to map handoff.</p>
      </div>
    );
  }

  const handleConnect = () => {
    if (!handoffForm.owner.trim()) {
      setError('Owner must be specified to map handoff.');
      return;
    }

    if (selectedRecord.status === 'archived') {
      setError('Cannot map handoff for archived records.');
      return;
    }

    setError(null);
    onHandoffUpdate(selectedRecord.id, {
      owner: handoffForm.owner,
      status: handoffForm.readiness === 'resolved' ? 'ready' : 'changed',
      handoffState: handoffForm.readiness
    });
    setHandoffForm({ owner: '', readiness: 'idle' });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{selectedRecord.title}</h2>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              selectedRecord.status === 'ready' ? 'bg-green-500' :
              selectedRecord.status === 'changed' ? 'bg-yellow-500' :
              selectedRecord.status === 'archived' ? 'bg-gray-400' : 'bg-blue-500'
            }`}></span>
            Current Status: {selectedRecord.status}
          </p>
        </div>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            canUndo ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50' : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
          title="Undo last mutation"
        >
          <Undo2 size={16} className="mr-2" />
          Undo
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Map Handoff Owner</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Owner)</label>
                <input
                  type="text"
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                  placeholder="e.g., Jane Doe"
                  value={handoffForm.owner}
                  onChange={e => setHandoffForm({...handoffForm, owner: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Readiness State</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-500"
                      name="readiness"
                      value="changed"
                      checked={handoffForm.readiness === 'changed'}
                      onChange={() => setHandoffForm({...handoffForm, readiness: 'changed'})}
                    />
                    <span className="ml-2 text-sm text-gray-700">Needs Review (Changes Status to 'changed')</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-500"
                      name="readiness"
                      value="resolved"
                      checked={handoffForm.readiness === 'resolved'}
                      onChange={() => setHandoffForm({...handoffForm, readiness: 'resolved'})}
                    />
                    <span className="ml-2 text-sm text-gray-700">Ready for Prod (Changes Status to 'ready')</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md">
                  <AlertCircle size={16} className="mr-2 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleConnect}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Connect Record & Update Readiness
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Derived Decision Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase">Current Owner</p>
                <p className="font-medium text-gray-900 mt-1">{selectedRecord.owner || 'Unassigned'}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase">Handoff Map State</p>
                <p className="font-medium text-gray-900 mt-1 capitalize">{selectedRecord.handoffState || 'idle'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
