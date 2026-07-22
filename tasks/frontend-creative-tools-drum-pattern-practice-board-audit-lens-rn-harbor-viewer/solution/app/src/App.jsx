import React from 'react';
import DrumPatterns from './DrumPatterns';
import { AuditLens } from './AuditLens';
import { ArtifactTransfer } from './ArtifactTransfer';

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-4 md:p-8 font-sans">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Drum Pattern Practice Board</h1>
        <p className="text-sm text-zinc-500">Manage drum patterns and resolve audit discrepancies</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="col-span-1 md:col-span-7 flex flex-col gap-6"><DrumPatterns /></div>
        <div className="col-span-1 md:col-span-5 flex flex-col gap-6"><AuditLens /><ArtifactTransfer /></div>
      </main>
    </div>
  );
}

export default App;
