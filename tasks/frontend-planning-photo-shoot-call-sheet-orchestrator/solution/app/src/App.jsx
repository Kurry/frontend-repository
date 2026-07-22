import React, { useState } from 'react';
import ShotBoard from './components/ShotBoard';
import LocationMap from './components/LocationMap';
import Timeline from './components/Timeline';
import ResourcePanel from './components/ResourcePanel';
import RehearsalModal from './components/RehearsalModal';
import RehearsalTrigger from './components/RehearsalTrigger';
import ExportModal from './components/ExportModal';
import { useStore } from './store';

function App() {
  const activeDisruption = useStore(state => state.activeDisruption);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" role="application" aria-label="Photo Shoot Call-Sheet Orchestrator">
      <header className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Market at First Light — Call-Sheet Orchestrator</h1>
          <p className="text-sm text-gray-400">Creative Production Scheduler</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setShowExport(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded motion-safe:transition-colors">Export JSON</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded motion-safe:transition-colors">Import JSON</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left column: Shot Board */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 bg-white border-r border-gray-200 flex flex-col h-[40vh] lg:h-auto overflow-y-auto" aria-label="Shot requirement and coverage board">
          <ShotBoard />
        </aside>

        {/* Center column: Map & Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          <section className="flex-1 min-h-[40vh] bg-gray-100 p-4 relative overflow-hidden" aria-label="Location Diagram Placement">
            <LocationMap />
            <RehearsalTrigger />
          </section>

          <section className="h-64 xl:h-80 bg-white border-t border-gray-200 overflow-y-auto" aria-label="Timeline and resource lanes">
            <Timeline />
          </section>
        </div>

        {/* Right column: Resources, Releases, Handoffs */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 bg-white border-l border-gray-200 flex flex-col h-[40vh] lg:h-auto overflow-y-auto" aria-label="Resources, Releases, and Graph">
          <ResourcePanel />
        </aside>
      </main>

      {activeDisruption && <RehearsalModal />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

export default App;
