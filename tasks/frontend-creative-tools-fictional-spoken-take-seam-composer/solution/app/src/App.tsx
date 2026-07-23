import { useEffect } from 'react';
import { TakeShelf } from './components/TakeShelf';
import { MasterRibbon } from './components/MasterRibbon';
import { ProofRail } from './components/ProofRail';
import { initWebMCP } from './lib/webmcp';
export default function App() {
  useEffect(() => { initWebMCP(); }, []);
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full"><TakeShelf /><MasterRibbon /><ProofRail /></main>
    </div>
  );
}
