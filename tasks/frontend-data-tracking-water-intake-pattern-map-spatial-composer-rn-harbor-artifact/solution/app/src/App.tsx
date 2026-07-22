import React, { useState, useSyncExternalStore } from 'react';
import { IntakeCollection } from './components/IntakeCollection';
import { SpatialComposer } from './components/SpatialComposer';
import { ArtifactTools } from './components/ArtifactTools';
import { store } from './store';
import { Droplets, Activity, Database } from 'lucide-react';
import './webmcp';

function App() {
  const state = useSyncExternalStore(store.subscribe.bind(store), () => store.state);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { derived } = state;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <div className="w-full md:w-80 flex flex-col h-1/2 md:h-full bg-white shadow-xl z-20 flex-shrink-0 relative">
        <div className="p-4 bg-slate-900 text-white flex items-center gap-3 shadow-md z-10">
          <Droplets className="w-6 h-6 text-blue-400" />
          <h1 className="font-semibold tracking-tight">Water Intake Map</h1>
        </div>

        <div className="flex-1 overflow-hidden">
          <IntakeCollection onSelect={setSelectedId} />
        </div>

        <div className="flex-none">
          <ArtifactTools />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-hidden relative">
        <div className="h-auto min-h-16 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center px-4 md:px-6 shadow-sm z-10 justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Volume</div>
                <div className="text-base md:text-lg font-light leading-none">{derived.totalAmount} <span className="text-xs md:text-sm text-slate-400 font-normal">ml</span></div>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Avg Capacity</span>
                <span className="font-medium text-slate-700">
                  {state.records.length > 0 ? Math.round(derived.totalCapacity / state.records.length) : 0}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Rebalanced</span>
                <span className="font-medium text-slate-700">{derived.capacityRebalanced ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-slate-100 rounded-full text-[10px] md:text-xs font-medium text-slate-600">
              <Database className="w-3 md:w-3.5 h-3 md:h-3.5" />
              {state.records.length} records
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <SpatialComposer selectedId={selectedId} />
        </div>
      </div>
    </div>
  );
}

export default App;
