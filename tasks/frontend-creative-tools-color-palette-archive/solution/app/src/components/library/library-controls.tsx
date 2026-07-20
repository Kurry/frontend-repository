import { undo, redo } from '../../utils/undo-redo';
import { component$, useContext, $ } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import type { Period } from '../../store/types';

export const LibraryControls = component$(() => {
  const store = useContext(GlobalStoreContext);

  const PERIODS: Period[] = [
    "Abstract + Geometric",
    "Americana",
    "Baroque to Neoclassical",
    "Expressionism",
    "Fauvism",
    "Impressionism",
    "Medieval",
    "Modern",
    "Old Masters",
    "Post-Impressionism",
    "Primitive + Folk",
    "Realism",
    "Romanticism",
    "Symbolism",
    "Tonalism"
  ];

  return (
    <div class="palette-library__controls max-w-7xl mx-auto px-4 py-8 flex flex-wrap gap-6 items-center justify-between border-b border-gray-200 mb-8 sticky top-[72px] bg-[#fffaf0] z-40">
      <div class="palette-library__toggle flex gap-4" role="tablist" aria-label="Library views">
        {['nomenclature', 'palette', 'swatch'].map((view) => (
          <button
            key={view}
            type="button"
            class={`palette-library__toggle-option flex items-center gap-2 px-3 py-2 rounded-full border ${store.activeView === view ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'}`}
            onClick$={() => store.activeView = view as any}
            role="tab"
            aria-selected={store.activeView === view}
          >
            <span class="palette-library__toggle-indicator" aria-hidden="true">
              <svg viewBox="0 0 8 8" class="w-3 h-3"><circle cx="4" cy="4" r="3.2" fill={store.activeView === view ? "currentColor" : "transparent"} stroke="currentColor" stroke-width="1"></circle></svg>
            </span>
            <span class="capitalize">{view} View</span>
          </button>
        ))}
      </div>

      <div class="flex gap-4 items-center flex-wrap">
        <div class="flex gap-2">
           <button class="btn btn-sm btn-ghost" disabled={store.undoStack.length === 0} onClick$={() => undo(store)}>Undo</button>
           <button class="btn btn-sm btn-ghost" disabled={store.redoStack.length === 0} onClick$={() => redo(store)}>Redo</button>
        </div>

        <div class="flex gap-2 items-center">
            <label class="font-bold text-sm uppercase tracking-wide" for="VisionSimulation">Vision:</label>
            <select
               id="VisionSimulation"
               class="select select-bordered select-sm rounded-none border-black bg-transparent"
               value={store.visionSimulation}
               onChange$={(e) => store.visionSimulation = (e.target as HTMLSelectElement).value as any}
            >
               <option value="none">None</option>
               <option value="protanopia">Protanopia</option>
               <option value="deuteranopia">Deuteranopia</option>
               <option value="tritanopia">Tritanopia</option>
               <option value="achromatopsia">Achromatopsia</option>
            </select>
        </div>

        <div class="palette-library__filter flex items-center gap-2">
          <label class="palette-library__filter-label font-bold text-sm uppercase tracking-wide" for="PeriodFilter">Filter by Period:</label>
          <select
            id="PeriodFilter"
            class="palette-library__filter-select select select-bordered select-sm rounded-none border-black bg-transparent"
            value={store.periodFilter}
            onChange$={(e) => store.periodFilter = (e.target as HTMLSelectElement).value as any}
          >
            <option value="">All Periods</option>
            {PERIODS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div class="palette-library__sort flex items-center gap-2">
          <label class="font-bold text-sm uppercase tracking-wide" for="NameSort">Sort:</label>
          <select
            id="NameSort"
            class="select select-bordered select-sm rounded-none border-black bg-transparent"
            value={store.nameSort}
            onChange$={(e) => store.nameSort = (e.target as HTMLSelectElement).value as any}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>
    </div>
  );
});
