import { useEffect } from 'react';
import { useStore } from './store';
import { QuiltBlocksCollection } from './components/QuiltBlocksCollection';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ExportImportControls } from './components/ExportImportControls';

function App() {
  const { undo, exportSession } = useStore();

  const derived = exportSession().derived;

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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-indigo-900">Quilt Block Layout Studio</h1>
          <p className="text-sm text-gray-600">Provenance Atlas Workflow</p>
        </div>
        <div className="flex gap-4 text-sm bg-white px-4 py-2 rounded-full shadow-sm border">
          <div>Total: <span className="font-bold">{derived.totalBlocks}</span></div>
          <div>Archived: <span className="font-bold">{derived.archivedCount}</span></div>
          <div className="text-red-600">Quarantined: <span className="font-bold">{derived.quarantinedCount}</span></div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <main className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4 flex flex-col h-[600px] lg:h-[800px] overflow-y-auto">
          <QuiltBlocksCollection />
        </main>

        <aside className="lg:col-span-1 flex flex-col gap-6 h-[600px] lg:h-[800px]">
          <div className="flex-1 min-h-0">
            <ProvenanceAtlas />
          </div>
          <div className="flex-none">
            <ExportImportControls />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
