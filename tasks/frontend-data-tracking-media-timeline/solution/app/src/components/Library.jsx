import { createSignal, createEffect, For, Show } from 'solid-js';
import { Virtualizer } from 'virtua/solid';
import { state, setState, batchDelete, batchCategorize, deleteEvent } from '../store';
import { formatYear } from '../utils';
import { MT_DATA } from '../data';

export default function Library({ onEditEvent }) {
  const [selectedRows, setSelectedRows] = createSignal(new Set());
  const [batchCatValue, setBatchCatValue] = createSignal('');

  const filteredEvents = () => {
    const q = state.filters.search.trim().toLowerCase();
    const activeCats = new Set(state.filters.categories);
    return state.events.filter((ev) => {
      if (!ev.categories.some((c) => activeCats.has(c))) return false;
      if (!q) return true;
      const hay = `${ev.title} ${ev.place || ''} ${ev.summary || ''}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => {
      const cmp = a.year - b.year || a.title.localeCompare(b.title);
      return state.sort === 'asc' ? cmp : -cmp;
    });
  };

  const toggleRow = (id) => {
    const s = new Set(selectedRows());
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedRows(s);
  };

  const handleBatchDelete = () => {
    const userManagedIds = [...selectedRows()].filter(id => state.events.find(e => e.id === id)?.isUserManaged);
    if (userManagedIds.length > 0 && confirm(`Delete ${userManagedIds.length} events?`)) {
      batchDelete(userManagedIds);
      setSelectedRows(new Set());
    }
  };

  const handleBatchCat = () => {
    const userManagedIds = [...selectedRows()].filter(id => state.events.find(e => e.id === id)?.isUserManaged);
    if (userManagedIds.length > 0 && batchCatValue()) {
      batchCategorize(userManagedIds, batchCatValue());
      setSelectedRows(new Set());
      setBatchCatValue('');
    }
  };

  return (
    <div class="flex-1 flex flex-col h-full bg-white relative">
      <div class="p-4 border-b flex justify-between items-center bg-gray-50">
        <div>
          <p id="showing-of-total-count" class="text-sm font-semibold">Showing {filteredEvents().length} of {state.events.length} catalogued events.</p>
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-sm">Sort: 
            <select class="ml-1 border rounded p-1" value={state.sort} onChange={(e) => setState('sort', e.target.value)}>
              <option value="asc">Year ascending</option>
              <option value="desc">Year descending</option>
            </select>
          </label>
        </div>
      </div>

      <Show when={selectedRows().size > 0}>
        <div class="p-2 bg-blue-50 border-b flex items-center justify-between">
          <span class="text-sm font-medium text-blue-800">{selectedRows().size} selected</span>
          <div class="flex gap-2">
             <select class="text-sm border p-1 rounded bg-white" value={batchCatValue()} onChange={e => setBatchCatValue(e.target.value)}>
               <option value="">Select category...</option>
               <For each={MT_DATA.categories}>{(c) => <option value={c.id}>{c.label}</option>}</For>
             </select>
             <button onClick={handleBatchCat} class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Batch categorize</button>
             <button onClick={handleBatchDelete} class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Batch delete</button>
          </div>
        </div>
      </Show>

      <div class="flex-1 overflow-hidden relative">
        <Show when={filteredEvents().length === 0} fallback={
          <Virtualizer data={filteredEvents()}>
            {(ev) => (
              <div class="flex items-center gap-4 p-3 border-b hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={selectedRows().has(ev.id)}
                  onChange={() => toggleRow(ev.id)}
                  disabled={!ev.isUserManaged}
                />
                <div class="flex-1 min-w-0">
                  <p class="font-bold truncate">{ev.title}</p>
                  <p class="text-sm text-gray-500">{formatYear(ev.year)} · {ev.place}</p>
                </div>
                <div class="w-32 truncate text-sm text-gray-600 hidden md:block">
                  {ev.type}
                </div>
                <div class="w-48 flex flex-wrap gap-1">
                  <For each={ev.categories}>
                    {(c) => {
                      const cat = MT_DATA.categories.find(x => x.id === c);
                      return <span class="text-xs px-2 py-0.5 rounded text-white" style={`background-color: ${cat?.color || '#999'}`}>{cat?.label || c}</span>;
                    }}
                  </For>
                </div>
                <div class="flex gap-2">
                   <Show when={ev.isUserManaged}>
                     <button onClick={() => onEditEvent(ev)} class="text-blue-600 hover:underline text-sm">Edit</button>
                     <button onClick={() => { if(confirm('Delete event?')) deleteEvent(ev.id) }} class="text-red-600 hover:underline text-sm">Delete</button>
                   </Show>
                </div>
              </div>
            )}
          </Virtualizer>
        }>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
             <p>No events found.</p>
             <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => { setState('filters', 'search', ''); setState('filters', 'categories', MT_DATA.categories.map(c=>c.id)); }}>Clear Filters</button>
          </div>
        </Show>
      </div>
    </div>
  );
}
