import React, { useEffect } from 'react';
import { Floorplan } from './components/Floorplan';
import { Timeline } from './components/Timeline';
import { EvidenceLedger } from './components/EvidenceLedger';
import { ResourceCustody } from './components/ResourceCustody';
import { ActionPanel } from './components/ActionPanel';
import { HandoffExport } from './components/HandoffExport';
import { setupWebMCP } from './webmcp';
import './App.css'; // or just tailwind

function App() {
  useEffect(() => {
    setupWebMCP();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Rental Turnaround Control Board</h1>
        <p className="text-sm text-gray-600">Coordinate unit inspection, scheduling, and handoff.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Floorplan />
          <Timeline />
        </div>
        <div className="space-y-6">
          <EvidenceLedger />
          <ResourceCustody />
          <ActionPanel />
          <HandoffExport />
        </div>
      </div>
    </div>
  );
}

export default App;
