import React from 'react';
import { useStore } from '../store/index';

export const HistoryPanel: React.FC = () => {
  const events = useStore((state) => Object.values(state.events));

  return (
    <div className="p-4 overflow-y-auto h-full text-sm">
      <h3 className="font-semibold text-gray-700 mb-4 uppercase tracking-wider">Revision History</h3>
      {events.length === 0 ? (
        <div className="text-gray-500 italic">No history events yet.</div>
      ) : (
        <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-200">
          {events.map((evt) => (
            <li key={evt.id} className="relative pl-8">
              <div className="absolute left-1.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white" />
              <div className="bg-white border border-gray-200 rounded p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-gray-500">{evt.id}</span>
                  <span className="text-xs text-gray-400">{evt.logicalTime}</span>
                </div>
                <div className="mt-1 font-medium">{evt.type}</div>
                <div className="text-xs text-gray-600 mt-1">Actor: {evt.actorId}</div>
                {evt.type === 'edit' && (
                  <button className="mt-2 text-xs text-red-600 hover:underline">
                    Selectively Undo
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
