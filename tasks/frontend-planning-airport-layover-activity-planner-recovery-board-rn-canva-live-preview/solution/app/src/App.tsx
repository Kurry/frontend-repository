import { useState } from 'react';
import { useStore } from './store';
import { LayoverList } from './components/LayoverList';
import { RecoveryBoard } from './components/RecoveryBoard';
import { ArtifactSchema } from './schema';
import { KeyboardShortcuts } from "./KeyboardShortcuts";

function App() {
  const { records, undo, historyIndex, importState, clearState } = useStore();

  const [importError, setImportError] = useState('');

  // Derived state summary
  const totalDuration = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const readyCount = records.filter(r => r.status === 'ready').length;
  const failedCount = records.filter(r => r.status === 'failed').length;
  const resolvedCount = records.filter(r => r.status === 'resolved').length;

  const handleExport = () => {
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: {
        totalDuration,
        readyCount,
        failedCount,
        resolvedCount
      },
      history: useStore.getState().history
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layover-plan-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const parsed = ArtifactSchema.safeParse(json);

        if (parsed.success) {
          importState(parsed.data.records, parsed.data.history);
          setImportError('');
        } else {
          setImportError('Invalid schema: ' + parsed.error.issues[0].message);
        }
      } catch (err) {
        setImportError('Failed to parse JSON file');
      }

      // Reset input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <KeyboardShortcuts />
      <header className="bg-slate-900 text-white p-4 shadow-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Airport Layover Activity Planner</h1>
          <p className="text-sm text-slate-400">Recovery Board Workspace</p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              historyIndex > 0 ? 'border-slate-600 hover:bg-slate-800 text-slate-200' : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
            title="Ctrl/Cmd+Z equivalent"
          >
            ↩ Undo
          </button>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <button
            onClick={clearState}
            className="px-3 py-1.5 text-sm rounded border border-red-900 text-red-400 hover:bg-red-950 transition-colors"
          >
            Clear
          </button>
          <label className="px-3 py-1.5 text-sm rounded border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer">
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 border border-blue-500 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-50 p-2 text-center text-red-700 text-sm border-b border-red-200 font-medium">
          {importError}
        </div>
      )}

      <div className="bg-white border-b border-slate-200 p-3 px-6 flex gap-8 text-sm shadow-sm z-0">
        <div className="flex gap-2">
          <span className="text-slate-500">Total Duration:</span>
          <span className="font-semibold text-slate-800">{totalDuration} mins</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500">Ready:</span>
          <span className="font-semibold text-green-700">{readyCount}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500">Failed:</span>
          <span className="font-semibold text-red-700">{failedCount}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-500">Resolved:</span>
          <span className="font-semibold text-blue-700">{resolvedCount}</span>
        </div>
        <div className="flex gap-2 ml-auto text-slate-400 text-xs mt-0.5">
           Keyboard shortcut: Cmd/Ctrl + Z to Undo
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        <section className="flex-1 min-w-0 md:w-1/2 flex flex-col h-[400px] md:h-full">
          <LayoverList />
        </section>

        <section className="flex-1 min-w-0 md:w-1/2 flex flex-col h-[400px] md:h-full">
          <RecoveryBoard />
        </section>
      </main>
    </div>
  );
}

export default App;
