import { ScenarioCards } from './components/ScenarioCards';
import { RecoveryBoard } from './components/RecoveryBoard';
import { ArtifactControls } from './components/ArtifactControls';
import { useEffect } from 'react';
import { useStore } from './store';
import { LivePreview } from './components/LivePreview';

function App() {
  const undo = useStore((state) => state.undo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scenario Builder</h1>
          <p className="text-sm text-slate-500">Design Workspace</p>
        </div>
        <ArtifactControls />
      </header>

      {/* Main Workspace Layout */}
      <main className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

        {/* Desktop Primary Surface */}
        <div className="flex-1 flex flex-col gap-8 lg:max-w-[800px]">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <ScenarioCards />
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <RecoveryBoard />
          </section>
        </div>

        {/* Summary & Inspector (Mobile Preview) */}
        <aside className="lg:w-[350px] shrink-0 flex flex-col gap-6">
          <div className="sticky top-[100px]">
            <LivePreview />
          </div>
        </aside>

      </main>
    </div>
  );
}

export default App;
