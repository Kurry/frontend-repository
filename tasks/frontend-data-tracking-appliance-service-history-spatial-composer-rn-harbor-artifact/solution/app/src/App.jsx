import React, { useEffect } from 'react';
import RecordList from './components/RecordList';
import SpatialComposer from './components/SpatialComposer';
import ArtifactPanel from './components/ArtifactPanel';
import { store } from './store';

export default function App() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo on Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        store.dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900 font-sans">
      <div className="w-80 shrink-0 hidden md:block">
        <RecordList />
      </div>

      {/* Mobile view stack for RecordList if needed, but for simplicity keeping it responsive */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
         <SpatialComposer />
      </div>

      <div className="w-80 shrink-0 hidden lg:block">
         <ArtifactPanel />
      </div>

      {/* Mobile Drawer stand-ins (simplified layout for responsive requirement) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-1/2 bg-white border-t border-slate-200 overflow-hidden flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 border-r"><RecordList /></div>
              <div className="flex-1"><ArtifactPanel /></div>
          </div>
      </div>
    </div>
  );
}
