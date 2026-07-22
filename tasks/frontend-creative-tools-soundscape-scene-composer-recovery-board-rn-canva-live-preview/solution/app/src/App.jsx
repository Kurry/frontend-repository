import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { SoundLayers } from './components/SoundLayers';
import { RecoveryBoard } from './components/RecoveryBoard';
import { ArtifactExportImport } from './components/ArtifactExportImport';
import { Summary } from './components/Summary';
import { initializeWebMCP } from './webmcp';

const AppLayout = () => {
  const { session, addRecord, updateRecord, deleteRecord, undo } = useStore();

  // Initialize WebMCP on mount
  useEffect(() => {
    initializeWebMCP({
      session,
      addRecord,
      updateRecord,
      deleteRecord
    });
  }, [session, addRecord, updateRecord, deleteRecord]);

  // Keyboard undo binding (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger undo if typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-950 border-b border-slate-800 p-4 shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Soundscape Scene Composer
        </h1>
        <p className="text-xs text-slate-400 mt-1">Design workspace with live recovery</p>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

          {/* Main Workspace (Left/Top) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-h-0 h-[800px] lg:h-auto overflow-y-auto lg:overflow-hidden pb-8 lg:pb-0">
            <div className="flex-1 min-h-[400px]">
              <SoundLayers />
            </div>
            <div className="flex-1 min-h-[300px]">
              <RecoveryBoard />
            </div>
          </div>

          {/* Linked Views / Inspector (Right/Bottom) */}
          <div className="lg:col-span-4 flex flex-col gap-6 shrink-0">
            <Summary />
            <ArtifactExportImport />
          </div>

        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
