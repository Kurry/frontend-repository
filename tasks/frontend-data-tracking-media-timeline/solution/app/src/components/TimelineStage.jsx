import { createMemo, createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { state, inView, openDetail, zoomAroundMidpoint, panBy, setWindow } from "../store";
import { LANES, ERAS, laneForEvent, CATEGORY_COLOR } from "../data";
import { fmtYear, eraAtMidpoint } from "../format";
import { IconInfoCircle } from "@tabler/icons-solidjs";

const PAD_LEFT = 0.16; // fraction of width reserved for the tapering ribbon edge
const PAD_RIGHT = 0.13; // fraction reserved for lane labels

export default function TimelineStage(props) {
  let containerRef;
  const [width, setWidth] = createSignal(960);
  const [hoverId, setHoverId] = createSignal(null);
  const [drag, setDrag] = createSignal(null);

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    if (containerRef) ro.observe(containerRef);
    setWidth(containerRef ? containerRef.clientWidth : 960);
    onCleanup(() => ro.disconnect());
  });

  const W = createMemo(() => Math.max(280, width()));
  const drawLeft = createMemo(() => W() * PAD_LEFT);
  const drawRight = createMemo(() => W() * (1 - PAD_RIGHT));
  const drawW = createMemo(() => Math.max(40, drawRight() - drawLeft()));

  const xForYear = (year) => {
    const f = state.window.from;
    const t = state.window.to;
    const r = t === f ? 0.5 : (year - f) / (t - f);
    return drawLeft() + r * drawW();
  };
  const yearForX = (x) => {
    const f = state.window.from;
    const t = state.window.to;
    const r = (x - drawLeft()) / drawW();
    return Math.round(f + r * (t - f));
  };

  // group in-view events by lane and compute vertical offset for same/near-year overlaps
  const lanes = createMemo(() => {
    const view = inView();
    const byLane = {};
    for (const l of LANES) byLane[l.id] = [];
    for (const ev of view) {
      const lid = laneForEvent(ev);
      (byLane[lid] || (byLane[lid] = [])).push(ev);
    }
    const result = {};
    for (const l of LANES) {
      const arr = byLane[l.id].slice().sort((a, b) => a.year - b.year);
      const placed = [];
      for (const ev of arr) {
        const x = xForYear(ev.year);
        // vertical fan among pins that land within 22px on the same lane, so each stays clickable
        const near = placed.filter((p) => Math.abs(p.x - x) < 22).length;
        const vy = near === 0 ? 0 : (near % 2 === 1 ? -1 : 1) * (12 + Math.floor(near / 2) * 10);
        placed.push({ ev, x, vy });
      }
      // mark cluster sizes for same-year groups (for the count badge)
      const yearCount = {};
      for (const p of placed) yearCount[p.ev.year] = (yearCount[p.ev.year] || 0) + 1;
      for (const p of placed) p.sameYear = yearCount[p.ev.year];
      result[l.id] = placed;
    }
    return result;
  });

  // wheel: zoom on plain wheel, pan on shift or horizontal-dominant wheel
  function onWheel(e) {
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (e.shiftKey || horiz) {
      e.preventDefault();
      const d = horiz ? e.deltaX : e.deltaY;
      const span = state.window.to - state.window.from;
      const years = Math.round((d / 240) * span * 0.4);
      if (years !== 0) panBy(years);
    } else {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      zoomAroundMidpoint(factor);
    }
  }

  function onPointerDown(e) {
    if (e.target !== e.currentTarget && e.target.getAttribute("data-stage-bg") !== "true") return;
    setDrag({ x: e.clientX, from: state.window.from, to: state.window.to });
    const move = (ev) => {
      const dx = ev.clientX - drag().x;
      const span = drag().to - drag().from;
      const years = -Math.round((dx / drawW()) * span);
      setWindow(drag().from + years, drag().to + years);
    };
    const up = () => {
      setDrag(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const laneHeight = 120;
  const stageHeight = () => LANES.length * laneHeight + 36;
  const midEra = createMemo(() => eraAtMidpoint(state.window.from, state.window.to));

  return (
    <div class="relative flex-1 min-h-0 overflow-hidden" style={{ "min-height": "360px" }}>
      <div
        ref={containerRef}
        class="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        role="application"
        aria-label="Timeline stage. Drag to pan, scroll to zoom, shift-scroll to pan the year window."
        tabindex="0"
      >
        {/* era bands wash (vertical columns) */}
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <For each={ERAS}>
            {(era) => {
              const f = state.window.from;
              const t = state.window.to;
              const left = Math.max(0, Math.min(1, (era.fromYear - f) / (t - f))) * 100;
              const right = Math.max(0, Math.min(1, (era.toYear - f) / (t - f))) * 100;
              const visible = right > left && right > 0 && left < 100;
              return (
                <Show when={visible}>
                  <div class="absolute top-0 bottom-0 border-r border-[rgba(120,90,50,0.10)]" style={{ left: left + "%", width: Math.max(0, right - left) + "%", background: "rgba(120,90,50,0.045)" }}>
                    <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(80,60,35,0.6)] font-semibold whitespace-nowrap">{era.name}</span>
                  </div>
                </Show>
              );
            }}
          </For>
        </div>

        {/* corner numerals */}
        <div class="absolute top-3 left-4 pointer-events-none">
          <span class="font-display italic font-bold text-[clamp(28px,5vw,52px)] leading-none text-[color:var(--ink)] drop-shadow-sm">{fmtYear(state.window.from)}</span>
        </div>
        <div class="absolute top-3 right-4 pointer-events-none text-right">
          <span class="font-display italic font-bold text-[clamp(28px,5vw,52px)] leading-none text-[color:var(--ink)] drop-shadow-sm">{fmtYear(state.window.to)}</span>
        </div>

        {/* midpoint vertical line */}
        <div class="absolute top-0 bottom-0 w-px bg-[rgba(40,30,20,0.35)] pointer-events-none" style={{ left: "50%" }} aria-hidden="true" />

        {/* swimlanes */}
        <div class="absolute left-0 right-0" style={{ top: "64px" }} data-stage-bg="true">
          <For each={LANES}>
            {(lane, i) => {
              const top = () => i() * laneHeight;
              const placed = () => lanes()[lane.id] || [];
              return (
                <div class="absolute left-0 right-0" style={{ top: top() + "px", height: laneHeight + "px" }} data-stage-bg="true">
                  {/* ribbon with tapering left edge */}
                  <div
                    class="absolute top-2 bottom-2 left-0 rounded-r-[40px]"
                    data-stage-bg="true"
                    style={{
                      right: "8px",
                      background: `linear-gradient(90deg, ${lane.from}, ${lane.to})`,
                      "-webkit-mask-image": "linear-gradient(90deg, transparent 0%, #000 15%, #000 100%)",
                      "mask-image": "linear-gradient(90deg, transparent 0%, #000 15%, #000 100%)",
                      opacity: "0.92",
                    }}
                  />
                  {/* center strand */}
                  <div class="absolute left-[14%] right-10 top-1/2 h-px bg-[rgba(255,255,255,0.7)]" data-stage-bg="true" aria-hidden="true" />
                  {/* lane label */}
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 font-display italic font-bold text-[13px] text-[#241a10] hidden sm:block pointer-events-none">{lane.label}</span>
                  {/* pins */}
                  <For each={placed()}>
                    {(p) => {
                      const col = () => CATEGORY_COLOR[p.ev.categories[0]] || "#333";
                      const isHover = () => hoverId() === p.ev.id;
                      return (
                        <div class="absolute" style={{ left: p.x + "px", top: laneHeight / 2 + p.vy + "px", transform: "translate(-50%,-50%)", "z-index": isHover() ? 30 : 10 }}>
                          <button
                            class="pin-dot anim-pin relative grid place-items-center rounded-full bg-white shadow-md"
                            style={{ width: p.sameYear > 1 ? "26px" : "16px", height: p.sameYear > 1 ? "26px" : "16px", "box-shadow": isHover() ? `0 0 0 4px ${col()}44, 0 3px 10px rgba(0,0,0,0.3)` : "0 1px 4px rgba(0,0,0,0.25)" }}
                            onMouseEnter={() => setHoverId(p.ev.id)}
                            onMouseLeave={() => setHoverId((h) => (h === p.ev.id ? null : h))}
                            onFocus={() => setHoverId(p.ev.id)}
                            onBlur={() => setHoverId((h) => (h === p.ev.id ? null : h))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(p.ev.id);
                            }}
                            aria-label={`${p.ev.title}, ${p.ev.place}, ${fmtYear(p.ev.year)}. Open detail.`}
                          >
                            <span class="rounded-full" style={{ width: p.sameYear > 1 ? "8px" : "7px", height: p.sameYear > 1 ? "8px" : "7px", background: col() }} />
                            <Show when={p.sameYear > 1}>
                              <span class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white text-[10px] font-bold px-1.5 shadow" style={{ color: col() }}>
                                {p.sameYear}
                              </span>
                            </Show>
                          </button>
                          <Show when={isHover()}>
                            <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-40 w-max max-w-[220px] rounded-lg bg-[#1d1a16] text-[#f3ead9] text-xs px-2.5 py-1.5 shadow-xl pointer-events-none anim-fade">
                              <div class="font-semibold leading-tight">{p.ev.title}</div>
                              <div class="text-[#cdbfa6] mt-0.5">
                                {p.ev.place} &middot; {fmtYear(p.ev.year)}
                              </div>
                            </div>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </div>
              );
            }}
          </For>
        </div>

        {/* current era + in-view readouts overlaid bottom-left */}
        <div class="absolute bottom-3 left-4 flex items-center gap-2 pointer-events-none">
          <span class="rounded-full bg-[rgba(29,26,22,0.85)] text-[#f3ead9] text-xs px-2.5 py-1 font-medium">
            era at midpoint: <span class="font-display">{midEra().name}</span>
          </span>
        </div>
      </div>

      {/* floating help / about trigger on stage */}
      <button class="chrome-btn absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur border border-[color:var(--line)] px-3 py-1 text-xs font-medium shadow-sm" onClick={() => props.onAbout && props.onAbout()} aria-label="Open About and help">
        <IconInfoCircle size={14} /> About &amp; help
      </button>
    </div>
  );
}
