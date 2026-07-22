
import { Collection } from './components/Collection';
import { AuditLens } from './components/AuditLens';
import { ArtifactManager } from './components/ArtifactManager';
import { Waves } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md flex items-center gap-3 shrink-0">
        <Waves className="w-6 h-6 text-indigo-400" />
        <div>
          <h1 className="text-xl font-bold leading-tight">Soundscape Scene Composer</h1>
          <p className="text-xs text-slate-400 font-mono">&lt;AUDIT LENS AUDIT VIEWER&gt;</p>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

          <div className="lg:col-span-4 h-[600px] lg:h-full flex flex-col min-h-0">
            <Collection />
          </div>

          <div className="lg:col-span-4 h-[500px] lg:h-full flex flex-col min-h-0">
            <AuditLens />
          </div>

          <div className="lg:col-span-4 h-[500px] lg:h-full flex flex-col min-h-0">
            <ArtifactManager />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
