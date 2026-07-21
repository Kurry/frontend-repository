import { createSignal, createMemo, For, Show } from "solid-js";
import {
  store, setStore, applyPreset, deletePreset, toggleFavorite, netEV, fmtAperture, fmtShutter,
} from "./store";
import { PreviewStage } from "./ui";
import PresetForm from "./PresetForm";

export default function PresetsCompare() {
  const [editing, setEditing] = createSignal(null);
  const [formOpen, setFormOpen] = createSignal(false);
  const [compareId, setCompareId] = createSignal(null);

  const tags = createMemo(() => Array.from(new Set(store.presets.map((p) => p.lookTag).filter(Boolean))));
  const visible = createMemo(() => store.presets.filter((p) => {
    if (store.filterFav && !p.favorite) return false;
    if (store.filterTag && p.lookTag !== store.filterTag) return false;
    return true;
  }));
  const comparePreset = createMemo(() => store.presets.find((p) => p.id === compareId()) || null);

  const liveState = createMemo(() => ({
    aperture: store.aperture, shutter: store.shutter, iso: store.iso,
    contrast: store.contrast, highlights: store.highlights, shadows: store.shadows,
    lookPack: store.lookPack, scene: store.scene, highlightZebra: false, shadowZebra: false,
    focusPeaking: false, ev: netEV(), gray: store.lookPack === "B&W", peak: false,
  }));
  const presetState = (p) => p && ({
    aperture: p.aperture, shutter: p.shutter, iso: p.iso,
    contrast: 0, highlights: 0, shadows: 0, lookPack: null, scene: store.scene,
    highlightZebra: false, shadowZebra: false, focusPeaking: false,
    ev: netEV({ aperture: p.aperture, shutter: p.shutter, iso: p.iso, scene: store.scene, contrast: 0, highlights: 0, shadows: 0 }),
    gray: false, peak: false,
  });

  const stopLine = (p) => `${fmtAperture(p.aperture)}  ${fmtShutter(p.shutter)}  ISO ${p.iso}`;

  return (
    <div class="relative w-full h-full flex bg-ink text-white">
      <div class="w-[380px] max-w-[90vw] flex flex-col border-r border-white/10 bg-black/40">
        <div class="p-3 border-b border-white/10 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-lg uppercase tracking-widest">Presets</h2>
            <button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} class="hover-wash rounded-lg px-3 py-1.5 bg-primary hover:bg-primary-soft text-white text-sm font-display tracking-wide">+ New</button>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onClick={() => setStore("filterFav", (v) => !v)} aria-pressed={store.filterFav} class={`hover-wash rounded-full px-3 py-1 text-xs border transition-colors ${store.filterFav ? "bg-primary border-primary text-white" : "border-white/15 text-white/70"}`}>Favorites only</button>
            <label class="sr-only" for="tag-filter">Filter by look tag</label>
            <select id="tag-filter" value={store.filterTag} onChange={(e) => setStore("filterTag", e.target.value)} class="flex-1 bg-ink border border-white/15 rounded-full px-3 py-1 text-xs text-white">
              <option value="">All tags</option>
              <For each={tags()}>{(t) => <option value={t}>{t}</option>}</For>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 relative">
          <Show when={!store.presets.length}>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white/50">
              <div class="text-3xl mb-2">∅</div>
              <p class="font-display text-base text-white/80">No presets yet</p>
              <p class="text-xs mt-1">Press “+ New” to save your first exposure look.</p>
            </div>
          </Show>
          <Show when={store.presets.length && !visible().length}>
            <div class="p-6 text-center text-white/50 text-xs">No presets match the active filter. Clear “Favorites only” or the tag filter to see all.</div>
          </Show>
          <ul class="space-y-1.5" aria-label="Saved exposure presets">
            <For each={visible()}>
              {(p) => (
                <li class="row-enter group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover-row px-2.5 py-2">
                  <button type="button" onClick={() => applyPreset(p.id)} class="flex-1 text-left min-w-0" aria-label={`Apply preset ${p.name}`}>
                    <div class="flex items-center gap-1.5">
                      <span class="font-display text-sm text-white truncate">{p.name}</span>
                      <Show when={p.favorite}><span class="text-primary text-xs" aria-label="favorite">★</span></Show>
                    </div>
                    <div class="font-display text-[11px] text-white/55 tabular-nums">{stopLine(p)}</div>
                    <div class="text-[10px] uppercase tracking-wider text-primary-soft/80">{p.lookTag}</div>
                  </button>
                  <div class="flex flex-col gap-1">
                    <button type="button" onClick={() => toggleFavorite(p.id)} aria-pressed={p.favorite} aria-label={`Toggle favorite ${p.name}`} class={`hover-wash w-7 h-7 rounded text-xs ${p.favorite ? "text-primary" : "text-white/40"}`}>★</button>
                    <button type="button" onClick={() => setCompareId(p.id)} aria-pressed={compareId() === p.id} aria-label={`Compare ${p.name}`} class={`hover-wash w-7 h-7 rounded text-[10px] font-display ${compareId() === p.id ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>CMP</button>
                  </div>
                  <div class="flex flex-col gap-1">
                    <button type="button" onClick={() => { setEditing(p); setFormOpen(true); }} aria-label={`Edit ${p.name}`} class="hover-wash w-7 h-7 rounded bg-white/10 text-white/70 text-xs">✎</button>
                    <button type="button" onClick={() => { if (compareId() === p.id) setCompareId(null); deletePreset(p.id, true); }} aria-label={`Delete ${p.name}`} class="hover-wash w-7 h-7 rounded bg-white/10 text-white/70 text-xs">🗑</button>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>

      <div class="flex-1 relative overflow-hidden">
        <div class="absolute inset-0 grid grid-cols-2 gap-px bg-white/10">
          <div class="relative bg-black">
            <PreviewStage state={liveState()} />
            <div class="absolute top-3 left-3 z-10 bg-black/60 rounded px-2 py-1">
              <div class="font-display text-[10px] uppercase tracking-widest text-white/60">Live editor</div>
              <div class="font-display text-sm text-white tabular-nums">{stopLine(store)}</div>
            </div>
          </div>
          <div class="relative bg-black">
            <Show when={comparePreset()} fallback={
              <div class="absolute inset-0 flex flex-col items-center justify-center text-white/40 text-center p-6">
                <div class="text-3xl mb-2">⇄</div>
                <p class="font-display text-sm">Press CMP on a preset to compare it against the live editor</p>
              </div>
            }>
              {(p) => (
                <>
                  <PreviewStage state={presetState(p())} />
                  <div class="absolute top-3 right-3 z-10 bg-black/60 rounded px-2 py-1 text-right">
                    <div class="font-display text-[10px] uppercase tracking-widest text-primary-soft">{p().name}</div>
                    <div class="font-display text-sm text-white tabular-nums">{stopLine(p())}</div>
                  </div>
                </>
              )}
            </Show>
          </div>
        </div>
        <Show when={comparePreset()}>
          {(p) => {
            const dA = () => p().aperture !== store.aperture;
            const dS = () => p().shutter !== store.shutter;
            const dI = () => p().iso !== store.iso;
            return (
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 rounded-full px-3 py-1.5">
                <span class={`font-display text-[11px] ${dA() ? "text-primary-soft" : "text-white/50"}`}>f-stop {dA() ? "≠" : "="}</span>
                <span class={`font-display text-[11px] ${dS() ? "text-primary-soft" : "text-white/50"}`}>shutter {dS() ? "≠" : "="}</span>
                <span class={`font-display text-[11px] ${dI() ? "text-primary-soft" : "text-white/50"}`}>ISO {dI() ? "≠" : "="}</span>
                <button type="button" onClick={() => applyPreset(p().id)} class="hover-wash ml-2 rounded-full px-3 py-0.5 bg-primary text-white text-[11px] font-display">Apply preset</button>
              </div>
            );
          }}
        </Show>
      </div>

      <Show when={formOpen()}>
        <PresetForm preset={editing()} onClose={() => setFormOpen(false)} />
      </Show>
    </div>
  );
}
