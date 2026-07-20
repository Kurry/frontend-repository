import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { state, setState } from '../store';
import { MT_DATA } from '../data';
import { formatYear } from '../utils';
import { Popover } from '@kobalte/core/popover';
import { Dialog } from '@kobalte/core/dialog';

const catsById = Object.fromEntries(MT_DATA.categories.map((c) => [c.id, c]));

export default function TimelineStage() {
  let viewportRef;
  const [panX, setPanX] = createSignal(0);

  const filteredEvents = () => {
    const q = state.filters.search.trim().toLowerCase();
    const activeCats = new Set(state.filters.categories);
    return state.events.filter((ev) => {
      if (ev.year < state.window.from || ev.year > state.window.to) return false;
      if (!ev.categories.some((c) => activeCats.has(c))) return false;
      if (!q) return true;
      const hay = `${ev.title} ${ev.place || ''} ${ev.summary || ''}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  };

  const midPoint = () => (state.window.from + state.window.to) / 2;
  const currentEra = () => {
    return MT_DATA.eras.find((e) => midPoint() >= e.from && midPoint() <= e.to) || MT_DATA.eras[MT_DATA.eras.length - 1];
  };

  const setRange = (from, to, keepPan = false) => {
    let a = Math.max(MT_DATA.yearMin, Math.round(from));
    let b = Math.min(MT_DATA.yearMax, Math.round(to));
    if (b <= a) b = Math.min(MT_DATA.yearMax, a + 1);
    setState('window', { from: a, to: b });
    if (!keepPan) setPanX(0);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const span = state.window.to - state.window.from;
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const dx = e.deltaX || e.deltaY;
      const yearDelta = (dx / (viewportRef?.clientWidth || 800)) * span;
      setRange(state.window.from + yearDelta, state.window.to + yearDelta, true);
      return;
    }
    const zoom = e.deltaY > 0 ? 1.12 : 0.9;
    const mid = midPoint();
    const half = Math.max(15, Math.min((MT_DATA.yearMax - MT_DATA.yearMin) / 2, (span * zoom) / 2));
    setRange(mid - half, mid + half);
  };

  onMount(() => {
    if (viewportRef) {
      viewportRef.addEventListener('wheel', handleWheel, { passive: false });
    }
  });
  
  onCleanup(() => {
    if (viewportRef) {
      viewportRef.removeEventListener('wheel', handleWheel);
    }
  });

  return (
    <div class="relative flex-1 overflow-hidden bg-slate-50 flex flex-col" ref={viewportRef}>
      <div class="absolute top-4 left-4 z-10 flex gap-2">
        <div class="bg-white/80 px-3 py-1 rounded shadow text-sm font-medium">
          <span id="current-era-label">{currentEra()?.label}</span>
        </div>
        <div class="bg-white/80 px-3 py-1 rounded shadow text-sm font-medium">
          <span id="events-in-view-count">{filteredEvents().length} events in view</span>
        </div>
      </div>
      
      <div class="absolute inset-0 pointer-events-none">
        <For each={MT_DATA.eras}>
          {(era) => {
            if (era.to < state.window.from || era.from > state.window.to) return null;
            const w = viewportRef ? viewportRef.clientWidth : 800;
            const span = state.window.to - state.window.from || 1;
            const x0 = ((Math.max(era.from, state.window.from) - state.window.from) / span) * w + panX();
            const x1 = ((Math.min(era.to, state.window.to) - state.window.from) / span) * w + panX();
            return (
              <div class="absolute top-0 bottom-0 opacity-10" style={`left: ${x0}px; width: ${Math.max(0, x1 - x0)}px; background-color: ${era.tint}`}></div>
            );
          }}
        </For>
      </div>

      <div class="relative w-full h-full mt-24">
        <For each={filteredEvents()}>
          {(ev, idx) => {
             const w = viewportRef ? viewportRef.clientWidth : 800;
             const span = state.window.to - state.window.from || 1;
             const x = ((ev.year - state.window.from) / span) * w + panX();
             if (x < -60 || x > w + 60) return null;
             
             const hash = [...ev.id].reduce((a, c) => a + c.charCodeAt(0), 0);
             const h = viewportRef ? viewportRef.clientHeight : 600;
             const base = 0.34 + ((hash % 7) / 7) * 0.24;
             const stagger = (idx() % 5) * 0.042;
             const yRatio = Math.max(0.2, Math.min(0.58, base - stagger));
             const pinY = h * yRatio;
             const color = catsById[ev.categories?.[0]]?.color || '#00838f';
             
             return (
                <button
                  type="button"
                  class={`absolute group transform -translate-x-1/2 -translate-y-full hover:z-50 transition-transform hover:scale-110 focus:outline-none ${state.selectedId === ev.id ? 'z-40 scale-110' : 'z-20'}`}
                  style={`left: ${x}px; top: ${pinY}px;`}
                  onClick={() => setState('selectedId', ev.id)}
                  aria-label={`${ev.title}, ${formatYear(ev.year)}`}
                >
                  <div class="w-4 h-4 rounded-full shadow-md border-2 border-white" style={`background-color: ${color}`}></div>
                  <div class="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-white p-2 rounded shadow-lg text-xs z-50 pointer-events-none">
                    <p class="font-bold">{ev.title}</p>
                    <p class="text-gray-600">{ev.place} · {formatYear(ev.year)}</p>
                  </div>
                </button>
             );
          }}
        </For>
      </div>
      
      <Show when={state.selectedId}>
        <DetailPanel />
      </Show>
    </div>
  );
}

function DetailPanel() {
  const ev = () => state.events.find(e => e.id === state.selectedId);
  
  const handleClose = () => setState('selectedId', null);
  
  const filteredEvents = () => {
    const q = state.filters.search.trim().toLowerCase();
    const activeCats = new Set(state.filters.categories);
    return state.events.filter((e) => {
      if (e.year < state.window.from || e.year > state.window.to) return false;
      if (!e.categories.some((c) => activeCats.has(c))) return false;
      if (!q) return true;
      const hay = `${e.title} ${e.place || ''} ${e.summary || ''}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  };
  
  const step = (dir) => {
    const list = filteredEvents();
    if (!list.length) return;
    const idx = list.findIndex(e => e.id === state.selectedId);
    if (idx === -1) return;
    const next = list[(idx + dir + list.length) % list.length];
    setState('selectedId', next.id);
  };

  createEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <Show when={ev()}>
      <div class="absolute right-4 top-4 bottom-4 w-80 bg-white rounded-lg shadow-2xl p-6 flex flex-col z-50 animate-fade-in" role="dialog" aria-modal="true">
        <button onClick={handleClose} class="absolute top-4 right-4 text-gray-500 hover:text-black">
          ✕
        </button>
        <p class="text-sm text-gray-500 font-mono mb-2">{formatYear(ev().year)} · {ev().place}</p>
        <h2 class="text-xl font-bold mb-1">{ev().title}</h2>
        <p class="text-sm font-semibold text-cyan-700 mb-3">{ev().type}</p>
        
        <div class="flex gap-2 mb-4 flex-wrap">
          <For each={ev().categories}>
            {(c) => <span class="text-xs px-2 py-1 rounded-full text-white" style={`background-color: ${catsById[c]?.color || '#333'}`}>{catsById[c]?.label || c}</span>}
          </For>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <p class="font-medium text-gray-800 mb-4">{ev().summary}</p>
          <div class="text-sm text-gray-600 space-y-2">
            <p><strong>Media Refs:</strong> {ev().mediaRefs?.join('; ')}</p>
            <p><strong>Source:</strong> {ev().source || 'Unknown'}</p>
          </div>
        </div>
        
        <div class="mt-4 flex justify-between pt-4 border-t">
          <button onClick={() => step(-1)} class="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Previous</button>
          <button onClick={() => step(1)} class="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Next</button>
        </div>
      </div>
    </Show>
  );
}
