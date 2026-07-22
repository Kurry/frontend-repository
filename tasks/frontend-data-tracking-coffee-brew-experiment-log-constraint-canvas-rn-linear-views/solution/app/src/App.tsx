import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { formatISO } from 'date-fns';
import type { Experiment, ArtifactSchema, ConstraintLane } from './types';
import { Collection } from './components/Collection';
import { ConstraintCanvas } from './components/ConstraintCanvas';

function App() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [history, setHistory] = useState<ArtifactSchema['history']>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Experiment[][]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  // Expose state globally for WebMCP
  useEffect(() => {
    (window as any).__APP_STATE__ = {
      experiments,
      history,
    };
  }, [experiments, history]);

  useEffect(() => {
    (window as any).__APP_ACTIONS__ = {
      handleAdd,
      handleUpdate,
      handleArchive,
      handleDelete,
      handleMove,
      handleResolve,
      generateArtifact,
      handleImportDirect
    };
  }, [experiments, history, undoStack]);

  const saveState = (newExperiments: Experiment[]) => {
    setUndoStack((prev) => [...prev, experiments]);
    setExperiments(newExperiments);
  };

  const handleAdd = (expData: Omit<Experiment, 'id' | 'status'>) => {
    const id = uuidv4();
    const newExp: Experiment = { ...expData, id, status: 'draft' };
    saveState([...experiments, newExp]);
    setHistory((h) => [...h, { timestamp: formatISO(new Date()), action: 'create', recordId: id }]);
  };

  const handleUpdate = (id: string, updates: Partial<Experiment>) => {
    const newExperiments = experiments.map((e) => (e.id === id ? { ...e, ...updates } : e));
    saveState(newExperiments);
    setHistory((h) => [...h, { timestamp: formatISO(new Date()), action: 'update', recordId: id }]);
  };

  const handleArchive = (id: string) => {
    handleUpdate(id, { status: 'archived' });
  };

  const handleDelete = (id: string) => {
    const newExperiments = experiments.filter((e) => e.id !== id);
    saveState(newExperiments);
    setHistory((h) => [...h, { timestamp: formatISO(new Date()), action: 'delete', recordId: id }]);
    if (selectedId === id) setSelectedId(null);
  };

  const handleMove = (id: string, newLane: ConstraintLane) => {
    const exp = experiments.find((e) => e.id === id);
    if (!exp) return;
    if (exp.lane === newLane) return;

    // Simulate constraint conflict rule: e.g., moving to 'brewTime' without resolved temperature
    // For the sake of the exercise, let's make moving always cause a conflict that needs resolving,
    // unless it was already resolved.
    const newStatus = exp.status === 'resolved' ? 'changed' : 'conflict';

    const newExperiments = experiments.map((e) =>
      e.id === id ? { ...e, lane: newLane, status: newStatus as any } : e
    );
    saveState(newExperiments);
    setHistory((h) => [...h, { timestamp: formatISO(new Date()), action: 'move', recordId: id }]);
    setSelectedId(id);
  };

  const handleResolve = (id: string) => {
    handleUpdate(id, { status: 'resolved' });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setExperiments(previousState);
    setHistory((h) => [...h, { timestamp: formatISO(new Date()), action: 'undo' }]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, experiments]);

  const generateArtifact = (): ArtifactSchema => ({
    schemaVersion: 'v1',
    exportedAt: formatISO(new Date()),
    records: experiments,
    derived: {
      summary: `Total active experiments: ${experiments.filter(e => e.status !== 'archived').length}. Conflicts: ${experiments.filter(e => e.status === 'conflict').length}.`,
    },
    history,
  });

  const handleExport = () => {
    const artifact = generateArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDirect = (json: any) => {
    if (json.schemaVersion !== 'v1' || !Array.isArray(json.records)) {
      throw new Error('Invalid schema');
    }
    setExperiments(json.records);
    setHistory(json.history || []);
    setUndoStack([]);
    setSelectedId(null);
    setImportError(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        handleImportDirect(json);
      } catch (err) {
        setImportError('Malformed import file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coffee Brew Experiment Log</h1>
          <p className="text-sm text-gray-500 mt-1">Constraint Canvas & Linear Filtered Views</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            data-testid="export-btn"
          >
            Export Artifact
          </button>
          <label className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer transition-colors">
            Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} data-testid="import-input" />
          </label>
        </div>
      </header>

      {importError && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm" data-testid="import-error">
          {importError}
        </div>
      )}

      <main className="flex flex-col md:flex-row gap-6 flex-1 h-[600px]">
        {/* Collection Panel */}
        <aside className="w-full md:w-1/3 lg:w-1/4 h-full">
          <Collection
            experiments={experiments}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </aside>

        {/* Canvas Panel */}
        <section className="flex-1 h-full flex flex-col gap-4 overflow-hidden">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div className="text-sm font-medium text-gray-700 mb-2">Derived Summary</div>
             <div className="text-sm text-gray-600" data-testid="derived-summary">
               {generateArtifact().derived.summary}
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <ConstraintCanvas
              experiments={experiments}
              selectedExperimentId={selectedId}
              onMoveExperiment={handleMove}
              onSelectExperiment={setSelectedId}
              onResolveConflict={handleResolve}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
