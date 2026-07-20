import { createMemo, For, Show } from "solid-js";
import {
  store, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS,
  netEV, clipEstimate, brightnessPct,
  stepStop, mutate, setStore, pushHistory,
  fmtAperture, fmtShutter, fmtEV,
} from "./store";
import CanvasPreview from "./CanvasPreview";

export function ZebraOverlay(props) {
  const s = () => props.state ?? store;
  const clip = createMemo(() => clipEstimate(s()));
  return (
    <div class="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
      <div class="absolute inset-0 zebra-hl transition-opacity duration-500" style={{ opacity: s().highlightZebra ? clip().hl : 0 }} />
      <div class="absolute inset-0 zebra-sh transition-opacity duration-500" style={{ opacity: s().shadowZebra ? clip().sh : 0 }} />
    </div>
  );
}

export function Histogram(props) {
  const s = () => props.state ?? store;
  const bars = createMemo(() => {
    const st = s();
    const ev = netEV(st);
    const bright = brightnessPct(ev) / 100;
    const contrast = 1 + st.contrast / 130;
    const hl = st.highlights / 100;
    const sh = st.shadows / 100;
    const N = 32;
    const lum = [], r = [], g = [], b = [];
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      const centered = (x - 0.5) * 2;
      let v = Math.exp(-2.1 * centered * centered / Math.max(0.4, contrast));
      v = Math.max(0, Math.min(1, (v - 0.5) * contrast + 0.5 + (bright - 1) * 0.7));
      v += 0.05 * Math.sin(i * 1.7 + ev);
      v = Math.max(0, Math.min(1, v + hl * Math.pow(x, 3) - sh * Math.pow(1 - x, 3)));
      lum.push(v);
      r.push(Math.max(0, Math.min(1, v + 0.10 * (1 - x) + (st.lookPack === "Warm" ? 0.08 : 0))));
      g.push(Math.max(0, Math.min(1, v)));
      b.push(Math.max(0, Math.min(1, v + 0.10 * x - (st.lookPack === "Warm" ? 0.06 : 0))));
    }
    return { lum, r, g, b };
  });
  const clip = createMemo(() => clipEstimate(s()));
  const Row = (arr, color) => (
    <div class="absolute inset-0 flex items-end gap-[1px] px-[2px]" style={{ opacity: 0.85 }}>
      <For each={arr()}>
        {(h) => <div class="flex-1 transition-all duration-300 ease-out rounded-sm" style={{ height: `${Math.round(h * 100)}%`, background: color }} />}
      </For>
    </div>
  );
  return (
    <div class="relative w-full bg-black/50 rounded-md border border-white/10 overflow-hidden" style={{ height: props.height || 84 }} role="img" aria-label={`Live exposure histogram, ${s().rgbHistogram ? "RGB channels" : "luminance"}`}>
      <Show when={!s().rgbHistogram} fallback={
        <>
          {Row(() => bars().r, "rgba(255,70,70,.7)")}
          {Row(() => bars().g, "rgba(70,255,120,.6)")}
          {Row(() => bars().b, "rgba(80,140,255,.7)")}
        </>
      }>
        {Row(() => bars().lum, "rgba(255,255,255,.85)")}
      </Show>
      <div class="absolute left-0 top-0 bottom-0 w-[3px] transition-opacity duration-300" style={{ background: "#3b82f6", opacity: clip().sh > 0.02 ? 1 : 0.12 }} title="Shadow clipping" />
      <div class="absolute right-0 top-0 bottom-0 w-[3px] transition-opacity duration-300" style={{ background: "#e0473a", opacity: clip().hl > 0.02 ? 1 : 0.12 }} title="Highlight clipping" />
    </div>
  );
}

export function ExposureMeter(props) {
  const s = () => props.state ?? store;
  const ev = createMemo(() => netEV(s()));
  const pct = createMemo(() => 50 - Math.max(-5, Math.min(5, ev())) * 8);
  return (
    <div class="flex items-stretch gap-1.5 select-none" role="group" aria-label="Exposure meter">
      <span class="font-display text-[9px] uppercase tracking-[0.2em] text-white/80 self-stretch flex items-center" style={{ "writing-mode": "vertical-rl", transform: "rotate(180deg)" }}>Under Exposed</span>
      <div class="relative w-[12px] rounded-full bg-white/25 border border-white/30 shadow-inner" style={{ height: 240 }} aria-hidden="true">
        <div class="absolute left-1/2 -translate-x-1/2 top-1/2 w-[16px] h-px bg-white/50" />
        <div class="absolute left-1/2 w-[20px] h-[20px] rounded-full bg-primary border-2 border-white shadow-lg -translate-x-1/2 transition-all duration-500 ease-out" style={{ top: `${pct()}%`, "margin-top": "-10px" }} />
      </div>
      <span class="font-display text-[9px] uppercase tracking-[0.2em] text-white/80 self-stretch flex items-center" style={{ "writing-mode": "vertical-rl" }}>Over Exposed</span>
      <span class="sr-only" aria-live="polite">{fmtEV(ev())}</span>
    </div>
  );
}

