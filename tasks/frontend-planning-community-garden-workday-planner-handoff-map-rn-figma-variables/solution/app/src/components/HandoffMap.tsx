import React, { useState } from 'react';
import type { WorkTask } from '../types';
import { UserPlus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export const HandoffMap: React.FC<{
  selectedTask: WorkTask | null;
  assignHandoff: (id: string, owner: string) => void;
  undo: () => void;
  canUndo: boolean;
}> = ({ selectedTask, assignHandoff, undo, canUndo }) => {
  const [ownerInput, setOwnerInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAssign = () => {
    if (!selectedTask) return;
    if (!ownerInput.trim()) {
      setError('Owner name is required');
      return;
    }
    setError(null);
    assignHandoff(selectedTask.id, ownerInput.trim());
    setOwnerInput('');
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Handoff Map</h2>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded border border-gray-300 shadow-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Undo Last Mutation
        </button>
      </div>

      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center relative bg-white shadow-inner">
        {selectedTask ? (
          <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg border border-green-200 transform transition-all duration-300 ease-in-out">
             <div className="flex items-center gap-3 mb-4">
                <div className={clsx(
                  "p-3 rounded-full",
                  selectedTask.status === 'ready' ? "bg-green-100 text-green-600" :
                  selectedTask.status === 'changed' ? "bg-blue-100 text-blue-600" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {selectedTask.status === 'ready' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTask.title}</h3>
                  <p className="text-sm text-gray-500">Current Status: <span className="font-semibold">{selectedTask.status}</span></p>
                </div>
             </div>

             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Handoff Owner</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ownerInput}
                      onChange={(e) => setOwnerInput(e.target.value)}
                      placeholder="Enter owner name..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAssign(); }}
                    />
                    <button
                      onClick={handleAssign}
                      className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2"
                    >
                      <UserPlus size={18} />
                      Assign
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
               </div>

               {selectedTask.handoffOwner && (
                 <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800 flex justify-between items-center">
                    <span>Assigned to: <strong className="font-bold">{selectedTask.handoffOwner}</strong></span>
                    <span className="text-xs px-2 py-1 bg-blue-200 rounded-full font-medium tracking-wide">Readiness Updated</span>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a task from the collection to assign handoff</p>
            <p className="text-sm mt-2">The signature mutation will update readiness automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};
