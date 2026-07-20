import { createSignal, createEffect, Show, onMount } from 'solid-js';
import { state, setState, undo, redo } from './store';
import { MT_DATA } from './data';
import TimelineStage from './components/TimelineStage';
import Scrubber from './components/Scrubber';
import Library from './components/Library';
import EventForm from './components/EventForm';
import ExportDrawer from './components/ExportDrawer';
import ImportDialog from './components/ImportDialog';
import { registerWebMCP } from './webmcp';

export default function App() {
  const [formOpen, setFormOpen] = createSignal(false);
  const [editingEvent, setEditingEvent] = createSignal(null);
  const [importOpen, setImportOpen] = createSignal(false);

  onMount(() => {
    registerWebMCP();
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (state.redoHistory.length) redo();
        } else {
          e.preventDefault();
          if (state.undoHistory.length) undo();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  });

  const openEdit = (ev) => {
    setEditingEvent(ev);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEvent(null);
  };

  return (
    <div class="h-screen w-screen flex flex-col overflow-hidden text-gray-900 selection:bg-cyan-200">
      {/* Header */}
      <header class="h-16 flex items-center justify-between px-6 bg-white border-b shrink-0 z-20 shadow-sm relative">
        <h1 class="text-xl font-bold tracking-tight">MediaTimeline <span class="text-gray-400 font-normal ml-2 hidden sm:inline">History of Media & Communication</span></h1>
        
        <div class="flex items-center gap-3">
          <Show when={state.lastMutation}>
            <div class="text-xs font-mono bg-cyan-50 text-cyan-800 px-2 py-1 rounded hidden sm:block">
              {state.lastMutation}
            </div>
          </Show>
          
          <div class="flex items-center border rounded overflow-hidden">
            <button 
              class={`px-4 py-1.5 text-sm font-medium transition-colors ${state.activeMode === 'scrub' ? 'bg-cyan-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => setState('activeMode', 'scrub')}
            >
              Scrub/Explore
            </button>
            <button 
              class={`px-4 py-1.5 text-sm font-medium transition-colors ${state.activeMode === 'library' ? 'bg-cyan-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => setState('activeMode', 'library')}
            >
              Library/Filter
            </button>
          </div>

          <div class="h-6 w-px bg-gray-200 mx-1"></div>

          <button onClick={() => undo()} disabled={!state.undoHistory.length} class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          </button>
          <button onClick={() => redo()} disabled={!state.redoHistory.length} class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Ctrl+Shift+Z)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
          </button>
          
          <div class="h-6 w-px bg-gray-200 mx-1"></div>
          
          <button onClick={() => setFormOpen(true)} class="px-3 py-1.5 bg-gray-100 text-sm font-medium rounded hover:bg-gray-200">
            Create
          </button>
          <button onClick={() => setState('exportDrawerOpen', true)} class="px-3 py-1.5 bg-gray-100 text-sm font-medium rounded hover:bg-gray-200">
            Export timeline
          </button>
          <button onClick={() => setImportOpen(true)} class="px-3 py-1.5 bg-gray-100 text-sm font-medium rounded hover:bg-gray-200">
            Import
          </button>
        </div>
      </header>

      {/* Main content */}
      <main class="flex-1 flex overflow-hidden relative">
        <Show when={state.activeMode === 'scrub'}>
           <div class="flex-1 flex flex-col">
              <TimelineStage />
              <div class="h-24 bg-white border-t p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                 <Scrubber />
              </div>
           </div>
        </Show>

        <Show when={state.activeMode === 'library'}>
           <div class="flex-1 flex overflow-hidden">
              {/* Filter Sidebar */}
              <div class="w-64 bg-gray-50 border-r p-4 overflow-y-auto shrink-0 flex flex-col">
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  class="w-full border rounded p-2 text-sm mb-4"
                  value={state.filters.search}
                  onInput={(e) => setState('filters', 'search', e.target.value)}
                />
                
                <h3 class="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
                <div class="flex flex-col gap-2 flex-1">
                  {MT_DATA.categories.map(cat => (
                    <label class="flex items-center gap-2 text-sm cursor-pointer group">
                      <input 
                        type="checkbox" 
                        class="rounded"
                        checked={state.filters.categories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) setState('filters', 'categories', [...state.filters.categories, cat.id]);
                          else setState('filters', 'categories', state.filters.categories.filter(c => c !== cat.id));
                        }}
                      />
                      <span class="w-3 h-3 rounded-full" style={`background-color: ${cat.color}`}></span>
                      <span class="group-hover:text-cyan-700">{cat.label}</span>
                    </label>
                  ))}
                </div>
                
                <button 
                  class="mt-4 px-4 py-2 bg-white border rounded text-sm hover:bg-gray-50"
                  onClick={() => {
                    setState('filters', 'categories', MT_DATA.categories.map(c => c.id));
                    setState('filters', 'search', '');
                    setState('window', { from: MT_DATA.yearMin, to: MT_DATA.yearMax });
                  }}
                >
                  Clear Filters
                </button>
              </div>
              
              <Library onEditEvent={openEdit} />
           </div>
        </Show>
      </main>

      {/* Modals & Drawers */}
      <Show when={formOpen()}>
         <EventForm initialData={editingEvent()} onClose={closeForm} />
      </Show>

      <Show when={state.exportDrawerOpen}>
         <ExportDrawer onClose={() => setState('exportDrawerOpen', false)} />
      </Show>

      <Show when={importOpen()}>
         <ImportDialog onClose={() => setImportOpen(false)} />
      </Show>
    </div>
  );
}
