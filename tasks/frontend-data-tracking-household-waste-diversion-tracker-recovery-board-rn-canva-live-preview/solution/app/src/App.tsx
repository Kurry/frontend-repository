import React, { useEffect } from 'react';
import WasteEventsList from './WasteEventsList';
import RecoveryBoard from './RecoveryBoard';
import ArtifactTransfer from './ArtifactTransfer';
import { setupWebMCP } from './webmcp';

export default function App() {
  useEffect(() => {
    // Initialize WebMCP tools
    setupWebMCP();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Household Waste Diversion Tracker</h1>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Recovery Board Workspace
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6 h-[calc(100vh-73px)]">
        {/* Main Workspace (Desktop Primary Surface) */}
        <div className="flex-1 md:w-1/2 flex flex-col h-full gap-6">
          <div className="flex-1 min-h-0">
            <WasteEventsList />
          </div>
        </div>

        {/* Detail Panel and Artifacts */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <div className="h-[400px] shrink-0">
            <RecoveryBoard />
          </div>
          <div>
            <ArtifactTransfer />
          </div>
        </div>
      </main>
    </div>
  );
}
