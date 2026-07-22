import { createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import {
  store,
  addRecord,
  updateRecord,
  deleteRecord,
  selectRecord,
  rebalanceCapacity,
  undo,
  importArtifact,
  clearArtifact
} from './store.js';

export default function App() {
  const [filter, setFilter] = createSignal('all');
  const [newRecordName, setNewRecordName] = createSignal('');
  const [newRecordCapacity, setNewRecordCapacity] = createSignal(100);
  const [newRecordUsed, setNewRecordUsed] = createSignal(0);
  const [errorMsg, setErrorMsg] = createSignal('');

  // Artifact states: unsaved, exported, validated, replayed
  const [artifactState, setArtifactState] = createSignal('unsaved');

  const handleKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  const handleCreateRecord = (e) => {
    e.preventDefault();
    if (!newRecordName().trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (newRecordCapacity() < 0) {
      setErrorMsg('Capacity must be >= 0');
      return;
    }
    if (newRecordUsed() < 0 || newRecordUsed() > newRecordCapacity()) {
      setErrorMsg('Used must be >= 0 and <= Capacity');
      return;
    }

    addRecord({
      id: 'rec-' + Date.now(),
      name: newRecordName(),
      capacity: newRecordCapacity(),
      used: newRecordUsed(),
      status: newRecordUsed() === 0 ? 'empty' : 'ready'
    });

    setNewRecordName('');
    setNewRecordCapacity(100);
    setNewRecordUsed(0);
    setErrorMsg('');
  };

  const handleExport = () => {
    const payload = {
      schemaVersion: store.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: store.records,
      derived: store.derived,
      history: store.history
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-peak-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);

    setArtifactState('exported');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const success = importArtifact(data);
        if (success) {
          setArtifactState('replayed');
        } else {
          alert('Validation failed: Invalid schema or bounds');
        }
      } catch (err) {
        alert('Validation failed: Malformed JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const filteredRecords = () => {
    if (filter() === 'all') return store.records;
    return store.records.filter(r => r.status === filter());
  };

  return (
    <div class="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col md:flex-row gap-6 font-sans">

      {/* Primary Surface: Collection & Artifact */}
      <div class="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <header class="mb-6 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-slate-800">Energy Peak Observatory</h1>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium transition-colors" onClick={undo}>
              Undo (Ctrl+Z)
            </button>
            <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors" onClick={handleExport}>
              Export
            </button>
            <button class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors" onClick={clearArtifact}>
              Clear
            </button>
            <label class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium cursor-pointer transition-colors">
              Import
              <input type="file" accept=".json" class="hidden" onChange={handleImport} />
            </label>
          </div>
        </header>

        <div class="mb-4 text-xs font-mono text-slate-500">
          Artifact State: <span class="font-bold text-indigo-600">{artifactState()}</span>
        </div>

        <form onSubmit={handleCreateRecord} class="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 class="font-semibold text-slate-700 mb-3">Add New Reading</h2>
          {errorMsg() && <div class="mb-3 text-red-600 text-sm">{errorMsg()}</div>}
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[150px]">
              <label class="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input type="text" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={newRecordName()} onInput={e => setNewRecordName(e.target.value)} />
            </div>
            <div class="w-24">
              <label class="block text-xs font-medium text-slate-500 mb-1">Capacity</label>
              <input type="number" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={newRecordCapacity()} onInput={e => setNewRecordCapacity(parseInt(e.target.value) || 0)} />
            </div>
            <div class="w-24">
              <label class="block text-xs font-medium text-slate-500 mb-1">Used</label>
              <input type="number" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={newRecordUsed()} onInput={e => setNewRecordUsed(parseInt(e.target.value) || 0)} />
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium">Add</button>
          </div>
        </form>

        <div class="mb-4 flex gap-2">
          <button class={`px-3 py-1 text-sm rounded ${filter() === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200'}`} onClick={() => setFilter('all')}>All</button>
          <button class={`px-3 py-1 text-sm rounded ${filter() === 'ready' ? 'bg-green-600 text-white' : 'bg-slate-200'}`} onClick={() => setFilter('ready')}>Ready</button>
          <button class={`px-3 py-1 text-sm rounded ${filter() === 'conflict' ? 'bg-red-600 text-white' : 'bg-slate-200'}`} onClick={() => setFilter('conflict')}>Conflict</button>
          <button class={`px-3 py-1 text-sm rounded ${filter() === 'empty' ? 'bg-slate-600 text-white' : 'bg-slate-200'}`} onClick={() => setFilter('empty')}>Empty</button>
          <button class={`px-3 py-1 text-sm rounded ${filter() === 'archived' ? 'bg-gray-600 text-white' : 'bg-slate-200'}`} onClick={() => setFilter('archived')}>Archived</button>
        </div>

        <div class="space-y-3">
          <For each={filteredRecords()}>
            {(record) => (
              <div
                class={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${store.derived.activeSelection === record.id ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => selectRecord(record.id)}
              >
                <div>
                  <div class="font-medium text-slate-800">{record.name}</div>
                  <div class="text-sm text-slate-500">Capacity: {record.capacity} | Used: {record.used}</div>
                </div>
                <div class="flex items-center gap-4">
                  <span class={`text-xs px-2 py-1 rounded font-medium ${
                    record.status === 'conflict' ? 'bg-red-100 text-red-700' :
                    record.status === 'ready' ? 'bg-green-100 text-green-700' :
                    record.status === 'empty' ? 'bg-slate-200 text-slate-700' :
                    record.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                  <button
                    class="text-red-500 hover:text-red-700 px-2 py-1"
                    onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </For>
          {filteredRecords().length === 0 && (
            <div class="p-8 text-center text-slate-500 border border-dashed rounded-lg">No readings found.</div>
          )}
        </div>
      </div>

      {/* Secondary Surface: Spatial Composer & Linked Summary */}
      <div class="w-full md:w-80 flex flex-col gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="font-semibold text-slate-800 mb-4">Derived Summary</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500 text-sm">Total Capacity</span>
              <span class="font-medium">{store.derived.totalCapacity}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 text-sm">Total Used</span>
              <span class="font-medium">{store.derived.totalUsed}</span>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100">
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  class="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (store.derived.totalUsed / (store.derived.totalCapacity || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
          <h2 class="font-semibold text-slate-800 mb-4">Spatial Composer</h2>
          <Show
            when={store.derived.spatialComposerActive && store.derived.activeSelection}
            fallback={<div class="text-sm text-slate-500 italic p-4 text-center border border-dashed rounded bg-slate-50">Select a record to place in the composer</div>}
          >
            {(() => {
              const activeRecord = store.records.find(r => r.id === store.derived.activeSelection);
              if (!activeRecord) return null;

              const [localCap, setLocalCap] = createSignal(activeRecord.capacity);

              // sync local state if active record changes elsewhere
              createSignal(() => {
                setLocalCap(activeRecord.capacity);
              });

              const handleRebalance = () => {
                if (localCap() < activeRecord.used) {
                  alert("Cannot set capacity below used amount.");
                  return;
                }
                rebalanceCapacity(activeRecord.id, localCap());
              };

              return (
                <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div class="p-4 bg-indigo-50 rounded-lg mb-4 border border-indigo-100">
                    <h3 class="font-medium text-indigo-900 mb-1">{activeRecord.name}</h3>
                    <div class="text-sm text-indigo-700">Currently used: {activeRecord.used}</div>
                    <div class="text-sm text-indigo-700 mb-4">Current state: {activeRecord.status}</div>

                    <label class="block text-xs font-medium text-indigo-800 mb-1">Rebalance Capacity</label>
                    <div class="flex gap-2">
                      <input
                        type="range"
                        min={activeRecord.used}
                        max={1000}
                        value={localCap()}
                        onInput={(e) => setLocalCap(parseInt(e.target.value))}
                        class="flex-1"
                      />
                      <span class="w-12 text-right text-sm font-medium">{localCap()}</span>
                    </div>
                  </div>

                  <button
                    class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
                    onClick={handleRebalance}
                  >
                    Apply Mutation
                  </button>
                </div>
              );
            })()}
          </Show>
        </div>
      </div>

    </div>
  );
}
