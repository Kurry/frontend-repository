import { useEffect } from 'react';
import { PracticeSegments } from './components/PracticeSegments';
import { AuditLens } from './components/AuditLens';
import { ArtifactManager } from './components/ArtifactManager';
import { useStore } from './store';

function App() {
  const { undoLastMutation } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastMutation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastMutation]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md z-10">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold tracking-tight">Music Practice Loop Composer</h1>
          <p className="text-slate-400 text-sm">H-Viewer Workspace</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-160px)]">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">
          <PracticeSegments />
        </div>

        <div className="w-full md:w-96 shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <AuditLens />
        </div>
      </main>

      <footer className="container mx-auto p-4 shrink-0">
        <ArtifactManager />
      </footer>
    </div>
  );
}

export default App;
