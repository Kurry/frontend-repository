import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Floorplan } from './components/Floorplan';
import { FindingsLedger } from './components/FindingsLedger';
import { Timeline } from './components/Timeline';
import { useStore } from './store/useStore';
import { setupWebMCP } from './utils/webmcp';

function App() {
  const advanceClock = useStore((state) => state.advanceClock);
  const selectedFixtures = useStore((state) => state.selectedFixtures);
  const branchScope = useStore((state) => state.branchScope);
  const markApprovalsStale = useStore((state) => state.markApprovalsStale);

  const [showBranchModal, setShowBranchModal] = useState(false);

  useEffect(() => {
    setupWebMCP();
  }, []);

  const handleBranchScope = () => {
    selectedFixtures.forEach(id => {
      branchScope(id, 'repair');
      markApprovalsStale(id);
    });
    setShowBranchModal(false);
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto relative">
        <header className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Unit 402 Turnaround</h1>
            <p className="text-sm text-muted-foreground mt-1">Spatial inspection and handoff workflow</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBranchModal(true)}
              disabled={selectedFixtures.length === 0}
              className="px-4 py-2 border border-border bg-card rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Branch Scope
            </button>
            <button
              onClick={advanceClock}
              className="px-4 py-2 border border-border bg-card rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Advance Clock
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          <div className="lg:col-span-2">
            <Floorplan />
          </div>
          <div>
            <FindingsLedger />
          </div>
        </div>

        <div className="flex-1 min-h-[300px]">
          <Timeline />
        </div>

        {showBranchModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg border border-border shadow-lg max-w-md w-full">
              <h3 className="font-bold text-lg mb-4">Branch Scope Decisions</h3>
              <p className="text-sm text-muted-foreground mb-6">Create scope branches for {selectedFixtures.length} selected fixtures and mark previous approvals stale.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowBranchModal(false)} className="px-4 py-2 border border-border rounded text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleBranchScope} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">Apply Branch</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
