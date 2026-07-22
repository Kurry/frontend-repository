import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { CostumeList } from './components/CostumeList';
import { DerivedSummary } from './components/DerivedSummary';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { ArtifactTools } from './components/ArtifactTools';

export default function App() {
  const undo = useStore((state) => state.undo);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Global Keyboard shortcuts
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
    <div className="flex flex-col md:flex-row h-screen bg-background text-text overflow-hidden font-sans">

      {/* Main Content (Costume Collection) */}
      <main className="flex-1 flex flex-col overflow-hidden relative border-b md:border-b-0 md:border-r border-border">
        <header className="h-16 flex-shrink-0 bg-surface/50 border-b border-border flex items-center px-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Costume Continuity Board</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-32">
          <CostumeList selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </main>

      {/* Right Sidebar (Scenario Weaver & Summary) */}
      <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-surface flex flex-col overflow-hidden max-h-[50vh] md:max-h-full">
        {/* Derived Summary Top */}
        <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xs font-bold uppercase text-text-muted mb-4 tracking-wider">Session Summary</h2>
          <DerivedSummary />
        </div>

        {/* Scenario Weaver Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <h2 className="text-xs font-bold uppercase text-text-muted mb-4 tracking-wider">Scenario Weaver</h2>
          <ScenarioWeaver selectedId={selectedId} />
        </div>

        {/* Artifact Tools Bottom */}
        <div className="p-4 md:p-6 border-t border-border bg-surface-hover/50 flex-shrink-0">
           <ArtifactTools />
        </div>
      </aside>
    </div>
  );
}
