import React, { useEffect } from 'react';
import { usePackingStore } from './store';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { ReplayTimeline } from './components/ReplayTimeline';
import { Summary } from './components/Summary';
import { Download, Upload, Undo2, Trash, PlaneTakeoff } from 'lucide-react';
import { initWebMCP } from './webmcp';

function App() {
  const store = usePackingStore();

  useEffect(() => {
    // Initialize WebMCP contracts
    initWebMCP(store);
  }, [store]);

  const handleExport = () => {
    const data = store.exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carry-on-pack-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            store.importSession(data);
          } catch (err) {
            console.error('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const selectedItem = store.records.find(r => r.id === store.selectedItemId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Carry-On Packing Optimizer</h1>
            <h1 className="text-xl font-bold text-gray-900 sm:hidden">Packing Optimizer</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={store.undo}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">Undo</span>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

            <button
              onClick={handleImport}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1"
              title="Import Session"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">Import</span>
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1"
              title="Export Session"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">Export</span>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

            <button
              onClick={() => {
                if(confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                  store.clearSession();
                }
              }}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Clear Session"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ItemForm onAdd={store.addRecord} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 order-2 lg:order-1 h-full">
            <ItemList
              records={store.records}
              selectedItemId={store.selectedItemId}
              onSelect={store.setSelectedItemId}
              onUpdate={store.updateRecord}
              onDelete={store.deleteRecord}
            />
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2 space-y-6 flex flex-col h-full lg:sticky lg:top-24">
            <Summary summary={store.derived} />
            <div className="flex-1 min-h-[400px]">
              <ReplayTimeline
                item={selectedItem}
                onRestore={store.restoreCheckpoint}
                onClose={() => store.setSelectedItemId(null)}
                setScrubPreview={store.setScrubPreview}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
