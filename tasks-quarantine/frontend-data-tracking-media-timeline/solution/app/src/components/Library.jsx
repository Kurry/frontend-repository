import { For, Show, createMemo, createSignal } from "solid-js";
import { VList } from "virtua/solid";
import {
  state,
  setState,
  CATEGORIES,
  libraryRowsWithLeaving,
  cataloguedCount,
  inViewCount,
  density,
  toggleSelection,
  toggleCategory,
  setSort,
  clearFilters,
  selectEvent,
} from "../store";
import { CATEGORY_COLOR } from "../data";
import { fmtYear } from "../format";
import DensityStrip from "./DensityStrip";
import SelectionTray from "./SelectionTray";
import { IconSearch, IconEdit, IconArrowUp, IconArrowDown, IconFilterOff, IconPlus } from "@tabler/icons-solidjs";

export default function Library(props) {
  const rows = libraryRowsWithLeaving;
  const leavingSet = createMemo(() => new Set(state.leaving));

  return (
    <div class="flex-1 flex flex-col min-w-0 bg-[color:var(--paper)]">
      {/* readouts */}
      <div class="shrink-0 px-4 py-3 border-b border-[color:var(--line)] flex flex-wrap items-center gap-x-4 gap-y-1">
        <h2 class="font-display text-lg font-semibold tracking-tight">Library / Filter</h2>
        <span class="text-sm text-[color:var(--ink-soft)]" aria-live="polite">
          Showing <span class="font-semibold text-[color:var(--ink)]">{inViewCount()}</span> of <span class="font-semibold text-[color:var(--ink)]">{cataloguedCount()}</span> catalogued events
        </span>
        <span class="text-sm text-[color:var(--ink-soft)]">
          <span class="font-display tabular-nums text-[color:var(--ink)]">{inViewCount()}</span> events in view
        </span>
      </div>

      <div class="shrink-0 px-4 py-2 border-b border-[color:var(--line)]">
        <DensityStrip enabled={() => state.enabledCategories} />
      </div>

      <SelectionTray />

      {/* list */}
      <div class="flex-1 min-h-0 relative">
        <Show
          when={rows().length > 0}
          fallback={
            <div class="anim-fade absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
              <p class="font-display text-xl text-[color:var(--ink)]">No events match</p>
              <p class="text-sm text-[color:var(--ink-soft)] max-w-sm">
                Your current categories, search, or year window exclude every event. Clear the filters to restore the corpus, or create a new event to add to the timeline.
              </p>
              <div class="flex gap-2">
                <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium" onClick={() => clearFilters()}>
                  <IconFilterOff size={16} /> Clear filters
                </button>
                <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg bg-[#1b6b4a] text-white px-3 py-2 text-sm font-medium hover:brightness-110" onClick={() => props.onCreate && props.onCreate()}>
                  <IconPlus size={16} /> Create event
                </button>
              </div>
            </div>
          }
        >
          <VList data={rows()} class="thin-scroll h-full" itemSize={64}>
            {(row) => {
              const isUser = () => row.source !== "corpus";
              const leaving = () => leavingSet().has(row.id);
              const selected = () => state.selection.includes(row.id);
              const primary = () => row.categories[0];
              return (
                <div
                  class={`row-hover flex items-center gap-3 px-4 border-b border-[color:var(--line)] ${leaving() ? "anim-row-out" : "anim-row-in"}`}
                  style={{ height: "64px", "border-left": `4px solid ${CATEGORY_COLOR[primary()] || "#888"}` }}
                >
                  <Show when={isUser()}>
                    <input
                      type="checkbox"
                      class="w-4 h-4 shrink-0 accent-[#1b6b4a]"
                      checked={selected()}
                      onChange={() => toggleSelection(row.id)}
                      aria-label={`Select ${row.title}`}
                    />
                  </Show>
                  <Show when={!isUser()}>
                    <span class="w-4 shrink-0" aria-hidden="true" />
                  </Show>
                  <button class="flex-1 min-w-0 text-left" onClick={() => selectEvent(row.id)}>
                    <div class="flex items-baseline gap-2 min-w-0">
                      <span class="truncate font-medium text-[color:var(--ink)]">{row.title}</span>
                      <span class="shrink-0 text-[10px] uppercase tracking-wide rounded bg-[color:var(--paper-deep)] px-1.5 py-0.5 text-[color:var(--ink-soft)]">{row.type}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-[color:var(--ink-soft)] mt-0.5">
                      <span class="font-display tabular-nums">{fmtYear(row.year)}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span class="truncate">{row.place}</span>
                    </div>
                  </button>
                  <div class="flex items-center gap-1 shrink-0">
                    <For each={row.categories.slice(0, 2)}>
                      {(c) => <span class="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLOR[c] }} title={c} />}
                    </For>
                    <Show when={isUser()}>
                      <button class="chrome-btn rounded-md p-1.5 hover:bg-[color:var(--paper-deep)]" onClick={() => props.onEditEvent && props.onEditEvent(row)} aria-label={`Edit ${row.title}`}>
                        <IconEdit size={15} />
                      </button>
                    </Show>
                    <Show when={!isUser()}>
                      <span class="text-[10px] text-[color:var(--ink-soft)] border border-[color:var(--line)] rounded px-1.5 py-0.5" title="Seeded read-only event">seeded</span>
                    </Show>
                  </div>
                </div>
              );
            }}
          </VList>
        </Show>
      </div>
    </div>
  );
}

// Filter sidebar kept as a named export for App composition
export function FilterSidebar() {
  return (
    <aside class="w-64 shrink-0 bg-[color:var(--paper-deep)] border-r border-[color:var(--line)] p-4 overflow-y-auto thin-scroll flex flex-col" aria-label="Filters">
      <div class="relative mb-3">
        <IconSearch size={16} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--ink-soft)]" />
        <input
          type="search"
          aria-label="Search events by title, place, or summary"
          placeholder="Search title, place, summary"
          class="w-full rounded-lg border border-[color:var(--line)] bg-white pl-8 pr-2 py-2 text-sm outline-none focus:border-[color:var(--focus)]"
          value={state.search}
          onInput={(e) => setState("search", e.currentTarget.value)}
        />
      </div>

      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">Year sort</h3>
      </div>
      <div class="flex rounded-lg border border-[color:var(--line)] overflow-hidden mb-4">
        <button class={`chrome-btn flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium ${state.sort === "asc" ? "bg-[#1b6b4a] text-white" : "bg-white"}`} onClick={() => setSort("asc")} aria-pressed={state.sort === "asc"}>
          <IconArrowUp size={14} /> Year ascending
        </button>
        <button class={`chrome-btn flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium ${state.sort === "desc" ? "bg-[#1b6b4a] text-white" : "bg-white"}`} onClick={() => setSort("desc")} aria-pressed={state.sort === "desc"}>
          <IconArrowDown size={14} /> Year descending
        </button>
      </div>

      <h3 class="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-soft)] mb-2">Categories</h3>
      <div class="flex flex-col gap-1 flex-1">
        <For each={CATEGORIES}>
          {(c) => {
            const on = () => state.enabledCategories.includes(c.id);
            return (
              <label class="flex items-center gap-2 text-sm cursor-pointer rounded-md px-1.5 py-1 row-hover">
                <input type="checkbox" class="w-4 h-4 shrink-0 accent-[#1b6b4a]" checked={on()} onChange={() => toggleCategory(c.id)} aria-label={`Toggle ${c.id} category`} />
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span class="flex-1 truncate">{c.id}</span>
                <span class="font-display tabular-nums text-xs text-[color:var(--ink-soft)]">{density()[c.id] || 0}</span>
              </label>
            );
          }}
        </For>
      </div>
      <button class="chrome-btn mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium" onClick={() => clearFilters()}>
        <IconFilterOff size={16} /> Clear filters
      </button>
    </aside>
  );
}
