import { useEffect } from 'react';
import { StoreProvider } from './Store';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { Sidebar } from './components/Sidebar';
import { Plane } from 'lucide-react';

function AppContent() {
  // Global keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const undoBtn = document.querySelector('button:has(svg.lucide-undo)') as HTMLButtonElement;
        if (undoBtn) undoBtn.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
      <header className="h-16 border-b flex items-center px-6 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Plane className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Layover Planner</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative h-full flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">Constraint Canvas</h2>
            <p className="text-sm text-gray-500">Drag a selected record across constraint lanes and resolve a conflict.</p>
          </div>
          <div className="flex-1 overflow-hidden relative min-h-[300px]">
            <ConstraintCanvas />
          </div>
        </div>

        <div className="h-auto md:h-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l relative bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10 overflow-y-auto">
          <Sidebar />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
