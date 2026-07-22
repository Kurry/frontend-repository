import React, { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { QuiltList } from './components/QuiltList';
import { AuditLens } from './components/AuditLens';
import { Summary } from './components/Summary';
import { useStore } from './store';

export const App: React.FC = () => {
  const { undo } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo binding (Ctrl/Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      <Toolbar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left pane: Collection */}
        <div className="w-full md:w-64 lg:w-80 flex-shrink-0 h-1/3 md:h-full z-10 border-b md:border-b-0 shadow-sm md:shadow-none">
          <QuiltList />
        </div>

        {/* Middle pane: Audit Lens */}
        <div className="flex-1 h-full min-w-0 z-0">
          <AuditLens />
        </div>

        {/* Right pane: Summary */}
        <div className="w-full md:w-64 flex-shrink-0 h-auto md:h-full z-10 border-t md:border-t-0 shadow-sm md:shadow-none bg-white">
          <Summary />
        </div>
      </div>
    </div>
  );
};

export default App;
