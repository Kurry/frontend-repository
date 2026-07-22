import { useEffect, useState } from 'react';
import { useStore } from './store';
import { CollectionPanel } from './components/CollectionPanel';
import { ForecastRibbon } from './components/ForecastRibbon';
import { GitHubFieldsPanel } from './components/GitHubFieldsPanel';
import { ExportImportModal } from './components/ExportImportModal';
import { Menu, RefreshCcw, FileJson } from 'lucide-react';

function App() {
  const { seed, records } = useStore();
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    // Initial seed if empty
    if (records.length === 0) {
      seed();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 font-sans">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-gray-500" />
          <h1 className="font-semibold text-lg tracking-tight">Apparel Fit Annotation Studio</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => seed()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Seed
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-900 text-white hover:bg-slate-800 rounded font-medium transition-colors"
          >
            <FileJson className="w-4 h-4" /> Export / Import
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <CollectionPanel />
        <ForecastRibbon />
        <GitHubFieldsPanel />
      </main>

      <ExportImportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}

export default App;
