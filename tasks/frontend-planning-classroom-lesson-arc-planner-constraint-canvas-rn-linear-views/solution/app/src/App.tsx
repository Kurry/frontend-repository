import React, { useState, useEffect } from 'react';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { Sidebar } from './components/Sidebar';
import type { LessonBlock } from './types';
import { useAppStore } from './store';
import { FileJson, Menu } from 'lucide-react';

function App() {
  const [editingBlock, setEditingBlock] = useState<LessonBlock | null>(null);
  const { undo, getDerivedSummary } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleEditBlock = (block: LessonBlock) => {
    setEditingBlock(block);
  };

  const handleCloseEdit = () => {
    setEditingBlock(null);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
            // we could do redo here if implemented, but just undo is fine
        } else {
            e.preventDefault();
            undo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo]);

  const summary = getDerivedSummary();

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900 font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
         <div
           className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
           onClick={() => setSidebarOpen(false)}
         />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar editingBlock={editingBlock} onCloseEdit={handleCloseEdit} />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-200 flex items-center px-6 shrink-0 bg-white shadow-sm z-10">
              <button
                  className="mr-4 md:hidden text-slate-500 hover:text-slate-800 focus:outline-none"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open Sidebar"
              >
                  <Menu size={20} />
              </button>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <FileJson size={14} className="text-white" />
                  </div>
                  Constraint Canvas
              </h1>

              <div className="ml-auto flex items-center gap-4 text-sm">
                 <div className="px-3 py-1 bg-slate-100 rounded-full font-medium text-slate-600">
                    Max 5 items per lane
                 </div>
              </div>
          </header>

          <ConstraintCanvas onEditBlock={handleEditBlock} />

          {/* Derived Summary View Panel */}
          <div className="h-16 border-t border-slate-200 bg-white flex items-center px-6 gap-6 shrink-0 z-10 overflow-x-auto">
             <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Derived Summary:</span>
             {Object.entries(summary).map(([lane, data]) => (
                <div key={lane} className="flex items-center gap-2 whitespace-nowrap">
                   <span className="text-sm font-medium">{lane}:</span>
                   <span className="text-sm text-slate-600">{data.count} items</span>
                   {data.isConflict && (
                       <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                           Conflict
                       </span>
                   )}
                </div>
             ))}
          </div>
      </main>
    </div>
  );
}

export default App;
