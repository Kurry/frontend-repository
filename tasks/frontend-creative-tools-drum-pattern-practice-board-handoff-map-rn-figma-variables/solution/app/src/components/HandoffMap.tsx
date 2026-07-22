import React, { useState } from 'react';
import { DrumPattern } from '../store';
import { UserPlus, CheckCircle, Undo, AlertCircle } from 'lucide-react';

interface Props {
  selectedRecord: DrumPattern | null;
  onAssignAndReady: (owner: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const OWNERS = ['Alice (Lead)', 'Bob (Mixer)', 'Charlie (Arranger)'];

export function HandoffMap({ selectedRecord, onAssignAndReady, onUndo, canUndo }: Props) {
  const [error, setError] = useState<string | null>(null);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
        <UserPlus size={48} className="mb-4 opacity-50" />
        <p>Select a pattern to assign and mark ready.</p>
      </div>
    );
  }

  const handleAssign = (owner: string) => {
    if (selectedRecord.status === 'ready' && selectedRecord.owner === owner) {
      setError('Conflict: Already assigned to this owner and marked ready.');
      return;
    }
    setError(null);
    onAssignAndReady(owner);
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Handoff Map</h2>
          <p className="text-slate-500 text-sm">Assign patterns to team members to mark them ready.</p>
        </div>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${canUndo ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
          title="Undo last action (Ctrl+Z)"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 transition-all motion-reduce:transition-none duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{selectedRecord.name}</h3>
          <span className={`px-3 py-1 text-sm rounded-full capitalize font-medium ${
            selectedRecord.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            Status: {selectedRecord.status}
          </span>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OWNERS.map(owner => {
            const isCurrent = selectedRecord.owner === owner;
            return (
              <button
                key={owner}
                onClick={() => handleAssign(owner)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all motion-reduce:transition-none duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3 text-blue-500">
                    <CheckCircle size={20} />
                  </div>
                )}
                <div className="font-medium text-slate-800 mb-1">{owner}</div>
                <div className={`text-xs ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                  {isCurrent ? 'Current Owner' : 'Click to assign & mark ready'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
