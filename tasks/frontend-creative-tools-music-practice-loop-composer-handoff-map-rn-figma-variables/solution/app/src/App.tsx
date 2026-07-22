import React, { useEffect } from 'react';
import { PracticeSegmentList } from './components/PracticeSegmentList';
import { HandoffMap } from './components/HandoffMap';
import { DerivedSummary } from './components/DerivedSummary';
import { ArtifactManager } from './components/ArtifactManager';
import { useAppStore } from './store';

function App() {
  const undo = useAppStore(state => state.undo);

  // Global Keyboard Shortcuts (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden text-slate-900 font-sans">
      <ArtifactManager />
      <DerivedSummary />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Collection */}
        <div className="w-full md:w-80 shrink-0 h-1/3 md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-slate-300">
          <PracticeSegmentList />
        </div>

        {/* Main Workspace (Handoff Map) */}
        <div className="flex-1 h-2/3 md:h-full overflow-hidden flex flex-col">
          <HandoffMap />
        </div>
      </div>
    </div>
  );
}

export default App;