export function Dial(props) {
  const list = () => props.stops;
  const idx = createMemo(() => list().indexOf(props.value()));
  const atMin = createMemo(() => idx() <= 0);
  const atMax = createMemo(() => idx() >= list().length - 1);
  const open = () => stepStop(props.k, 1);
  const close = () => stepStop(props.k, -1);
  const onKey = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); open(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); close(); }
    else if (e.key === "Home") { e.preventDefault(); mutate(() => setStore(props.k, list()[0])); }
    else if (e.key === "End") { e.preventDefault(); mutate(() => setStore(props.k, list()[list().length - 1])); }
  };
  const LeftIcon = () => <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M15 5l-7 7 7 7z" /></svg>;
  const RightIcon = () => <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M9 5l7 7-7 7z" /></svg>;
  const leftIsOpen = props.inverted;
  return (
    <div class="flex items-center gap-2">
      <button type="button" class="text-primary hover:text-primary-soft transition-opacity duration-300 hover-wash rounded p-1 disabled:opacity-0 disabled:pointer-events-none" onClick={() => (leftIsOpen ? open() : close())} disabled={leftIsOpen ? atMax() : atMin()} aria-label={`${leftIsOpen ? "Open" : "Close"} ${props.title}`}><LeftIcon /></button>
      <div class="flex flex-col items-center justify-center bg-chrome rounded-2xl px-4 py-3 w-[92px] shadow-lg border border-white/5" role="slider" tabindex="0" aria-label={props.title} aria-valuetext={props.readout()} aria-valuemin={1} aria-valuemax={list().length} aria-valuenow={idx() + 1} onKeyDown={onKey}>
        <span class="font-display text-[10px] uppercase tracking-widest text-white/60">{props.title}</span>
        <span class="font-display text-2xl text-white tabular-nums leading-tight">{props.readout()}</span>
      </div>
      <button type="button" class="text-primary hover:text-primary-soft transition-opacity duration-300 hover-wash rounded p-1 disabled:opacity-0 disabled:pointer-events-none" onClick={() => (leftIsOpen ? close() : open())} disabled={leftIsOpen ? atMin() : atMax()} aria-label={`${leftIsOpen ? "Close" : "Open"} ${props.title}`}><RightIcon /></button>
    </div>
  );
}

export function LightSlider(props) {
  let started = false;
  const begin = () => { if (!started) { pushHistory(); started = true; } };
  return (
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center">
        <label for={`sl-${props.k}`} class="font-display text-[11px] uppercase tracking-wider text-white/60">{props.label}</label>
        <span class="font-display text-sm text-white tabular-nums w-9 text-right" aria-live="polite">{props.value()}</span>
      </div>
      <input id={`sl-${props.k}`} type="range" min="-100" max="100" step="1" value={props.value()} onPointerDown={begin} onKeyDown={(e) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) begin(); }} onInput={(e) => setStore(props.k, Math.max(-100, Math.min(100, Number(e.target.value))))} onBlur={() => { started = false; }} class="w-full accent-primary cursor-pointer" aria-valuetext={`${props.value()}`} />
    </div>
  );
}

export function PreviewStage(props) {
  const s = createMemo(() => props.state ?? store);
  const stageState = createMemo(() => {
    const st = s();
    return {
      aperture: st.aperture, shutter: st.shutter, iso: st.iso,
      contrast: st.contrast, highlights: st.highlights, shadows: st.shadows,
      lookPack: st.lookPack, scene: st.scene,
      highlightZebra: st.highlightZebra, shadowZebra: st.shadowZebra,
      focusPeaking: st.focusPeaking,
      ev: netEV(st),
      gray: st.lookPack === "B&W",
      peak: st.focusPeaking,
    };
  });
  return (
    <div class="absolute inset-0 overflow-hidden bg-black" role="img" aria-label={`Exposure preview, ${props.ariaScene ?? store.scene}, ${fmtEV(netEV(s()))}`}>
      <CanvasPreview state={stageState} register={props.register} />
      <ZebraOverlay state={s()} />
    </div>
  );
}
