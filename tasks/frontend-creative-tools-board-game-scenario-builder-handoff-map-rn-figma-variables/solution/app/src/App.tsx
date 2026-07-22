import { useEffect } from 'react';
import { useStore } from './store';
import { ExportImportBar } from './components/ExportImportBar';
import { ScenarioList } from './components/ScenarioList';
import { HandoffMap } from './components/HandoffMap';
import { ScenarioEditor } from './components/ScenarioEditor';

function App() {
  const { undo } = useStore();

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
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <ExportImportBar />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden relative">
        {/* Desktop: side-by-side. Mobile: stack them or use flex-col. */}

        {/* Left column: List */}
        <div className="flex-none w-full lg:w-80 h-1/3 lg:h-full shrink-0">
          <ScenarioList />
        </div>

        {/* Center column: Primary interaction map */}
        <div className="flex-1 h-1/3 lg:h-full min-h-[300px]">
          <HandoffMap />
        </div>

        {/* Right column: Inspector */}
        <div className="flex-none w-full lg:w-80 h-1/3 lg:h-full shrink-0">
          <ScenarioEditor />
        </div>
      </main>
    </div>
  );
}

export default App;
