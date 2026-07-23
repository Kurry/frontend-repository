import { createSignal, Show, onMount, onCleanup } from "solid-js";
import {
  state,
  setState,
  undo,
  redo,
  canUndo,
  canRedo,
  openAbout,
  openImport,
  openExport,
  setMode,
  inViewCount,
} from "./store";
import { registerWebMCP } from "./webmcp";
import TimelineStage from "./components/TimelineStage";
import Scrubber from "./components/Scrubber";
import Library, { FilterSidebar } from "./components/Library";
import DensityStrip from "./components/DensityStrip";
import EventForm from "./components/EventForm";
import DetailPanel from "./components/DetailPanel";
import ExportDrawer from "./components/ExportDrawer";
import ImportDialog from "./components/ImportDialog";
import AboutOverlay from "./components/AboutOverlay";
import BatchConfirm from "./components/BatchConfirm";
import Toasts, { LiveRegion } from "./components/Toasts";
import {
  IconTimeline,
  IconListDetails,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPlus,
  IconFileExport,
  IconFileImport,
  IconInfoCircle,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-solidjs";

export default function App() {
  const [formOpen, setFormOpen] = createSignal(false);
  const [formClosing, setFormClosing] = createSignal(false);
  const [editing, setEditing] = createSignal(null);
  const [filtersOpen, setFiltersOpen] = createSignal(false);

  onMount(() => {
    registerWebMCP();
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.shiftKey) {
          if (canRedo()) { e.preventDefault(); redo(); }
        } else if (canUndo()) {
          e.preventDefault();
          undo();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });

  function openCreate() {
    setEditing(null);
    setFormClosing(false);
    setFormOpen(true);
  }
  function openEdit(ev) {
    setEditing(ev);
    setFormClosing(false);
    setFormOpen(true);
  }
  function closeForm() {
    if (formClosing()) return;
    setFormClosing(true);
    setTimeout(() => {
      setFormOpen(false);
      setEditing(null);
      setTimeout(() => setFormClosing(false), 200);
    }, 180);
  }

  const modeBtn = (mode, label, Icon) => (
    <button
      class={`chrome-btn inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${state.activeMode === mode ? "bg-[#1b6b4a] text-white" : "bg-white text-[color:var(--ink)] hover:bg-[color:var(--paper-deep)]"}`}
      onClick={() => setMode(mode)}
      aria-pressed={state.activeMode === mode}
    >
      <Icon size={17} /> {label}
    </button>
  );

  return (
    <div class="h-screen w-screen flex flex-col overflow-hidden text-[color:var(--ink)] selection:bg-[#c26a0044]">
      <LiveRegion />

      <header class="shrink-0 z-30 bg-[color:var(--paper)]/95 backdrop-blur border-b border-[color:var(--line)] px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 shadow-sm">
        <div class="flex items-baseline gap-2 mr-1">
          <h1 class="font-display text-[22px] sm:text-2xl font-bold tracking-tight leading-none">
            Media<span class="text-[#1b6b4a]">Timeline</span>
          </h1>
          <span class="hidden md:inline font-display italic text-sm text-[color:var(--ink-soft)]">History of Media &amp; Communication</span>
        </div>

        <Show when={state.lastMutation}>
          <span class="hidden lg:inline-flex items-center rounded-full bg-[#1b6b4a1a] text-[#14512f] text-[11px] font-medium px-2 py-0.5 mono" aria-live="polite" title="Last mutating action">
            last: {state.lastMutation}
          </span>
        </Show>

        <div class="flex items-center gap-1 ml-auto">
          <div class="flex rounded-lg border border-[color:var(--line)] overflow-hidden" role="group" aria-label="Interaction mode">
            {modeBtn("scrub", "Scrub/Explore", IconTimeline)}
            {modeBtn("library", "Library/Filter", IconListDetails)}
          </div>
        </div>

        <div class="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
          <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-2 text-sm font-medium disabled:opacity-35 disabled:cursor-not-allowed min-h-[40px]" onClick={() => undo()} disabled={!canUndo()} aria-label="Undo" title="Undo (Ctrl+Z)">
            <IconArrowBackUp size={17} /> <span class="hidden sm:inline">Undo</span>
          </button>
          <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-2 text-sm font-medium disabled:opacity-35 disabled:cursor-not-allowed min-h-[40px]" onClick={() => redo()} disabled={!canRedo()} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <IconArrowForwardUp size={17} /> <span class="hidden sm:inline">Redo</span>
          </button>
          <span class="hidden sm:block w-px h-6 bg-[color:var(--line)] mx-0.5" aria-hidden="true" />
          <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg bg-[#1b6b4a] text-white px-3 py-2 text-sm font-medium min-h-[40px] hover:brightness-110" onClick={openCreate}>
            <IconPlus size={17} /> Create
          </button>
          <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium min-h-[40px]" onClick={() => openExport()}>
            <IconFileExport size={17} /> <span class="hidden sm:inline">Export timeline</span>
          </button>
          <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium min-h-[40px]" onClick={() => openImport()}>
            <IconFileImport size={17} /> <span class="hidden sm:inline">Import</span>
          </button>
          <button class="chrome-btn inline-flex items-center rounded-lg border border-[color:var(--line)] bg-white p-2 min-h-[40px] min-w-[40px]" onClick={() => openAbout()} aria-label="About and help">
            <IconInfoCircle size={17} />
          </button>
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden relative">
        {/* mode views animate in on switch (animationName != none) */}
        <Show when={state.activeMode === "scrub"}>
          <div key="scrub" class="anim-view flex-1 flex flex-col min-w-0">
            <TimelineStage onAbout={openAbout} />
            <div class="shrink-0 border-t border-[color:var(--line)] bg-[color:var(--paper)]/95 backdrop-blur px-4 py-3 z-20 shadow-[0_-6px_14px_-10px_rgba(0,0,0,0.3)]">
              <div class="flex flex-col gap-2">
                <Scrubber />
                <DensityStrip enabled={() => state.enabledCategories} class="hidden md:flex" />
              </div>
            </div>
          </div>
        </Show>

        <Show when={state.activeMode === "library"}>
          <div key="library" class="anim-view flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
            {/* mobile filters toggle */}
            <div class="md:hidden shrink-0 flex items-center justify-between px-3 py-2 border-b border-[color:var(--line)] bg-[color:var(--paper-deep)]">
              <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen()}>
                <IconAdjustmentsHorizontal size={16} /> Filters &amp; search
              </button>
              <span class="text-xs text-[color:var(--ink-soft)]">
                <span class="font-display tabular-nums text-[color:var(--ink)]">{inViewCount()}</span> in view
              </span>
            </div>
            <Show when={filtersOpen()}>
              <div class="md:hidden anim-fade max-h-[46vh] overflow-hidden flex">
                <FilterSidebar />
              </div>
            </Show>
            <div class="hidden md:flex">
              <FilterSidebar />
            </div>
            <Library onEditEvent={openEdit} onCreate={openCreate} />
          </div>
        </Show>
      </main>

      <EventForm open={formOpen()} closing={formClosing()} initialData={editing()} onClose={closeForm} />
      <DetailPanel />
      <ExportDrawer />
      <ImportDialog />
      <AboutOverlay />
      <BatchConfirm />
      <Toasts />
    </div>
  );
}
