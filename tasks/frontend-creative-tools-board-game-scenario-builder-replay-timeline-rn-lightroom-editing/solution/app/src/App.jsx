import { createSignal } from 'solid-js';
import CollectionGrid from './components/CollectionGrid';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import { store, loadState, addRecord } from './store';
import { Download, Upload, Plus, Menu } from 'lucide-solid';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  const handleExport = () => {
    const exportData = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: store.records,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    // Do not immediately remove a to avoid race condition in headless testing
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Simple validation
        if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
          alert('Invalid file format. Expected schemaVersion "v1" and records array.');
          return;
        }

        // Regenerate exportedAt internally just as a side-effect, and load records
        loadState({
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: data.records,
            activeRecordId: null,
            filterStatus: 'all'
        });
        setMobileMenuOpen(false); // Close menu on import in mobile
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const handleNewRecord = () => {
      const newId = `rec-${Date.now()}`;
      addRecord({
          id: newId,
          title: 'New Scenario',
          description: '',
          status: 'draft',
          timelineState: 0,
          history: [{ timestamp: Date.now(), state: { timelineState: 0, status: 'draft' } }],
          derived: { summary: 'Newly created scenario' }
      });
      setMobileMenuOpen(false); // Close menu after creating in mobile
  };

  return (
    <div class="h-screen w-full flex flex-col bg-white text-gray-900 font-sans overflow-hidden">
      <header class="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 relative z-20">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 class="font-bold text-lg tracking-tight truncate">Scenario Builder</h1>
        </div>

        {/* Mobile menu toggle */}
        <button
          class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
        >
          <Menu size={20} />
        </button>

        {/* Desktop actions */}
        <div class="hidden md:flex items-center space-x-3">
          <button
            onClick={handleNewRecord}
            class="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span>New Scenario</span>
          </button>

          <div class="h-6 w-px bg-gray-300 mx-2"></div>

          <label class="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-sm font-medium cursor-pointer transition-colors">
            <Upload size={16} />
            <span>Import</span>
            <input type="file" accept=".json" class="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={handleExport}
            class="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Mobile actions dropdown */}
      {mobileMenuOpen() && (
        <div class="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-md z-30 p-4 flex flex-col space-y-3">
          <button
            onClick={handleNewRecord}
            class="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-50 text-blue-700 rounded font-medium"
          >
            <Plus size={18} />
            <span>New Scenario</span>
          </button>
          <label class="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium cursor-pointer">
            <Upload size={18} />
            <span>Import</span>
            <input type="file" accept=".json" class="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            class="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-900 text-white rounded font-medium"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      )}

      <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* On mobile, if no active record, show list. If active record, show workspace + sidebar stacking */}
        <div class={`w-full md:w-64 h-full shrink-0 md:block ${store.activeRecordId ? 'hidden' : 'block'}`}>
          <CollectionGrid />
        </div>

        {store.activeRecordId && (
          <div class="flex-1 flex flex-col md:flex-row min-w-0 h-full overflow-y-auto md:overflow-hidden">
            <div class="flex-1 min-w-0">
              <Workspace />
            </div>
            <div class="w-full md:w-72 shrink-0 md:h-full">
               <Sidebar />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
