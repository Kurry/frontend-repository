import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { createForm } from "@tanstack/solid-form";
import { z } from "zod";

const schemaVersion = 'v1';

const generateId = () => Math.random().toString(36).substr(2, 9);

const NodeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']),
});

const createInitialState = () => {
  const records = Array.from({ length: 100 }, (_, i) => ({
    id: `node-${i}`,
    title: `Node ${i}`,
    status: i % 10 === 0 ? 'empty' : i % 7 === 0 ? 'conflict' : i % 5 === 0 ? 'changed' : 'draft',
    content: `Content for node ${i}`,
    links: [],
  }));
  return {
    schemaVersion,
    exportedAt: new Date().toISOString(),
    records,
    derived: {
      summary: { total: 100, conflicts: 14 }
    },
    history: [],
  };
};

export default function App() {
  const [state, setState] = createStore(createInitialState());
  const [selectedId, setSelectedId] = createSignal(null);
  const [isEditing, setIsEditing] = createSignal(false);
  const [isCreating, setIsCreating] = createSignal(false);

  const updateDerived = () => {
    const total = state.records.length;
    const conflicts = state.records.filter(r => r.status === 'conflict').length;
    setState('derived', { summary: { total, conflicts } });
  };

  const recoverNode = (id) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return;
    const oldRecord = state.records[recordIndex];
    if (oldRecord.status !== 'conflict') return;

    setState('history', h => [...h, { type: 'RECOVER_NODE', payload: { id, oldStatus: oldRecord.status } }]);
    setState('records', recordIndex, 'status', 'resolved');
    updateDerived();
  };

  const undo = () => {
    if (state.history.length === 0) return;
    const lastAction = state.history[state.history.length - 1];
    if (lastAction.type === 'RECOVER_NODE') {
      const recordIndex = state.records.findIndex(r => r.id === lastAction.payload.id);
      if (recordIndex !== -1) {
        setState('records', recordIndex, 'status', lastAction.payload.oldStatus);
        setState('history', h => h.slice(0, -1));
        updateDerived();
      }
    } else if (lastAction.type === 'CREATE_NODE') {
      setState('records', r => r.filter(x => x.id !== lastAction.payload.id));
      setState('history', h => h.slice(0, -1));
      updateDerived();
    } else if (lastAction.type === 'UPDATE_NODE') {
      const recordIndex = state.records.findIndex(r => r.id === lastAction.payload.id);
      if (recordIndex !== -1) {
         setState('records', recordIndex, reconcile(lastAction.payload.oldRecord));
         setState('history', h => h.slice(0, -1));
         updateDerived();
      }
    } else if (lastAction.type === 'DELETE_NODE') {
       setState('records', r => [...r, lastAction.payload.record]);
       setState('history', h => h.slice(0, -1));
       updateDerived();
    }
  };

  const exportData = () => {
    const data = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiction-branches-v1-recovery-board.json';
    a.click();
    URL.revokeObjectURL(url);
    return data;
  };

  const importDataStr = (str) => {
    try {
        const data = JSON.parse(str);
        if (data.schemaVersion === 'v1' && Array.isArray(data.records)) {
            setState(reconcile({
                ...data,
                exportedAt: new Date().toISOString()
            }));
            updateDerived();
        }
      } catch (err) {
        console.error('Import failed', err);
      }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        importDataStr(e.target.result);
    };
    reader.readAsText(file);
  };

  const createNode = (data) => {
      const id = generateId();
      const newRecord = { id, title: data.title, content: data.content, status: data.status, links: [] };
      setState('records', r => [...r, newRecord]);
      setState('history', h => [...h, { type: 'CREATE_NODE', payload: { id }}]);
      updateDerived();
      setIsCreating(false);
  };

  const updateNode = (data) => {
      const recordIndex = state.records.findIndex(r => r.id === selectedId());
      if (recordIndex !== -1) {
         const oldRecord = { ...state.records[recordIndex] };
         setState('records', recordIndex, reconcile({ ...oldRecord, ...data }));
         setState('history', h => [...h, { type: 'UPDATE_NODE', payload: { id: selectedId(), oldRecord }}]);
         updateDerived();
      }
      setIsEditing(false);
  };

  onMount(() => {
    const handleCreate = (e) => {
       const newRecord = { id: e.detail.id, title: e.detail.title, content: e.detail.content || '', status: 'draft', links: [] };
       setState('records', r => [...r, newRecord]);
       setState('history', h => [...h, { type: 'CREATE_NODE', payload: { id: e.detail.id }}]);
       updateDerived();
    };
    const handleSelect = (e) => {
       setSelectedId(e.detail.id);
    };
    const handleUpdate = (e) => {
       const recordIndex = state.records.findIndex(r => r.id === e.detail.id);
       if (recordIndex !== -1) {
         const oldRecord = { ...state.records[recordIndex] };
         setState('records', recordIndex, reconcile({ ...oldRecord, ...e.detail }));
         setState('history', h => [...h, { type: 'UPDATE_NODE', payload: { id: e.detail.id, oldRecord }}]);
         updateDerived();
       }
    };
    const handleDelete = (e) => {
       const recordIndex = state.records.findIndex(r => r.id === e.detail.id);
       if (recordIndex !== -1 && e.detail.confirm) {
         const record = { ...state.records[recordIndex] };
         setState('records', r => r.filter(x => x.id !== e.detail.id));
         setState('history', h => [...h, { type: 'DELETE_NODE', payload: { record }}]);
         updateDerived();
       }
    };
    const handleExport = (e) => {
        e.detail.resolve(exportData());
    };
    const handleImport = (e) => {
        importDataStr(e.detail.data);
    };

    window.addEventListener('webmcp-entity-create', handleCreate);
    window.addEventListener('webmcp-entity-select', handleSelect);
    window.addEventListener('webmcp-entity-update', handleUpdate);
    window.addEventListener('webmcp-entity-delete', handleDelete);
    window.addEventListener('webmcp-artifact-export', handleExport);
    window.addEventListener('webmcp-artifact-import', handleImport);

    const handleKeyDown = (e) => {
       if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
           e.preventDefault();
           undo();
       }
    };
    window.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
       window.removeEventListener('webmcp-entity-create', handleCreate);
       window.removeEventListener('webmcp-entity-select', handleSelect);
       window.removeEventListener('webmcp-entity-update', handleUpdate);
       window.removeEventListener('webmcp-entity-delete', handleDelete);
       window.removeEventListener('webmcp-artifact-export', handleExport);
       window.removeEventListener('webmcp-artifact-import', handleImport);
       window.removeEventListener('keydown', handleKeyDown);
    });
  });

  const form = createForm(() => {
    const selectedRecord = state.records.find(r => r.id === selectedId());
    const isEdit = isEditing();

    return {
      defaultValues: {
        title: isEdit ? selectedRecord?.title || '' : '',
        content: isEdit ? selectedRecord?.content || '' : '',
        status: isEdit ? selectedRecord?.status || 'draft' : 'draft',
      },
      onSubmit: async ({ value }) => {
        try {
           NodeSchema.parse(value);
           if (isEdit) {
               updateNode(value);
           } else {
               createNode(value);
           }
        } catch (e) {
            console.error(e);
        }
      },
    };
  });

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
        <aside class="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-auto md:h-screen shrink-0">
            <h1 class="text-xl font-bold mb-4">Recovery Board Tool</h1>
            <div class="mb-4 bg-gray-100 p-3 rounded">
                <h2 class="text-xs font-semibold uppercase text-gray-500 mb-1">Derived Summary</h2>
                <p class="text-sm text-gray-800">Total Nodes: {state.derived.summary.total}</p>
                <p class="text-sm text-red-600 font-medium">Conflicts: {state.derived.summary.conflicts}</p>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                <button onClick={undo} disabled={state.history.length === 0} class="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-blue-500 outline-none">Undo</button>
                <button onClick={exportData} class="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 outline-none">Export</button>
                <label class="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm cursor-pointer text-center hover:bg-green-700 transition-colors focus:ring-2 focus:ring-green-500 outline-none">
                    Import
                    <input type="file" accept=".json" onChange={importData} class="hidden" />
                </label>
                <button onClick={() => { setIsCreating(true); setIsEditing(false); }} class="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 outline-none mt-2">Create Node</button>
            </div>
            <div class="flex-1 overflow-y-auto hidden md:block">
               <h2 class="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wider">Nodes</h2>
               <div class="flex flex-col gap-1 pr-2">
                   <For each={state.records}>
                       {(record) => (
                           <button
                            onClick={() => { setSelectedId(record.id); setIsEditing(false); setIsCreating(false); }}
                            class={`text-left px-3 py-2 text-sm rounded transition-colors focus:ring-2 focus:ring-blue-500 outline-none ${selectedId() === record.id ? 'bg-blue-100 text-blue-900 shadow-inner' : 'hover:bg-gray-100'} ${record.status === 'conflict' ? 'border-l-4 border-red-500' : 'border-l-4 border-transparent'}`}
                           >
                            <span class="truncate block w-full font-medium">{record.title}</span>
                            <span class="text-xs text-gray-500">{record.status}</span>
                           </button>
                       )}
                   </For>
               </div>
            </div>
        </aside>
        <main class="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50" style="perspective: 1000px;">
            <div class="max-w-5xl mx-auto">
               <div class="flex justify-between items-center mb-6">
                 <h2 class="text-2xl font-semibold text-gray-800">Recovery Board</h2>
                 <p class="text-sm text-gray-500 md:hidden">{state.derived.summary.conflicts} conflicts remaining</p>
               </div>

               <Show when={isCreating() || isEditing()}>
                 <div class="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
                    <h3 class="text-lg font-bold mb-4">{isEditing() ? 'Edit Node' : 'Create Node'}</h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                      }}
                      class="flex flex-col gap-4"
                    >
                        <form.Field
                          name="title"
                          validators={{ onChange: z.string().min(1, "Title is required") }}
                          children={(field) => (
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={field().state.value}
                                  onBlur={field().handleBlur}
                                  onInput={(e) => field().handleChange(e.target.value)}
                                />
                                <Show when={field().state.meta.errors.length}>
                                    <p class="text-red-500 text-xs mt-1">{field().state.meta.errors.join(", ")}</p>
                                </Show>
                            </div>
                          )}
                        />

                        <form.Field
                          name="content"
                          validators={{ onChange: z.string().min(1, "Content is required") }}
                          children={(field) => (
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                  value={field().state.value}
                                  onBlur={field().handleBlur}
                                  onInput={(e) => field().handleChange(e.target.value)}
                                />
                                <Show when={field().state.meta.errors.length}>
                                    <p class="text-red-500 text-xs mt-1">{field().state.meta.errors.join(", ")}</p>
                                </Show>
                            </div>
                          )}
                        />

                        <form.Field
                          name="status"
                          children={(field) => (
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                  value={field().state.value}
                                  onBlur={field().handleBlur}
                                  onChange={(e) => field().handleChange(e.target.value)}
                                >
                                    <option value="empty">empty</option>
                                    <option value="draft">draft</option>
                                    <option value="ready">ready</option>
                                    <option value="changed">changed</option>
                                    <option value="archived">archived</option>
                                    <option value="conflict">conflict</option>
                                    <option value="resolved">resolved</option>
                                </select>
                            </div>
                          )}
                        />

                        <div class="flex gap-2 justify-end mt-4">
                           <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} class="px-4 py-2 bg-gray-200 text-gray-800 rounded">Cancel</button>
                           <form.Subscribe
                             selector={(s) => s.canSubmit}
                             children={(canSubmit) => (
                               <button type="submit" disabled={!canSubmit()} class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save</button>
                             )}
                           />
                        </div>
                    </form>
                 </div>
               </Show>

               <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
                    <For each={state.records.filter(r => r.status === 'conflict' || selectedId() === r.id)}>
                        {(record) => (
                            <div
                                class={`p-5 rounded-lg shadow-sm border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${record.status === 'conflict' ? 'bg-red-50 border-red-300 transform' : record.status === 'resolved' ? 'bg-green-50 border-green-300 transform scale-[0.98]' : 'bg-white border-gray-200'} ${selectedId() === record.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            >
                                <div class="flex justify-between items-start mb-3">
                                   <h3 class="font-bold text-lg text-gray-900">{record.title}</h3>
                                   <span class={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold ${record.status === 'conflict' ? 'bg-red-100 text-red-800' : record.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                       {record.status}
                                   </span>
                                </div>
                                <p class="text-sm text-gray-600 mb-5 min-h-[3rem]">{record.content}</p>
                                <div class="flex items-center justify-end gap-2">
                                    <Show when={record.status !== 'conflict'}>
                                        <button
                                            onClick={() => { setSelectedId(record.id); setIsEditing(true); setIsCreating(false); }}
                                            class="text-sm px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-500 outline-none font-medium"
                                        >
                                            Edit Node
                                        </button>
                                    </Show>
                                    <Show when={record.status === 'conflict'}>
                                        <button
                                            onClick={() => recoverNode(record.id)}
                                            class="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none font-medium"
                                        >
                                            Recover Node
                                        </button>
                                    </Show>
                                </div>
                            </div>
                        )}
                    </For>
               </div>

               <Show when={state.records.filter(r => r.status === 'conflict' || selectedId() === r.id).length === 0 && !isCreating()}>
                   <div class="text-center py-20">
                       <p class="text-gray-500 text-lg">No conflicts or selected nodes.</p>
                       <p class="text-gray-400 text-sm mt-2">Select a node from the sidebar to view details, or create a new one.</p>
                   </div>
               </Show>
            </div>
        </main>
    </div>
  );
}
