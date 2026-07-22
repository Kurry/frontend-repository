import { useState } from 'react';
import { CardList } from './components/CardList';
import { CardEditor } from './components/CardEditor';
import { BatchReconciler } from './components/BatchReconciler';
import { useStore } from './store';
import type { ScenarioCard } from './types';

function App() {
  const [editingCard, setEditingCard] = useState<ScenarioCard | undefined>(undefined);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const importArtifact = useStore((state) => state.importArtifact);
  const exportArtifact = useStore((state) => state.exportArtifact);
  const clearSession = useStore((state) => state.clearSession);

  const handleEdit = (card: ScenarioCard) => {
    setEditingCard(card);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingCard(undefined);
    setIsEditorOpen(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const jsonStr = exportArtifact();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    // Use timeout to prevent race conditions during download in Playwright headless
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importArtifact(content);
      if (!res.success) {
        alert(res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 flex flex-wrap justify-between items-center shadow-md shrink-0">
        <h1 className="text-xl font-bold tracking-tight">Board Game Scenario Builder</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-sm font-medium transition-colors focus:ring-2 focus:ring-white"
          >
            + New Record
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors focus:ring-2 focus:ring-white"
          >
            Export Artifact
          </button>

          <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-white">
            <span>Import Artifact</span>
            <input
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleImport}
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Clear current session?')) {
                clearSession();
                setSelectedIds([]);
              }
            }}
            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 rounded text-sm transition-colors focus:ring-2 focus:ring-white text-red-200"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left/Main Column: List */}
        <main className="flex-1 overflow-hidden border-r border-gray-200 relative">
          <CardList
            onEdit={handleEdit}
            selectedIds={selectedIds}
            onSelectToggle={toggleSelection}
          />
        </main>

        {/* Right Column: Dynamic Panel (Editor or Reconciler) */}
        <aside className="w-full md:w-96 lg:w-[400px] shrink-0 overflow-hidden flex flex-col bg-white border-t md:border-t-0 md:border-l border-gray-200">
          {/* Panel Toggle Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
            <button
              onClick={() => {
                setIsEditorOpen(false);
              }}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${!isEditorOpen ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              Batch Reconciler
              {selectedIds.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5">
                  {selectedIds.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsEditorOpen(true);
              }}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${isEditorOpen ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              Editor
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden relative">
            {!isEditorOpen ? (
              <BatchReconciler
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
              />
            ) : (
              <CardEditor
                initialData={editingCard}
                onClose={() => setIsEditorOpen(false)}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
