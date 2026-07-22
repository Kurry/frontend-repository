import React, { useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch } from './store';
import Ribbon from './components/Ribbon';
import OutcomeVariance from './components/OutcomeVariance';
import ProvenanceGraph from './components/ProvenanceGraph';
import Branches from './components/Branches';
import CapacityTerrain from './components/CapacityTerrain';
import ReviewClose from './components/ReviewClose';
import { setupWebMCP } from './webmcp';
import './index.css';

function MainApp() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    setupWebMCP(state, dispatch);
  }, [state, dispatch]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-gray-800 font-sans">
      <h1 className="text-3xl font-bold mb-6">Weekly Review Evidence Deck</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Ribbon />
          <OutcomeVariance />
          <Branches />
        </div>
        <div>
          <ProvenanceGraph />
          <CapacityTerrain />
          <ReviewClose />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
