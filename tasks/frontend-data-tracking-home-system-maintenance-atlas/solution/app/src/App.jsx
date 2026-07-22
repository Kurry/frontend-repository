import React, { useEffect, useState } from 'react';
import { Map } from './components/Map';
import { Timeline } from './components/Timeline';
import { Diagnostics } from './components/Diagnostics';
import { Planner } from './components/Planner';
import { WorkOrders } from './components/WorkOrders';
import { Dossier } from './components/Dossier';
import { useAppContext } from './store';
import { registerWebMCP } from './webmcp';

function App() {
  const { state, dispatch } = useAppContext();
  const [view, setView] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setView('mobile');
      } else {
        setView('desktop');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    registerWebMCP(state, dispatch);
  }, [state, dispatch]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-4 max-w-7xl mx-auto flex flex-col gap-4">
      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Home System Maintenance Atlas</h1>
          <p className="text-sm text-gray-500">Spatial ledger for fictional Juniper House</p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded">Assets: {state.assets.length}</div>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Readings: {state.readings.length}</div>
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded">Symptoms: {state.symptoms.length}</div>
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Work: {state.workOrders.length}</div>
        </div>
      </header>

      {view === 'desktop' ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Map />
            <div className="grid grid-cols-2 gap-4">
              <Timeline />
              <Planner />
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <Diagnostics />
            <WorkOrders />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Map />
          <Diagnostics />
          <Timeline />
          <Planner />
          <WorkOrders />
        </div>
      )}

      <Dossier />
    </div>
  );
}

export default App;
