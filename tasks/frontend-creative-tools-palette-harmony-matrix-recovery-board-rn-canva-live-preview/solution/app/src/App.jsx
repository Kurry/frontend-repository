import { createSignal, onMount, For, Show } from 'solid-js';
import { state, addRecord, updateRecord, removeRecord, setRecoverySelected, clearSession, importSession } from './store';
import { initWebMCP } from './WebMCP';

// Pre-seed some data
const seedData = () => {
  addRecord({ id: 'rec_1', colors: ['#ff0000', '#00ff00', '#0000ff'], status: 'ready' });
  addRecord({ id: 'rec_2', colors: ['#ffff00', '#00ffff'], status: 'conflict' });
  addRecord({ id: 'rec_3', colors: ['#ffffff'], status: 'empty' });
  addRecord({ id: 'rec_4', colors: ['#333333', '#666666', '#999999', '#cccccc'], status: 'draft' });
};

function App() {
  onMount(() => {
    initWebMCP();
    if (state.records.length === 0) {
      seedData();
    }
  });

  const [activeTab, setActiveTab] = createSignal('board'); // board, export
  const [exportFormat, setExportFormat] = createSignal('session-json');
  const [importText, setImportText] = createSignal('');
  const [importError, setImportError] = createSignal(null);

  // New record form
  const [newColors, setNewColors] = createSignal('#000000');
  const [newStatus, setNewStatus] = createSignal('draft');
  const [formError, setFormError] = createSignal(null);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newColors().trim()) {
      setFormError('Colors cannot be empty');
      return;
    }
    const colorsArr = newColors().split(',').map(c => c.trim()).filter(Boolean);
    if (colorsArr.length === 0) {
      setFormError('Must provide at least one valid color');
      return;
    }
    addRecord({
      id: 'rec_' + Date.now(),
      colors: colorsArr,
      status: newStatus()
    });
    setNewColors('#000000');
    setFormError(null);
  };

  const handleMutateToRecovery = (record) => {
    // move a failed record into a recovery path and repair its downstream consequences
    if (record.status === 'conflict' || record.status === 'empty' || record.status === 'draft') {
      updateRecord(record.id, { status: 'resolved' });
      setRecoverySelected(record.id);
    }
  };

  const [undoStack, setUndoStack] = createSignal([]);
  const saveForUndo = () => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(state))]);
  };
  const handleUndo = () => {
    const stack = undoStack();
    if (stack.length > 0) {
      const prevState = stack.pop();
      setUndoStack([...stack]);
      importSession(prevState); // Cheat: Use import to load state
    }
  };

  const handleMutateWithUndo = (record) => {
    saveForUndo();
    handleMutateToRecovery(record);
  };

  const handleExport = () => {
    const exportState = JSON.parse(JSON.stringify(state));
    exportState.exportedAt = new Date().toISOString();
    return JSON.stringify(exportState, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(handleExport());
  };

  const handleDownload = () => {
    const blob = new Blob([handleExport()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette-harmony-v1-recovery-board.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError(null);
    try {
      const data = JSON.parse(importText());
      if (!data.schemaVersion) {
         setImportError('schemaVersion is missing');
         return;
      }
      const ok = importSession(data);
      if (!ok) setImportError('Invalid schema payload');
      else setImportText('');
    } catch(e) {
      setImportError('Invalid JSON');
    }
  };

  return (
    <div class="min-h-screen p-4 md:p-8 flex flex-col items-center bg-secondary font-sans text-primary">
      <header class="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Palette Harmony Matrix</h1>
          <p class="text-sm opacity-70">Recovery Board • Live Preview</p>
        </div>
        <div class="flex gap-2">
          <button
            class={clsx("px-4 py-2 rounded font-medium transition-colors", activeTab() === 'board' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100')}
            onClick={() => setActiveTab('board')}
          >
            Board
          </button>
          <button
            class={clsx("px-4 py-2 rounded font-medium transition-colors", activeTab() === 'export' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100')}
            onClick={() => setActiveTab('export')}
          >
            Export/Import
          </button>
          <button
            class="px-4 py-2 rounded font-medium bg-gray-200 hover:bg-gray-300 transition-colors"
            onClick={handleUndo}
            disabled={undoStack().length === 0}
            title="Undo last mutation"
          >
            Undo
          </button>
        </div>
      </header>

      <main class="w-full max-w-5xl flex-1 flex flex-col md:flex-row gap-6">
        <Show when={activeTab() === 'board'}>
          <div class="flex-1 flex flex-col gap-6">
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 class="text-xl font-bold mb-4">Collection</h2>

              <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <form class="flex flex-wrap gap-4 items-end" onSubmit={handleCreate}>
                  <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium mb-1">Colors (comma separated)</label>
                    <input
                      type="text"
                      class="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                      value={newColors()}
                      onInput={(e) => setNewColors(e.target.value)}
                      placeholder="#ff0000, #00ff00"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Status</label>
                    <select
                      class="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                      value={newStatus()}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="conflict">Conflict</option>
                    </select>
                  </div>
                  <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                    Add
                  </button>
                </form>
                <Show when={formError()}>
                  <p class="text-danger text-sm mt-2 font-medium">{formError()}</p>
                </Show>
              </div>

              <div class="space-y-3">
                <For each={state.records}>
                  {(record) => (
                    <div class={clsx(
                      "p-4 rounded-lg border transition-all duration-300 flex flex-col md:flex-row gap-4 items-start md:items-center",
                      state.derived.recoveryBoardState.selectedId === record.id ? "border-info bg-blue-50 ring-1 ring-info" : "border-gray-200 bg-white hover:border-gray-300"
                    )}>
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="font-mono text-sm opacity-70">{record.id}</span>
                          <span class={clsx(
                            "text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider",
                            record.status === 'conflict' ? 'bg-danger/10 text-danger' :
                            record.status === 'resolved' ? 'bg-success/10 text-success' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {record.status}
                          </span>
                        </div>
                        <div class="flex gap-1 flex-wrap">
                          <For each={record.colors}>
                            {(c) => (
                              <div class="w-8 h-8 rounded shadow-sm border border-black/10" style={{ "background-color": c }} title={c} />
                            )}
                          </For>
                        </div>
                      </div>

                      <div class="flex gap-2 w-full md:w-auto">
                        <Show when={['conflict', 'empty', 'draft'].includes(record.status)}>
                          <button
                            class="flex-1 md:flex-none px-3 py-1.5 text-sm font-medium bg-info text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-info"
                            onClick={() => handleMutateWithUndo(record)}
                          >
                            Recover & Resolve
                          </button>
                        </Show>
                        <button
                          class="px-3 py-1.5 text-sm font-medium border border-danger text-danger rounded hover:bg-danger/10 transition-colors"
                          onClick={() => { saveForUndo(); removeRecord(record.id); }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </For>
                <Show when={state.records.length === 0}>
                  <div class="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                    No records in the collection. Create or import some.
                  </div>
                </Show>
              </div>
            </section>
          </div>

          <aside class="w-full md:w-80 flex flex-col gap-6">
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 class="text-xl font-bold mb-4">Linked Summary</h2>
              <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span class="font-medium">Total Records</span>
                  <span class="text-xl font-bold">{state.derived.summary.total}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-danger/5 text-danger rounded">
                  <span class="font-medium">Conflicts</span>
                  <span class="text-xl font-bold">{state.derived.summary.failed}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-success/5 text-success rounded">
                  <span class="font-medium">Resolved</span>
                  <span class="text-xl font-bold">{state.derived.summary.resolved}</span>
                </div>
              </div>
            </section>

            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
              <h2 class="text-xl font-bold mb-4">Canva Live Preview</h2>
              <div class="border-[8px] border-gray-800 rounded-[2rem] aspect-[9/19] w-full max-w-[240px] mx-auto overflow-hidden bg-white relative shadow-inner">
                <div class="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-xl mx-auto w-1/2"></div>
                <div class="p-4 pt-8 h-full overflow-y-auto bg-gray-50">
                  <h3 class="text-center font-bold mb-4 text-sm">Mobile View</h3>
                  <For each={state.records}>
                    {(r) => (
                      <div class={clsx(
                        "mb-3 p-3 rounded shadow-sm text-xs transition-colors",
                        r.status === 'conflict' ? 'bg-danger/10 border border-danger/20' : 'bg-white border border-gray-100'
                      )}>
                        <div class="font-bold mb-1 truncate">{r.id}</div>
                        <div class="flex gap-1 overflow-x-auto pb-1">
                          <For each={r.colors}>
                            {(c) => <div class="w-4 h-4 rounded-full flex-shrink-0" style={{ "background-color": c }} />}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </section>
          </aside>
        </Show>

        <Show when={activeTab() === 'export'}>
          <div class="w-full flex flex-col gap-6">
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex border-b mb-6">
                <button
                  class={clsx("px-4 py-2 font-medium border-b-2 transition-colors", exportFormat() === 'session-json' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800')}
                  onClick={() => setExportFormat('session-json')}
                >
                  Session JSON
                </button>
                <button
                  class={clsx("px-4 py-2 font-medium border-b-2 transition-colors", exportFormat() === 'png' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800')}
                  onClick={() => setExportFormat('png')}
                >
                  PNG
                </button>
              </div>

              <Show when={exportFormat() === 'session-json'}>
                <div class="flex flex-col gap-4">
                  <div class="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto max-h-[400px]">
                    <pre class="font-mono text-sm">{handleExport()}</pre>
                  </div>
                  <div class="flex gap-4">
                    <button class="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition-colors" onClick={handleCopy}>
                      Copy to Clipboard
                    </button>
                    <button class="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition-colors" onClick={handleDownload}>
                      Download JSON
                    </button>
                  </div>
                </div>
              </Show>

              <Show when={exportFormat() === 'png'}>
                <div class="flex flex-col items-center gap-4">
                  <div class="w-full max-w-md bg-white border rounded shadow-sm overflow-hidden" id="png-preview">
                    <div class="p-6">
                      <h2 class="text-2xl font-bold mb-4 text-center">Palette Harmony</h2>
                      <div class="flex flex-wrap gap-2 justify-center">
                        <For each={state.records}>
                          {(r) => (
                            <For each={r.colors}>
                              {(c) => <div class="w-12 h-12 rounded-full shadow-sm" style={{ "background-color": c }} />}
                            </For>
                          )}
                        </For>
                      </div>
                    </div>
                    <div class="bg-black text-white p-3 text-xs flex justify-between">
                      <span>/MADE WITH RECOVERY BOARD</span>
                      <span>&lt;HARMONYMATRIX.COM&gt;</span>
                    </div>
                  </div>
                  <button class="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition-colors">
                    Download PNG
                  </button>
                </div>
              </Show>
            </section>

            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 class="text-xl font-bold mb-4">Import Session</h2>
              <div class="flex flex-col gap-4">
                <textarea
                  class="w-full h-32 p-3 border rounded font-mono text-sm focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                  placeholder="Paste Session JSON here..."
                  value={importText()}
                  onInput={(e) => setImportText(e.target.value)}
                />
                <Show when={importError()}>
                  <p class="text-danger font-medium">{importError()}</p>
                </Show>
                <div class="flex gap-4">
                  <button
                    class="bg-gray-200 text-gray-800 px-6 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
                    onClick={handleImport}
                    disabled={!importText().trim()}
                  >
                    Import & Restore
                  </button>
                  <button
                    class="border border-danger text-danger px-6 py-2 rounded font-medium hover:bg-danger hover:text-white transition-colors"
                    onClick={clearSession}
                  >
                    Clear Session
                  </button>
                </div>
              </div>
            </section>
          </div>
        </Show>
      </main>
    </div>
  );
}

// Utility to fix clsx import issues
function clsx(...args) {
  return args.filter(Boolean).join(' ');
}

export default App;
