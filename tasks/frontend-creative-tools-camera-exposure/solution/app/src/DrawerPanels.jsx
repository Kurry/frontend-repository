import { createSignal, createMemo, For, Show } from "solid-js";
import {
  store, setStore, SCENES, SCENE_OFFSET, LOOK_PACKS,
  applyLookPack, setScene, setZebra, setWipe, resetAll, undo, redo, undoStack, redoStack,
  saveSnapshot, applySnapshot, deleteSnapshot, generateBracket,
  netEV, fmtAperture, fmtShutter,
} from "./store";
import {
  downloadImage, downloadSettingsCard, downloadEditStack, copyEditStack, importEditStack, getEditStackText,
} from "./utils/export";
import { LightSlider, Histogram, PreviewStage } from "./ui";

const stopReadout = (p) => `${fmtAperture(p.aperture)} ${fmtShutter(p.shutter)} ISO ${p.iso}`;

function PanelTitle({ children }) {
  return <h3 class="font-display text-xs uppercase tracking-[0.18em] text-white/50 mb-3">{children}</h3>;
}

export function DevelopPanel() {
  return (
    <div class="space-y-4">
      <PanelTitle>Development</PanelTitle>
      <LightSlider k="contrast" label="Contrast" value={() => store.contrast} />
      <LightSlider k="highlights" label="Highlights" value={() => store.highlights} />
      <LightSlider k="shadows" label="Shadows" value={() => store.shadows} />
      <div class="flex items-center justify-between pt-1">
        <span class="font-display text-[11px] uppercase tracking-wider text-white/60">RGB histogram</span>
        <button type="button" role="switch" aria-checked={store.rgbHistogram} onClick={() => setStore("rgbHistogram", (v) => !v)} class={`w-10 h-5 rounded-full transition-colors ${store.rgbHistogram ? "bg-primary" : "bg-white/20"}`} aria-label="Toggle RGB histogram channels">
          <span class={`block w-4 h-4 rounded-full bg-white transition-transform ${store.rgbHistogram ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      <Histogram />
      <div class="flex items-center justify-between">
        <span class="font-display text-[11px] uppercase tracking-wider text-white/60">Focus peaking</span>
        <button type="button" role="switch" aria-checked={store.focusPeaking} onClick={() => setStore("focusPeaking", (v) => !v)} class={`w-10 h-5 rounded-full transition-colors ${store.focusPeaking ? "bg-primary" : "bg-white/20"}`} aria-label="Toggle focus peaking edge highlight">
          <span class={`block w-4 h-4 rounded-full bg-white transition-transform ${store.focusPeaking ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

export function ScenePanel() {
  return (
    <div class="space-y-3">
      <PanelTitle>Scenes</PanelTitle>
      <div class="flex flex-col gap-2" role="group" aria-label="Scene scenarios">
        <For each={SCENES}>
          {(sc) => {
            const off = SCENE_OFFSET[sc];
            const active = () => store.scene === sc;
            return (
              <button type="button" role="radio" aria-checked={active()} onClick={() => setScene(sc)} class={`hover-wash flex items-center justify-between rounded-lg px-3 py-2 border text-left transition-colors ${active() ? "bg-primary/25 border-primary text-white" : "bg-white/5 border-white/10 text-white/80"}`}>
                <span class="font-display text-sm tracking-wide">{sc}</span>
                <span class="font-display text-xs text-white/60">{off > 0 ? `+${off}` : off} EV</span>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export function LooksPanel() {
  return (
    <div class="space-y-3">
      <PanelTitle>Look Packs</PanelTitle>
      <div class="grid grid-cols-2 gap-2" role="group" aria-label="Look packs">
        <For each={LOOK_PACKS}>
          {(pack) => {
            const active = () => store.lookPack === pack;
            return (
              <button type="button" role="radio" aria-checked={active()} onClick={() => applyLookPack(pack)} class={`hover-wash rounded-lg py-2 px-3 border font-display text-sm tracking-wide transition-colors ${active() ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/80"}`}>
                {pack}
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export function BracketPanel() {
  const [err, setErr] = createSignal("");
  const gen = () => { const r = generateBracket(); setErr(r.ok ? "" : r.error); };
  return (
    <div class="space-y-4">
      <PanelTitle>Exposure Bracket</PanelTitle>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1">
          <span class="font-display text-[10px] uppercase tracking-wider text-white/50">Frames</span>
          <select value={store.bracket.count} onChange={(e) => setStore("bracket", "count", Number(e.target.value))} class="bg-ink border border-white/15 rounded px-2 py-1.5 text-sm text-white">
            <option value={3}>3</option><option value={5}>5</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-display text-[10px] uppercase tracking-wider text-white/50">Step</span>
          <select value={store.bracket.step} onChange={(e) => setStore("bracket", "step", Number(e.target.value))} class="bg-ink border border-white/15 rounded px-2 py-1.5 text-sm text-white">
            <option value={1}>1 stop</option><option value={2}>2 stops</option>
          </select>
        </label>
      </div>
      <label class="flex flex-col gap-1">
        <span class="font-display text-[10px] uppercase tracking-wider text-white/50" id="brk-name-lbl">Base name</span>
        <input type="text" value={store.bracket.baseName} maxlength={40} onInput={(e) => { setStore("bracket", "baseName", e.target.value); if (e.target.value.trim()) setErr(""); }} aria-labelledby="brk-name-lbl" aria-invalid={!!err()} aria-describedby={err() ? "brk-err" : undefined} placeholder="e.g. Dusk" class={`bg-ink border rounded px-2 py-1.5 text-sm text-white ${err() ? "border-primary" : "border-white/15"}`} />
        <Show when={err()}><span id="brk-err" class="val-enter text-[11px] text-primary-soft" role="alert">Base name: {err()}</span></Show>
      </label>
      <button type="button" onClick={gen} class="hover-wash w-full rounded-lg py-2 bg-primary/90 hover:bg-primary text-white font-display tracking-wide text-sm">Generate bracket</button>
      <Show when={store.bracketGenerated.length}>
        <div>
          <div class="font-display text-[10px] uppercase tracking-wider text-white/50 mb-1">Darkest → brightest</div>
          <div class="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Bracket preview strip">
            <For each={[...store.bracketGenerated].sort((a, b) => a.delta - b.delta)}>
              {(f, i) => (
                <div class="thumb-enter min-w-[64px] flex-1" role="listitem" style={{ "animation-delay": `${i() * 45}ms` }}>
                  <div class="h-12 rounded border border-white/15 bg-cover bg-center" style={{ "background-image": "url(/assets/background.jpg)", filter: `brightness(${Math.max(35, Math.min(220, 100 * Math.pow(1.4, f.delta)))}%)` }} />
                  <div class="text-[9px] text-center text-white/70 mt-0.5">{f.delta > 0 ? "+" : ""}{f.delta} EV</div>
                  <Show when={f.clamped}><div class="text-[8px] text-center text-amber-300">clamped</div></Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
      <div class="border-t border-white/10 pt-3 space-y-2">
        <PanelTitle>Clipping Zebras</PanelTitle>
        <For each={[["highlightZebra", "Highlight zebras"], ["shadowZebra", "Shadow zebras"]]}>
          {([k, label]) => (
            <div class="flex items-center justify-between">
              <span class="font-display text-[11px] uppercase tracking-wider text-white/70">{label}</span>
              <button type="button" role="switch" aria-checked={store[k]} aria-label={label} onClick={() => setZebra(k, !store[k])} class={`w-10 h-5 rounded-full transition-colors ${store[k] ? "bg-primary" : "bg-white/20"}`}>
                <span class={`block w-4 h-4 rounded-full bg-white transition-transform ${store[k] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

export function SnapshotsPanel() {
  const [name, setName] = createSignal("");
  const [err, setErr] = createSignal("");
  const save = () => { const r = saveSnapshot(name()); if (!r.ok) { setErr(r.error); return; } setErr(""); setName(""); };
  return (
    <div class="space-y-3">
      <PanelTitle>Snapshots</PanelTitle>
      <div class="flex gap-2">
        <label class="flex-1 flex flex-col">
          <span class="sr-only">Snapshot name</span>
          <input type="text" value={name()} maxlength={64} placeholder="Name this edit state…" onInput={(e) => { setName(e.target.value); if (e.target.value.trim()) setErr(""); }} aria-invalid={!!err()} aria-describedby={err() ? "snap-err" : undefined} class={`bg-ink border rounded px-2 py-1.5 text-sm text-white ${err() ? "border-primary" : "border-white/15"}`} />
        </label>
        <button type="button" onClick={save} class="hover-wash rounded px-3 bg-primary/90 hover:bg-primary text-white text-sm font-display tracking-wide">Save</button>
      </div>
      <Show when={err()}><span id="snap-err" class="val-enter text-[11px] text-primary-soft block" role="alert">Name: {err()}</span></Show>
      <Show when={!store.snapshots.length} fallback={
        <ul class="space-y-1.5" aria-label="Saved snapshots">
          <For each={store.snapshots}>
            {(s) => (
              <li class="row-enter flex items-center justify-between gap-2 bg-white/5 rounded px-2 py-1.5">
                <span class="text-xs text-white/80 truncate">{s.name}</span>
                <span class="flex gap-1">
                  <button type="button" onClick={() => applySnapshot(s.id)} class="hover-wash text-[11px] rounded px-2 py-0.5 bg-white/10 text-white">Apply</button>
                  <button type="button" onClick={() => deleteSnapshot(s.id)} class="hover-wash text-[11px] rounded px-2 py-0.5 bg-white/10 text-white/70" aria-label={`Delete snapshot ${s.name}`}>Delete</button>
                </span>
              </li>
            )}
          </For>
        </ul>
      }>
        <p class="text-[11px] text-white/40">No snapshots yet. Save the current dials, sliders, and look pack under a name.</p>
      </Show>
    </div>
  );
}

export function HistoryPanel() {
  return (
    <div class="space-y-3">
      <PanelTitle>History</PanelTitle>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" onClick={undo} disabled={!undoStack().length} class="hover-wash rounded py-2 bg-white/10 text-white text-sm font-display tracking-wide disabled:opacity-30">Undo</button>
        <button type="button" onClick={redo} disabled={!redoStack().length} class="hover-wash rounded py-2 bg-white/10 text-white text-sm font-display tracking-wide disabled:opacity-30">Redo</button>
      </div>
      <button type="button" onClick={resetAll} class="hover-wash w-full rounded py-2 bg-primary/20 hover:bg-primary/30 text-primary-soft text-sm font-display tracking-wide border border-primary/40">Reset</button>
      <p class="text-[11px] text-white/40">Reset restores f/16 · 1/60 · ISO 100, zeroed sliders, Daylight Courtyard, clears look pack, snapshots, A/B slots, zebras, bracket, and history.</p>
    </div>
  );
}

export function ExportPanel() {
  const [copyMsg, setCopyMsg] = createSignal("");
  const [impMsg, setImpMsg] = createSignal("");
  const [quality, setQuality] = createSignal(92);
  const copy = async () => { await copyEditStack(); setCopyMsg("Copied to clipboard"); setTimeout(() => setCopyMsg(""), 1800); };
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = (ev) => { const r = importEditStack(String(ev.target.result)); setImpMsg(r.ok ? "Edit stack imported." : r.error); };
    rd.readAsText(f); e.currentTarget.value = "";
  };
  return (
    <div class="space-y-3">
      <PanelTitle>Export</PanelTitle>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => downloadImage("png")} class="hover-wash rounded py-2 bg-white/10 text-white text-sm">Download PNG</button>
        <button type="button" onClick={() => downloadImage("jpeg", quality() / 100)} class="hover-wash rounded py-2 bg-white/10 text-white text-sm">Download JPEG</button>
      </div>
      <label class="flex flex-col gap-1">
        <span class="font-display text-[10px] uppercase tracking-wider text-white/50 flex justify-between"><span>JPEG quality</span><span class="text-white/80">{quality()}</span></span>
        <input type="range" min="40" max="100" step="2" value={quality()} onInput={(e) => setQuality(Number(e.target.value))} class="w-full accent-primary" aria-label="JPEG export quality" />
      </label>
      <button type="button" onClick={downloadSettingsCard} class="hover-wash w-full rounded py-2 bg-white/10 text-white text-sm">Download settings card</button>
      <div class="border-t border-white/10 pt-3 space-y-2">
        <PanelTitle>Edit Stack (develop API)</PanelTitle>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onClick={downloadEditStack} class="hover-wash rounded py-2 bg-white/10 text-white text-sm">Download edit stack</button>
          <button type="button" onClick={copy} class="hover-wash rounded py-2 bg-white/10 text-white text-sm">{copyMsg() || "Copy edit stack"}</button>
        </div>
        <Show when={copyMsg()}><span class="val-enter text-[11px] text-green-300 block" role="status">{copyMsg()}</span></Show>
        <label class="hover-wash flex items-center justify-center rounded py-2 bg-primary/15 text-primary-soft text-sm border border-primary/30 cursor-pointer">
          Import edit stack
          <input type="file" accept="application/json,.json" class="hidden" onChange={onFile} />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-display text-[10px] uppercase tracking-wider text-white/50">Or paste JSON</span>
          <textarea rows={2} placeholder='{"schemaVersion":"camera-exposure.edit-stack.v1", ...}' onBlur={(e) => { if (e.target.value.trim()) { const r = importEditStack(e.target.value); setImpMsg(r.ok ? "Edit stack imported." : r.error); if (r.ok) e.target.value = ""; } }} class="bg-ink border border-white/15 rounded px-2 py-1 text-[11px] text-white/80 font-mono" />
        </label>
        <Show when={impMsg()}><span class={`val-enter text-[11px] block ${impMsg().startsWith("Edit stack imported") ? "text-green-300" : "text-primary-soft"}`} role={impMsg().startsWith("Edit stack imported") ? "status" : "alert"}>{impMsg()}</span></Show>
      </div>
      <div class="border-t border-white/10 pt-3">
        <PanelTitle>Live JSON Preview</PanelTitle>
        <pre class="bg-ink border border-white/10 rounded p-2 text-[10px] text-white/70 font-mono overflow-auto max-h-40 whitespace-pre-wrap" aria-label="Live edit stack JSON preview">{getEditStackText()}</pre>
      </div>
    </div>
  );
}

export function CompareView() {
  const bothFilled = createMemo(() => !!store.abSlots.A && !!store.abSlots.B);
  const [dragging, setDragging] = createSignal(false);
  let track;
  const setFromClientX = (clientX) => { const r = track.getBoundingClientRect(); setWipe(((clientX - r.left) / r.width) * 100); };
  const onPointerDown = (e) => {
    setDragging(true); setFromClientX(e.clientX);
    const move = (ev) => setFromClientX(ev.clientX);
    const up = () => { setDragging(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  return (
    <Show when={store.compareActive && bothFilled()}>
      <div class="absolute inset-0 z-[8]">
        <div ref={track} class="absolute inset-0">
          <div class="absolute inset-0" style={{ "clip-path": `inset(0 ${100 - store.wipe}% 0 0)` }}><PreviewStage state={store.abSlots.A} ariaScene={store.abSlots.A?.scene} /></div>
          <div class="absolute inset-0" style={{ "clip-path": `inset(0 0 0 ${store.wipe}%)` }}><PreviewStage state={store.abSlots.B} ariaScene={store.abSlots.B?.scene} /></div>
          <span class="absolute top-3 left-3 font-display text-sm bg-black/60 px-2 py-0.5 rounded text-white">A</span>
          <span class="absolute top-3 right-3 font-display text-sm bg-black/60 px-2 py-0.5 rounded text-white">B</span>
          <button type="button" onClick={() => setStore("compareActive", false)} class="absolute bottom-3 left-1/2 -translate-x-1/2 hover-wash rounded-full px-3 py-1 bg-black/70 text-white text-xs font-display tracking-wide border border-white/20">Exit compare</button>
        </div>
        <div class="absolute top-0 bottom-0 w-[3px] bg-primary cursor-ew-resize z-[9]" style={{ left: `${store.wipe}%`, "margin-left": "-1.5px" }} onPointerDown={onPointerDown}>
          <div role="slider" tabindex="0" aria-label="Compare wipe position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(store.wipe)} aria-valuetext={`${Math.round(store.wipe)} percent`} onKeyDown={(e) => { if (e.key === "ArrowLeft") { e.preventDefault(); setWipe(store.wipe - 2); } else if (e.key === "ArrowRight") { e.preventDefault(); setWipe(store.wipe + 2); } else if (e.key === "Home") { e.preventDefault(); setWipe(0); } else if (e.key === "End") { e.preventDefault(); setWipe(100); } }} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-white">
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M8 5l-4 7 4 7zM16 5l4 7-4 7z" /></svg>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function ComparePanel() {
  const SlotSummary = (slot) => {
    const s = () => store.abSlots[slot];
    return (
      <div class={`rounded-lg border px-3 py-2 ${s() ? "border-white/15 bg-white/5" : "border-dashed border-white/15 bg-transparent"}`}>
        <div class="flex items-center justify-between">
          <span class="font-display text-sm text-white">Set {slot}</span>
          <button type="button" onClick={() => setStore("abSlots", slot, { aperture: store.aperture, shutter: store.shutter, iso: store.iso, contrast: store.contrast, highlights: store.highlights, shadows: store.shadows, lookPack: store.lookPack, scene: store.scene, label: slot })} class="hover-wash text-[11px] rounded px-2 py-0.5 bg-primary/80 hover:bg-primary text-white">Capture</button>
        </div>
        <Show when={s()} fallback={<span class="text-[11px] text-white/40">empty</span>}>
          <span class="font-display text-[11px] text-white/70">{stopReadout(s())} · {s().scene}</span>
        </Show>
      </div>
    );
  };
  const both = () => !!store.abSlots.A && !!store.abSlots.B;
  return (
    <div class="space-y-3">
      <PanelTitle>A / B Compare</PanelTitle>
      <div class="grid grid-cols-2 gap-2">{SlotSummary("A")}{SlotSummary("B")}</div>
      <button type="button" onClick={() => setStore("compareActive", (v) => !v)} disabled={!both()} class={`hover-wash w-full rounded-lg py-2 font-display tracking-wide text-sm transition-colors ${store.compareActive ? "bg-white/15 text-white" : "bg-primary text-white"} disabled:opacity-30 disabled:cursor-not-allowed`}>
        {store.compareActive ? "Close compare" : "Compare"}
      </button>
      <p class="text-[11px] text-white/40">Capture both slots, then Compare opens a wipe split over the preview. Drag the handle or focus it and use arrow keys.</p>
    </div>
  );
}
