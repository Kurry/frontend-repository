import React, { useState } from 'react';
import { useStore } from '../store';
import { useDroppable } from '@dnd-kit/core';

export default function ResourcePanel() {
  const personas = useStore(state => state.personas);
  const resources = useStore(state => state.resources);
  const releases = useStore(state => state.releases);
  const approveRelease = useStore(state => state.approveRelease);
  const staleRelease = useStore(state => state.staleRelease);
  const addHandoff = useStore(state => state.addHandoff);

  const [activeTab, setActiveTab] = useState('resources');

  // Un-schedule zone for removing shots from the timeline
  const { isOver: isUnscheduleOver, setNodeRef: setUnscheduleRef } = useDroppable({
    id: 'un-schedule-zone',
  });

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex bg-gray-100 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'resources' ? 'bg-white text-gray-900 border-t-2 border-t-gray-900' : 'text-gray-500 hover:bg-gray-200'}`}
          role="tab"
          aria-selected={activeTab === 'resources'}
        >
          Crew & Gear
        </button>
        <button
          onClick={() => setActiveTab('releases')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'releases' ? 'bg-white text-gray-900 border-t-2 border-t-gray-900' : 'text-gray-500 hover:bg-gray-200'}`}
          role="tab"
          aria-selected={activeTab === 'releases'}
        >
          Releases
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'resources' && (
          <>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Talent & Crew</h3>
              <ul className="space-y-2">
                {personas.map(p => (
                  <li key={p.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Gear & Wardrobe</h3>
              <ul className="space-y-2">
                {resources.slice(0, 8).map(r => ( // truncate for demo view
                  <li key={r.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-700">{r.name}</span>
                    <span className="text-xs text-gray-400 border border-gray-200 px-1 rounded uppercase">{r.type}</span>
                  </li>
                ))}
                <li className="text-xs text-gray-400 italic text-center pt-2">... {resources.length - 8} more items</li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={() => addHandoff({ from: 'p-5', to: 'p-3', item: 'r-7' })}
                className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded text-sm hover:bg-indigo-100 motion-safe:transition-colors focus:ring focus:ring-indigo-300"
              >
                + Log Handoff Event
              </button>
            </div>
          </>
        )}

        {activeTab === 'releases' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Document Gates</h3>
            {releases.map(rel => {
              const target = personas.find(p => p.id === rel.targetId);
              return (
                <div key={rel.id} className="border border-gray-200 rounded p-3 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">Model Release</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${rel.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rel.status}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs mb-3">Target: {target?.name || rel.targetId}</div>

                  <div className="flex gap-2">
                    {rel.status !== 'approved' && (
                      <button
                        onClick={() => approveRelease(rel.id)}
                        className="flex-1 bg-gray-900 text-white py-1 rounded text-xs hover:bg-gray-800 motion-safe:transition-colors focus:ring"
                      >
                        Approve
                      </button>
                    )}
                    {rel.status === 'approved' && (
                      <button
                        onClick={() => staleRelease(rel.id)}
                        className="flex-1 bg-white text-gray-600 border border-gray-300 py-1 rounded text-xs hover:bg-gray-50 motion-safe:transition-colors focus:ring"
                      >
                        Mark Stale
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Universal Drop Zone to unschedule/remove from map */}
      <div
        ref={setUnscheduleRef}
        className={`absolute bottom-0 w-full p-4 border-t-2 border-dashed motion-safe:transition-colors ${isUnscheduleOver ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-300'}`}
        role="region"
        aria-label="Drop zone to reset shot schedule and location"
      >
        <div className="text-center text-sm font-medium text-gray-500">
          Drop shot here to Un-schedule
        </div>
      </div>
    </div>
  );
}
