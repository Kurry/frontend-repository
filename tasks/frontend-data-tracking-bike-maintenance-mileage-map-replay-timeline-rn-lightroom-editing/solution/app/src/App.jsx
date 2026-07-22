import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { Inspector } from './components/Inspector';
import { useStore } from './store';
import { Bike } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const selectedId = useStore(state => state.selectedId);
  const selectRecord = useStore(state => state.selectRecord);
  const undo = useStore(state => state.undo);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-900">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0 justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-md hidden sm:block">
            <Bike size={18} />
          </div>
          <h1 className="font-semibold text-sm tracking-wide truncate">Bike Maintenance</h1>
        </div>

        <div className="text-xs text-slate-500 hidden md:block">
          Press <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Cmd/Ctrl + Z</kbd> to undo mutations
        </div>
      </header>

      {/* Main Workspace: uses flex-col on mobile, flex-row on md+ */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Collection Drawer / Sidebar - stacking on mobile, side by side on desktop */}
        <div className={`md:w-80 flex-shrink-0 ${selectedId ? 'hidden md:block' : 'block h-full'}`}>
          <Sidebar selectedId={selectedId} onSelect={selectRecord} />
        </div>

        {/* Main Canvas - Timeline */}
        <div className={`flex-1 p-2 md:p-8 overflow-y-auto md:overflow-hidden flex flex-col ${selectedId ? 'block h-full' : 'hidden md:flex'}`}>
          {selectedId ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <div className="md:hidden mb-2">
                <button onClick={() => selectRecord(null)} className="text-blue-600 text-sm flex items-center gap-1">
                  &larr; Back to records
                </button>
              </div>
              <Timeline recordId={selectedId} />

              {/* On mobile, Inspector stacks below Timeline */}
              <div className="mt-4 md:hidden border-t border-slate-200 pt-4">
                 <Inspector selectedId={selectedId} clearSelection={() => selectRecord(null)} />
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Bike size={48} className="mb-4 text-slate-200" />
              <p>Select a service record from the collection.</p>
            </div>
          )}
        </div>

        {/* Inspector / Summary - side panel on desktop */}
        <div className="hidden md:block md:w-80 flex-shrink-0">
          <Inspector selectedId={selectedId} clearSelection={() => selectRecord(null)} />
        </div>

      </main>
    </div>
  );
}

export default App;
