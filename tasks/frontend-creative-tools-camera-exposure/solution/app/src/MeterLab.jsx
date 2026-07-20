import { createMemo, createSignal, createEffect, Show, For } from "solid-js";
import {
  store, setStore, DEFAULTS, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS,
  netEV, fmtEV, fmtAperture, fmtShutter,
} from "./store";
import { PreviewStage, ExposureMeter, Dial } from "./ui";
import {
  DevelopPanel, ScenePanel, LooksPanel, BracketPanel, ComparePanel,
  SnapshotsPanel, HistoryPanel, ExportPanel, CompareView,
} from "./DrawerPanels";

const TOOLBAR = [
  ["develop", "Develop"],
  ["scene", "Scenes"],
  ["looks", "Looks"],
  ["bracket", "Bracket"],
  ["compare", "A/B"],
  ["snapshots", "Snapshots"],
  ["history", "History"],
  ["export", "Export"],
];

const PANELS = {
  develop: DevelopPanel, scene: ScenePanel, looks: LooksPanel, bracket: BracketPanel,
  compare: ComparePanel, snapshots: SnapshotsPanel, history: HistoryPanel, export: ExportPanel,
};

const uneditedState = createMemo(() => ({
  ...DEFAULTS, scene: store.scene, highlightZebra: false, shadowZebra: false, focusPeaking: false,
  ev: netEV({ ...DEFAULTS, scene: store.scene }), gray: false, peak: false,
}));

function Drawer() {
  const Cmp = createMemo(() => PANELS[store.activeDrawer]);
  const [shown, setShown] = createSignal(false);
  createEffect(() => {
    if (store.activeDrawer) requestAnimationFrame(() => setShown(true));
    else setShown(false);
  });
  return (
    <aside class="drawer-panel absolute top-0 right-0 bottom-0 w-[340px] max-w-[88vw] z-30 bg-ink/92 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col" data-open={shown()} role="complementary" aria-label={`${store.activeDrawer || ""} panel`} aria-hidden={!store.activeDrawer}>
      <div class="flex items-center justify-between px-4 pt-4">
        <span class="font-display text-sm uppercase tracking-[0.2em] text-white/70">{store.activeDrawer}</span>
        <button type="button" onClick={() => setStore("activeDrawer", null)} aria-label="Close panel" class="hover-wash w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <Show when={Cmp()}>{(C) => <C />}</Show>
      </div>
    </aside>
  );
}

export default function MeterLab() {
  const previewState = createMemo(() => store.beforeHold ? uneditedState() : undefined);
  return (
    <div class="relative w-full h-full">
      <PreviewStage state={previewState()} register />

      <CompareView />

      <div class="absolute left-5 top-1/2 -translate-y-1/2 z-20">
        <ExposureMeter />
      </div>

      <div class="absolute right-7 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-4" role="group" aria-label="Exposure dials">
        <Dial k="aperture" title="APERTURE" inverted stops={APERTURE_STOPS} value={() => store.aperture} readout={() => fmtAperture(store.aperture)} />
        <Dial k="shutter" title="SPEED" stops={SHUTTER_STOPS} value={() => store.shutter} readout={() => fmtShutter(store.shutter)} />
        <Dial k="iso" title="ISO" stops={ISO_STOPS} value={() => store.iso} readout={() => String(store.iso)} />
        <div class="font-display text-sm text-white bg-black/45 backdrop-blur rounded-full px-3 py-1 tabular-nums" aria-live="polite" aria-label="Exposure value">{fmtEV(netEV())}</div>
      </div>

      <nav class="absolute left-3 bottom-3 z-30 flex flex-wrap gap-1.5 max-w-[62vw] p-1.5 rounded-xl bg-black/35 backdrop-blur-md border border-white/10" aria-label="Lab tools">
        <For each={TOOLBAR}>
          {([id, label]) => (
            <button type="button" onClick={() => setStore("activeDrawer", (c) => (c === id ? null : id))} aria-pressed={store.activeDrawer === id} class={`hover-wash rounded-lg px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors ${store.activeDrawer === id ? "bg-primary text-white" : "bg-white/10 text-white/80"}`}>
              {label}
            </button>
          )}
        </For>
        <button type="button" onPointerDown={() => setStore("beforeHold", true)} onPointerUp={() => setStore("beforeHold", false)} onPointerLeave={() => setStore("beforeHold", false)} onBlur={() => setStore("beforeHold", false)} aria-pressed={store.beforeHold} class="hover-wash rounded-lg px-3 py-1.5 font-display text-[11px] uppercase tracking-wider bg-white/10 text-white/80 select-none">
          Before/After
        </button>
      </nav>

      <div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span class="brand-chip font-display text-[11px] uppercase tracking-[0.22em] text-white/85 bg-primary/35 border border-primary/40 rounded-full px-4 py-1">Camera Exposure Simulator</span>
      </div>

      <Drawer />
    </div>
  );
}
