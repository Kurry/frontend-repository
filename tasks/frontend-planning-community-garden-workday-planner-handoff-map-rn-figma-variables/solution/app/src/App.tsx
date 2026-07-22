import React, { useState, useRef } from 'react';
import { TaskCollection } from './components/TaskCollection';
import { HandoffMap } from './components/HandoffMap';
import { Download, Upload, Trash2, Sprout, Menu, X } from 'lucide-react';

function App({ store }: { store: any }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTask = store.records.find((r: any) => r.id === selectedId) || null;

  const handleExport = () => {
    const artifact = store.exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garden-workday-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = store.importArtifact(parsed);
        if (success) {
          setImportError(null);
          setSelectedId(null);
        } else {
          setImportError('Invalid artifact format or schema mismatch.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100 font-sans overflow-hidden">
      <header className="bg-green-700 text-white px-4 md:px-6 py-3 flex justify-between items-center shadow-md z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-1 mr-2 bg-green-800 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200 motion-reduce:transition-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Sprout size={24} className="hidden sm:block" />
          <h1 className="text-lg md:text-xl font-bold tracking-wide truncate">Workday Planner</h1>
        </div>
        <div className="flex gap-2 md:gap-3 shrink-0">
          <button onClick={store.clearSession} className="hidden sm:flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 motion-reduce:transition-none">
            <Trash2 size={16} /> <span className="hidden lg:inline">Clear Session</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-green-600 hover:bg-green-500 border border-green-500 px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 motion-reduce:transition-none">
            <Upload size={16} /> <span className="hidden sm:inline">Import</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          <button onClick={handleExport} className="flex items-center gap-1 bg-white text-green-700 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-bold shadow-sm transition-colors duration-200 motion-reduce:transition-none">
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm text-center shrink-0">
          {importError}
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden transition-opacity duration-300 ease-in-out motion-reduce:transition-none motion-reduce:duration-0"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          absolute md:relative z-10 md:z-0
          inset-y-0 left-0
          w-[320px] max-w-[85vw] md:w-1/3 lg:max-w-md
          h-full border-r border-gray-200 bg-white
          transform md:transform-none transition-transform duration-300 ease-in-out motion-reduce:transition-none motion-reduce:duration-0
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <TaskCollection
            records={store.records}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (window.innerWidth < 768) setIsSidebarOpen(false); // Auto close on mobile
            }}
            addRecord={store.addRecord}
            updateRecord={store.updateRecord}
            archiveRecord={store.archiveRecord}
          />
        </aside>

        <section className="flex-1 flex flex-col h-full min-w-0">
          <HandoffMap
            selectedTask={selectedTask}
            assignHandoff={store.assignHandoff}
            undo={store.undo}
            canUndo={store.canUndo}
          />

          <div className="h-auto md:h-48 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-y-auto shrink-0">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Derived Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
               <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase">Total</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-800">{store.derived.summary.total}</div>
               </div>
               {Object.entries(store.derived.summary.byStatus).map(([status, count]) => (
                 <div key={status} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                    <div className="text-xs text-gray-500 uppercase">{status}</div>
                    <div className={status === 'ready' ? "text-lg md:text-xl font-bold text-green-600" :
                      status === 'draft' ? "text-lg md:text-xl font-bold text-yellow-600" :
                      status === 'changed' ? "text-lg md:text-xl font-bold text-blue-600" :
                      "text-lg md:text-xl font-bold text-gray-700"
                    }>{count as number}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
