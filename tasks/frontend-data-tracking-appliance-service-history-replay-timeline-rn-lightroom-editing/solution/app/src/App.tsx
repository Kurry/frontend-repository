import React, { useEffect } from 'react';
import MainSurface from './components/MainSurface';
import SummaryPanel from './components/SummaryPanel';
import ReplayTimeline from './components/ReplayTimeline';
import ArtifactTools from './components/ArtifactTools';
import { useStore } from './store';
import { Undo2 } from 'lucide-react';

function App() {
  const { undoLastAction, history, derived } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undoLastAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Appliance Service History</h1>
          <p className="text-sm text-slate-500">Manage and replay service records</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={undoLastAction}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo last action (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <div className="w-px h-6 bg-slate-300"></div>
          <ArtifactTools />
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row p-4 gap-4">
        {/* Left Column: List/Grid */}
        <section className="flex-1 min-w-[300px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden">
           <MainSurface />
        </section>

        {/* Right Column: Timeline & Details */}
        <aside className="w-full lg:w-[450px] shrink-0 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0">
            <SummaryPanel />
          </div>

          {derived.activeSelectionId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col min-h-[400px]">
              <ReplayTimeline />
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
