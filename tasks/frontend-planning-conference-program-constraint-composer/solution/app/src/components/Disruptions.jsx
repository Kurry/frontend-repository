import React from 'react';
import { useStore } from '../store.js';

export const DisruptionsPanel = () => {
  const { rehearsal, speakers } = useStore();
  const triggerRehearsal = () => {
    useStore.setState({ rehearsal: { type: 'cancellation', targetId: speakers[0].id, active: true } });
  };

  const clearRehearsal = () => {
    useStore.setState({ rehearsal: null });
  };

  return (
    <div className="p-4 border-t bg-amber-50">
      <h3 className="font-bold text-sm text-amber-900 mb-2">Disruption Rehearsal</h3>
      {!rehearsal ? (
        <button onClick={triggerRehearsal} className="w-full p-2 bg-amber-600 text-white rounded text-sm font-bold hover:bg-amber-700">
          Inject Cancellation
        </button>
      ) : (
        <div>
          <div className="text-sm text-amber-800 mb-2 font-semibold">
            Active: Speaker Cancellation ({rehearsal.targetId})
          </div>
          <button onClick={clearRehearsal} className="w-full p-2 bg-white border border-amber-600 text-amber-800 rounded text-sm hover:bg-amber-100">
            Clear Repair Branch
          </button>
        </div>
      )}
    </div>
  );
};
