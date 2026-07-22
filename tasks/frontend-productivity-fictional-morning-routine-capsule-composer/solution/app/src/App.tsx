import { useStore } from './store';
import { StructureCanvas } from './components/StructureCanvas';
import { FocusRail } from './components/FocusRail';
import { RepairModal } from './components/RepairModal';
import { Toolbar } from './components/Toolbar';
import { useEffect } from 'react';

function App() {
  const { sessionState, history, undoActorAction, redoActorAction } = useStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoActorAction();
        else undoActorAction();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [undoActorAction, redoActorAction]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#333333] font-sans antialiased motion-reduce:transition-none">
      <Toolbar />
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#B87333]">Copper Dawn Routine</h1>
          <p className="text-sm text-gray-500 mt-2">
            This is a planning exercise and does not provide health, mental-health, accessibility, sleep, medical, lifestyle, or productivity advice.
          </p>
        </header>

        <main className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-[#E5E5E5] overflow-hidden">
               <h2 className="text-xl font-semibold mb-4 text-[#333333]">Structure Canvas</h2>
               <StructureCanvas />
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-8 flex-shrink-0">
             <div className="bg-white rounded-lg shadow-sm p-6 border border-[#E5E5E5]">
               <h2 className="text-xl font-semibold mb-4 text-[#333333]">Focus Rail</h2>
               <FocusRail />
               <p className="mt-4 text-sm text-gray-600 font-medium">Finish: {new Date(sessionState.finishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</p>
             </div>

             {/* Simple History view to fulfill requirements */}
             <div className="bg-white rounded-lg shadow-sm p-6 border border-[#E5E5E5]">
                <h2 className="text-xl font-semibold mb-4 text-[#333333]">History</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...history].reverse().map(ev => (
                     <div key={ev.historyId} className={`text-xs p-2 rounded ${ev.active ? 'bg-gray-50' : 'bg-red-50 line-through text-gray-400'}`}>
                        <strong>{ev.historyId}</strong>: {ev.kind} by {ev.actorId}
                     </div>
                  ))}
                </div>
             </div>
          </div>
        </main>
      </div>
      <RepairModal />
    </div>
  );
}

export default App;
