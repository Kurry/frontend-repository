import { useStore } from "./store";
import { Import, Download, Plus, Search, RotateCcw } from 'lucide-react';
import { FlavorComponentList } from './components/FlavorComponentList';
import { FlavorComponentEditor } from './components/FlavorComponentEditor';
import { ReplayTimeline } from './components/ReplayTimeline';
import { WebMCPInfo } from './components/WebMCPInfo';

function App() {
  const {
    derived,
    filterStatus,
    setFilterStatus,
    selectedRecordId,
    addRecord,
    exportSession,
    importSession,
    undoLastMutation
  } = useStore();

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flavor-balance-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importSession(json);
        if (!success) {
          alert("Malformed schema, duplicate IDs, unknown references, or invalid bounds make no state change.");
        }
      } catch (err) {
        alert("Invalid JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const handleCreate = () => {
    addRecord({
      name: 'New Flavor Component',
      status: 'draft',
      details: '',
      profile: { sweetness: 50, acidity: 50, saltiness: 50, bitterness: 50, umami: 50 }
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Recipe Flavor Balance Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">Lightroom-style Editing & Replay Timeline</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 border-r border-slate-700 pr-4">
            Total: {derived.totalRecords} | Ready: {derived.readyCount} | Draft: {derived.draftCount}
          </div>
          <button
            onClick={undoLastMutation}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            <RotateCcw size={16} />
            <span>Undo</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors cursor-pointer">
            <Import size={16} />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-200">Components</h2>
              <button onClick={handleCreate} className="p-1 hover:bg-slate-700 rounded text-slate-300">
                <Plus size={20} />
              </button>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-sm rounded p-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            <FlavorComponentList />
          </div>
        </aside>

        {/* Main Canvas */}
        <section className="flex-1 flex flex-col bg-slate-900">
          {selectedRecordId ? (
            <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
              <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex-1 flex flex-col overflow-hidden">
                <FlavorComponentEditor />
              </div>
              <div className="mt-4 h-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shrink-0 overflow-hidden">
                <ReplayTimeline />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a flavor component to edit or review timeline.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <WebMCPInfo />
    </div>
  );
}

export default App;
