import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

// Enums
const STATUS = {
  EMPTY: 'empty',
  DRAFT: 'draft',
  READY: 'ready',
  CHANGED: 'changed',
  ARCHIVED: 'archived',
};

const SCENARIO_STATE = {
  IDLE: 'idle',
  SELECTED: 'selected',
  CHANGED: 'changed',
  CONFLICT: 'conflict',
  RESOLVED: 'resolved',
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Initial deterministic collection
const INITIAL_RECORDS = Array.from({ length: 100 }, (_, i) => ({
  id: `rec_${i + 1}`,
  title: `Segment ${i + 1}`,
  status: i % 5 === 0 ? STATUS.DRAFT : (i % 3 === 0 ? STATUS.READY : STATUS.EMPTY),
  scenarioState: SCENARIO_STATE.IDLE,
  bpm: 100 + (i % 40),
  bars: 4 + (i % 8),
  notes: `Practice notes for segment ${i + 1}`,
}));

export default function App() {
  const [store, setStore] = createStore({
    schemaVersion: 'practice-loop-v1',
    exportedAt: null,
    records: INITIAL_RECORDS,
    derived: {
      summary: 'Initial state',
    },
    history: [],
  });

  const [undoStack, setUndoStack] = createSignal([]);
  const [filterStatus, setFilterStatus] = createSignal('all');
  const [selectedRecordId, setSelectedRecordId] = createSignal(null);

  const [isEditing, setIsEditing] = createSignal(false);
  const [editForm, setEditForm] = createSignal({ title: '', status: STATUS.DRAFT, bpm: 120, bars: 4, notes: '' });
  const [editErrors, setEditErrors] = createSignal({});

  const pushUndoState = () => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(store))]);
  };

  const handleUndo = () => {
    const stack = undoStack();
    if (stack.length > 0) {
      const prevState = stack[stack.length - 1];
      setStore(reconcile(prevState));
      setUndoStack(stack.slice(0, -1));
    }
  };

  // WebMCP Contract Exposure
  onMount(() => {
    window.webmcp_session_info = () => ({
      modules: ['entity-collection-v1', 'artifact-transfer-v1']
    });

    window.webmcp_list_tools = () => {
      return [
        {
          name: "entity_create",
          description: "Create a new record",
          parameters: { type: "object", properties: { status: { type: "string" }, title: { type: "string" } } }
        },
        {
          name: "entity_select",
          description: "Select a record",
          parameters: { type: "object", properties: { id: { type: "string" } } }
        },
        {
          name: "entity_update",
          description: "Update a record",
          parameters: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } } }
        },
        {
          name: "entity_delete",
          description: "Delete a record",
          parameters: { type: "object", properties: { id: { type: "string" } } }
        },
        {
          name: "entity_reorder",
          description: "Reorder a record",
          parameters: { type: "object", properties: { id: { type: "string" }, newIndex: { type: "number" } } }
        },
        {
          name: "artifact_export",
          description: "Export current artifact",
          parameters: { type: "object", properties: {} }
        },
        {
          name: "artifact_import",
          description: "Import artifact",
          parameters: { type: "object", properties: { data: { type: "object" } } }
        }
      ];
    };

    window.webmcp_invoke_tool = (name, args) => {
      if (name !== 'artifact_export') pushUndoState();
      switch (name) {
        case 'entity_create':
          const newRec = { id: generateId(), title: args.title || 'New', status: args.status || STATUS.DRAFT, scenarioState: SCENARIO_STATE.IDLE, bpm: 120, bars: 4, notes: '' };
          setStore('records', store.records.length, newRec);
          return { success: true };
        case 'entity_select':
          setSelectedRecordId(args.id);
          return { success: true };
        case 'entity_update':
          setStore('records', r => r.id === args.id, 'status', args.status);
          return { success: true };
        case 'entity_delete':
          setStore('records', records => records.filter(r => r.id !== args.id));
          if (selectedRecordId() === args.id) setSelectedRecordId(null);
          return { success: true };
        case 'entity_reorder':
          if (args.newIndex < 0 || args.newIndex >= store.records.length) return { error: 'Invalid index' };
          const currentIndex = store.records.findIndex(r => r.id === args.id);
          if (currentIndex === -1) return { error: 'Record not found' };
          const newRecords = [...store.records];
          const [movedItem] = newRecords.splice(currentIndex, 1);
          newRecords.splice(args.newIndex, 0, movedItem);
          setStore('records', newRecords);
          return { success: true };
        case 'artifact_export':
          return { data: getExportData() };
        case 'artifact_import':
          return handleImport(args.data);
        default:
          return { error: 'Unknown tool' };
      }
    };

    // Keyboard undo
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      }
    });
  });

  const filteredRecords = createMemo(() => {
    if (filterStatus() === 'all') return store.records;
    return store.records.filter(r => r.status === filterStatus());
  });

  const selectedRecord = createMemo(() => {
    return store.records.find(r => r.id === selectedRecordId());
  });

  const handleBranchScenario = () => {
    const record = selectedRecord();
    if (!record) return;

    pushUndoState();

    setStore('records', r => r.id === record.id, 'scenarioState', SCENARIO_STATE.CHANGED);
    setStore('records', r => r.id === record.id, 'status', STATUS.CHANGED);
    setStore('derived', 'summary', `Branched scenario for ${record.title}`);
    setStore('history', [...store.history, { action: 'branch', id: record.id, timestamp: new Date().toISOString() }]);
  };

  const getExportData = () => {
    return {
      schemaVersion: 'practice-loop-v1',
      exportedAt: new Date().toISOString(),
      records: store.records,
      derived: store.derived,
      history: store.history,
    };
  };

  const handleExport = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-loop-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);

    pushUndoState();
    setStore('exportedAt', new Date().toISOString());
  };

  const handleImport = (rawData) => {
    let data = rawData;
    if (typeof rawData === 'string') {
        try {
            data = JSON.parse(rawData);
        } catch(e) {
            alert('Invalid JSON');
            return { error: 'Invalid JSON' };
        }
    }

    if (data.schemaVersion !== 'practice-loop-v1') {
      alert('Invalid schema version');
      return { error: 'Invalid schema version' };
    }

    // Validate structure
    if (!Array.isArray(data.records)) {
      alert('Missing or invalid records array');
      return { error: 'Invalid structure' };
    }

    const ids = new Set();
    for (const rec of data.records) {
      if (!rec.id || ids.has(rec.id)) {
        alert('Duplicate or missing ID found');
        return { error: 'Duplicate ID' };
      }
      ids.add(rec.id);

      if (!Object.values(STATUS).includes(rec.status)) {
        alert(`Invalid status value: ${rec.status}`);
        return { error: 'Invalid status' };
      }

      if (typeof rec.bpm !== 'number' || rec.bpm < 40 || rec.bpm > 300) {
        alert(`Invalid BPM in record ${rec.id}`);
        return { error: 'Invalid BPM bound' };
      }

      if (typeof rec.bars !== 'number' || rec.bars < 1 || rec.bars > 64) {
        alert(`Invalid Bars in record ${rec.id}`);
        return { error: 'Invalid Bars bound' };
      }
    }

    pushUndoState();
    data.exportedAt = new Date().toISOString();
    setStore(reconcile(data));
    setSelectedRecordId(null);
    setIsEditing(false);
    return { success: true };
  };

  const handleFileImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          handleImport(e.target.result);
      };
      reader.readAsText(file);
  }

  // CRUD Forms
  const startNewRecord = () => {
    setSelectedRecordId(null);
    setEditForm({ title: '', status: STATUS.DRAFT, bpm: 120, bars: 4, notes: '' });
    setEditErrors({});
    setIsEditing(true);
  };

  const startEditRecord = (record) => {
    setSelectedRecordId(record.id);
    setEditForm({ ...record });
    setEditErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const deleteRecord = (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    pushUndoState();
    setStore('records', records => records.filter(r => r.id !== id));
    if (selectedRecordId() === id) {
      setSelectedRecordId(null);
      setIsEditing(false);
    }
  };

  const moveRecord = (id, direction) => {
    const index = store.records.findIndex(r => r.id === id);
    if (index === -1) return;
    if (direction === 'up' && index > 0) {
      pushUndoState();
      const newRecords = [...store.records];
      [newRecords[index - 1], newRecords[index]] = [newRecords[index], newRecords[index - 1]];
      setStore('records', newRecords);
    } else if (direction === 'down' && index < store.records.length - 1) {
      pushUndoState();
      const newRecords = [...store.records];
      [newRecords[index + 1], newRecords[index]] = [newRecords[index], newRecords[index + 1]];
      setStore('records', newRecords);
    }
  };

  const saveRecord = (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm().title.trim()) errors.title = "Title is required";
    if (editForm().bpm < 40 || editForm().bpm > 300) errors.bpm = "BPM must be between 40 and 300";
    if (editForm().bars < 1 || editForm().bars > 64) errors.bars = "Bars must be between 1 and 64";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    pushUndoState();

    if (selectedRecordId()) {
      // Edit existing
      setStore('records', r => r.id === selectedRecordId(), {
        title: editForm().title,
        status: editForm().status,
        bpm: Number(editForm().bpm),
        bars: Number(editForm().bars),
        notes: editForm().notes
      });
    } else {
      // Create new
      const newRec = {
        id: generateId(),
        scenarioState: SCENARIO_STATE.IDLE,
        title: editForm().title,
        status: editForm().status,
        bpm: Number(editForm().bpm),
        bars: Number(editForm().bars),
        notes: editForm().notes
      };
      setStore('records', [newRec, ...store.records]);
      setSelectedRecordId(newRec.id);
    }

    setIsEditing(false);
  };

  return (
    <div class="min-h-screen bg-neutral-100 text-neutral-900 p-4 font-sans">
      <header class="mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 class="text-2xl font-bold">Music Practice Loop Composer</h1>
          <p class="text-sm text-neutral-500">Scenario Weaver - Spotify Playlists</p>
        </div>
        <div class="space-x-2">
          <button onClick={handleUndo} disabled={undoStack().length === 0} class="px-3 py-1 bg-neutral-200 rounded disabled:opacity-50">Undo (Cmd+Z)</button>
          <button onClick={handleExport} class="px-3 py-1 bg-blue-600 text-white rounded">Export</button>
          <label class="px-3 py-1 bg-green-600 text-white rounded cursor-pointer inline-block text-center">
            Import
            <input type="file" accept=".json" class="hidden" onChange={handleFileImport} />
          </label>
        </div>
      </header>

      <div class="flex flex-col md:flex-row gap-6">
        {/* Main Collection */}
        <div class="flex-1 bg-white p-4 rounded-lg shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Segments ({store.records.length})</h2>
            <div class="flex gap-2">
              <button onClick={startNewRecord} class="px-3 py-1 bg-neutral-800 text-white rounded text-sm">+ New</button>
              <select
                value={filterStatus()}
                onChange={e => setFilterStatus(e.target.value)}
                class="border rounded p-1 text-sm"
              >
                <option value="all">All</option>
                <option value={STATUS.EMPTY}>Empty</option>
                <option value={STATUS.DRAFT}>Draft</option>
                <option value={STATUS.READY}>Ready</option>
                <option value={STATUS.CHANGED}>Changed</option>
                <option value={STATUS.ARCHIVED}>Archived</option>
              </select>
            </div>
          </div>

          <div class="space-y-2 h-[600px] overflow-y-auto pr-2 relative">
            <Show when={filteredRecords().length === 0}>
              <div class="text-center p-8 text-neutral-500">No segments found.</div>
            </Show>

            <For each={filteredRecords()}>
              {(record) => (
                <div
                  class={`p-3 border rounded transition-all ${selectedRecordId() === record.id ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1 cursor-pointer" onClick={() => setSelectedRecordId(record.id)}>
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-lg">{record.title}</span>
                        <span class={`text-xs px-2 py-0.5 rounded ${record.status === STATUS.READY ? 'bg-green-100 text-green-800' : 'bg-neutral-200'}`}>
                          {record.status}
                        </span>
                      </div>
                      <div class="text-sm text-neutral-500 mt-1">
                        BPM: {record.bpm} | Bars: {record.bars}
                      </div>
                    </div>
                    <div class="flex flex-col gap-1 items-end ml-2">
                       <div class="flex gap-1">
                         <button onClick={() => moveRecord(record.id, 'up')} class="p-1 hover:bg-neutral-200 rounded text-xs" title="Move Up">↑</button>
                         <button onClick={() => moveRecord(record.id, 'down')} class="p-1 hover:bg-neutral-200 rounded text-xs" title="Move Down">↓</button>
                       </div>
                       <div class="flex gap-2 text-xs mt-1">
                         <button onClick={() => startEditRecord(record)} class="text-blue-600 hover:underline">Edit</button>
                         <button onClick={() => deleteRecord(record.id)} class="text-red-600 hover:underline">Del</button>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Inspector / Form Panel */}
        <div class="w-full md:w-96 flex flex-col gap-4">
          <Show when={isEditing()}>
            <div class="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
               <h2 class="text-xl font-semibold mb-4">{selectedRecordId() ? 'Edit Segment' : 'New Segment'}</h2>
               <form onSubmit={saveRecord} class="space-y-3">
                 <div>
                   <label class="block text-sm font-medium mb-1">Title</label>
                   <input
                     type="text"
                     value={editForm().title}
                     onInput={e => setEditForm({...editForm(), title: e.target.value})}
                     class={`w-full border p-2 rounded ${editErrors().title ? 'border-red-500' : ''}`}
                   />
                   <Show when={editErrors().title}><p class="text-red-500 text-xs mt-1">{editErrors().title}</p></Show>
                 </div>

                 <div class="grid grid-cols-2 gap-3">
                   <div>
                     <label class="block text-sm font-medium mb-1">Status</label>
                     <select
                       value={editForm().status}
                       onChange={e => setEditForm({...editForm(), status: e.target.value})}
                       class="w-full border p-2 rounded"
                     >
                       <option value={STATUS.EMPTY}>Empty</option>
                       <option value={STATUS.DRAFT}>Draft</option>
                       <option value={STATUS.READY}>Ready</option>
                       <option value={STATUS.CHANGED}>Changed</option>
                       <option value={STATUS.ARCHIVED}>Archived</option>
                     </select>
                   </div>
                   <div>
                     <label class="block text-sm font-medium mb-1">BPM (40-300)</label>
                     <input
                       type="number"
                       value={editForm().bpm}
                       onInput={e => setEditForm({...editForm(), bpm: parseInt(e.target.value) || 0})}
                       class={`w-full border p-2 rounded ${editErrors().bpm ? 'border-red-500' : ''}`}
                     />
                     <Show when={editErrors().bpm}><p class="text-red-500 text-xs mt-1">{editErrors().bpm}</p></Show>
                   </div>
                 </div>

                 <div>
                    <label class="block text-sm font-medium mb-1">Bars (1-64)</label>
                     <input
                       type="number"
                       value={editForm().bars}
                       onInput={e => setEditForm({...editForm(), bars: parseInt(e.target.value) || 0})}
                       class={`w-full border p-2 rounded ${editErrors().bars ? 'border-red-500' : ''}`}
                     />
                     <Show when={editErrors().bars}><p class="text-red-500 text-xs mt-1">{editErrors().bars}</p></Show>
                 </div>

                 <div>
                   <label class="block text-sm font-medium mb-1">Notes</label>
                   <textarea
                     value={editForm().notes}
                     onInput={e => setEditForm({...editForm(), notes: e.target.value})}
                     class="w-full border p-2 rounded h-20"
                   ></textarea>
                 </div>

                 <div class="flex gap-2 justify-end pt-2">
                   <button type="button" onClick={cancelEdit} class="px-3 py-1 bg-neutral-200 rounded">Cancel</button>
                   <button type="submit" class="px-3 py-1 bg-neutral-800 text-white rounded">Save</button>
                 </div>
               </form>
            </div>
          </Show>

          <Show when={!isEditing()}>
            <div class="bg-white p-4 rounded-lg shadow-sm flex flex-col flex-1 h-[600px]">
              <h2 class="text-xl font-semibold mb-4">Scenario Weaver</h2>

              <Show
                when={selectedRecord()}
                fallback={<div class="text-neutral-500 flex-1 flex items-center justify-center">Select a segment to weave scenarios</div>}
              >
                {(record) => (
                  <div class="flex flex-col h-full">
                    <div class="mb-6">
                      <h3 class="font-medium text-lg text-blue-900">{record().title}</h3>
                      <div class="mt-2 space-y-2 text-sm bg-blue-50 p-3 rounded border border-blue-100">
                        <p><span class="text-neutral-500 font-medium">Status:</span> {record().status}</p>
                        <p><span class="text-neutral-500 font-medium">Scenario State:</span> {record().scenarioState}</p>
                        <p><span class="text-neutral-500 font-medium">BPM:</span> {record().bpm}</p>
                        <p><span class="text-neutral-500 font-medium">Notes:</span> {record().notes}</p>
                      </div>
                    </div>

                    <div class="bg-purple-50 p-4 rounded mb-6 border border-purple-100 flex-1">
                      <p class="text-sm font-semibold mb-2 text-purple-900">Derived State Summary</p>
                      <p class="text-sm text-purple-800">{store.derived.summary}</p>
                    </div>

                    <div class="mt-auto pt-4 border-t border-neutral-100">
                      <button
                        onClick={handleBranchScenario}
                        class="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm focus:ring-2 focus:ring-purple-300 outline-none"
                      >
                        Branch into Scenario
                      </button>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
