import React from 'react';
import { Collection } from './components/Collection';
import { Composer } from './components/Composer';
import { ExportImport } from './components/ExportImport';
import { ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-100">
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center gap-3 relative z-10">
        <ShieldAlert className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Drill Evacuation Planner</h1>
          <p className="text-slate-400 text-sm italic font-mono">Spatial Composer — Domain Workbench</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full flex flex-col">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          <div className="lg:w-1/3 flex flex-col gap-4 max-h-[800px] overflow-y-auto">
            <Collection />
          </div>
          <div className="lg:w-2/3 flex flex-col gap-4">
            <Composer />
          </div>
        </div>
        <ExportImport />
      </main>

      <footer className="bg-slate-800 text-slate-400 text-center p-2 text-xs">
        <p>In-memory state only. No external APIs.</p>
      </footer>
    </div>
  );
};

export default App;
