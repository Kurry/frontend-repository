import React, { useState, useRef } from 'react';
import { useStore } from './store';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { FilteredView } from './components/FilteredView';
import { DetailPanel } from './components/DetailPanel';
import { ConflictDialog } from './components/ConflictDialog';
import { LayoutDashboard, List, Plus, Download, Upload, Undo2, Redo2 } from 'lucide-react';

function App() {
  const {
    viewMode,
    setViewMode,
    addRecord,
    selectedRecordId,
    undo,
    redo,
    history,
    future,
    exportSession,
    importSession,
    clearSession
  } = useStore();

  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    addRecord({
      title: 'New Scenario',
      description: '',
      requiredPlayers: 1,
      duration: 15,
    });
  };

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importSession(content);
      if (!res.success) {
        setImportError(res.error || 'Failed to import');
        setTimeout(() => setImportError(null), 3000);
      } else {
        setImportError(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden text-gray-900">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg tracking-tight">Scenario Builder</h1>

          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('constraint-canvas')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'constraint-canvas' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Canvas
            </button>
            <button
              onClick={() => setViewMode('filtered-view')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'filtered-view' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r pr-3 mr-1">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
            <Download className="w-4 h-4" />
            Export
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </label>

          <button
            onClick={clearSession}
            className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md border border-red-200 ml-2"
          >
            Clear
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors ml-2"
          >
            <Plus className="w-4 h-4" />
            New Card
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center border-b border-red-100">
          {importError}
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'constraint-canvas' ? <ConstraintCanvas /> : <FilteredView />}
        </div>
        {selectedRecordId && <DetailPanel />}
      </main>

      <ConflictDialog />
    </div>
  );
}

export default App;
