import { createMemo } from "solid-js";
import { state, setFromYear, setToYear, fitAll, setWindow } from "../store";
import { YEAR_MIN, YEAR_MAX } from "../data";
import { fmtYear } from "../format";
import { IconMaximize } from "@tabler/icons-solidjs";

export default function Scrubber() {
  let trackRef;
  const span = () => YEAR_MAX - YEAR_MIN;
  const fromPct = createMemo(() => ((state.window.from - YEAR_MIN) / span()) * 100);
  const toPct = createMemo(() => ((state.window.to - YEAR_MIN) / span()) * 100);
  const mid = createMemo(() => Math.round((state.window.from + state.window.to) / 2));

  function yearFromClientX(clientX) {
    const r = trackRef.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round(YEAR_MIN + ratio * span());
  }

  function startDrag(which, e) {
    e.preventDefault();
    const move = (ev) => {
      const y = yearFromClientX(ev.clientX);
      if (which === "from") setWindow(Math.min(y, state.window.to - 1), state.window.to);
      else setWindow(state.window.from, Math.max(y, state.window.from + 1));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function keyThumb(which, e) {
    const step = e.shiftKey ? 25 : e.ctrlKey || e.metaKey ? 100 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (which === "from") setFromYear(state.window.from - step);
      else setToYear(state.window.to - step);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (which === "from") setFromYear(state.window.from + step);
      else setToYear(state.window.to + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (which === "from") setFromYear(YEAR_MIN);
      else setFromYear(state.window.from);
    } else if (e.key === "End") {
      e.preventDefault();
      if (which === "to") setToYear(YEAR_MAX);
      else setToYear(state.window.to);
    }
  }

  return (
    <div class="flex flex-col gap-2" role="group" aria-label="Year window scrubber">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-baseline gap-3">
          <span class="font-display italic font-semibold text-2xl leading-none text-[color:var(--ink)]" aria-hidden="true">
            {fmtYear(state.window.from)}
          </span>
          <span class="text-[color:var(--ink-soft)] text-xs">to</span>
          <span class="font-display italic font-semibold text-2xl leading-none text-[color:var(--ink)]" aria-hidden="true">
            {fmtYear(state.window.to)}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-1 text-xs text-[color:var(--ink-soft)]">
            from
            <input type="number" aria-label="From year value" class="w-20 rounded-md border border-[color:var(--line)] bg-white px-2 py-1 text-sm mono" value={state.window.from} onChange={(e) => setFromYear(Number(e.currentTarget.value))} />
          </label>
          <label class="flex items-center gap-1 text-xs text-[color:var(--ink-soft)]">
            to
            <input type="number" aria-label="To year value" class="w-20 rounded-md border border-[color:var(--line)] bg-white px-2 py-1 text-sm mono" value={state.window.to} onChange={(e) => setToYear(Number(e.currentTarget.value))} />
          </label>
          <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-xs font-medium" onClick={() => fitAll()} aria-label="Fit all to full seeded span">
            <IconMaximize size={14} /> Fit all
          </button>
        </div>
      </div>

      <div ref={trackRef} class="relative h-7 select-none touch-none" data-scrubber-track="true">
        {/* base track */}
        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#e9d8c2,#d8c3a6)" }} />
        {/* selected range */}
        <div class="absolute top-1/2 -translate-y-1/2 h-2 rounded-full" style={{ left: fromPct() + "%", width: Math.max(0, toPct() - fromPct()) + "%", background: "linear-gradient(90deg,#c26a00,#1b6b4a)" }} />
        {/* midpoint chip */}
        <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ left: ((mid() - YEAR_MIN) / span()) * 100 + "%" }}>
          <span class="block rounded-md bg-[#1d1a16] text-[#f3ead9] text-[10px] mono px-1.5 py-0.5 -mt-7">{fmtYear(mid())}</span>
        </div>
        {/* from thumb */}
        <button
          class="scrub-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 shadow cursor-grab active:cursor-grabbing"
          style={{ left: fromPct() + "%", "border-color": "#c26a00" }}
          role="slider"
          aria-label="From year"
          aria-valuemin={YEAR_MIN}
          aria-valuemax={state.window.to - 1}
          aria-valuenow={state.window.from}
          aria-valuetext={fmtYear(state.window.from)}
          tabindex="0"
          onPointerDown={(e) => startDrag("from", e)}
          onKeyDown={(e) => keyThumb("from", e)}
        />
        {/* to thumb */}
        <button
          class="scrub-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 shadow cursor-grab active:cursor-grabbing"
          style={{ left: toPct() + "%", "border-color": "#1b6b4a" }}
          role="slider"
          aria-label="To year"
          aria-valuemin={state.window.from + 1}
          aria-valuemax={YEAR_MAX}
          aria-valuenow={state.window.to}
          aria-valuetext={fmtYear(state.window.to)}
          tabindex="0"
          onPointerDown={(e) => startDrag("to", e)}
          onKeyDown={(e) => keyThumb("to", e)}
        />
      </div>
    </div>
  );
}
