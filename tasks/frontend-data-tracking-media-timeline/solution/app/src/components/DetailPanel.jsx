import { createSignal, createMemo, Show, For, createEffect } from "solid-js";
import Modal from "./Modal";
import { state, closeDetail, stepDetail, steppingList, CATEGORIES } from "../store";
import { fmtYear, eraAtYear } from "../format";
import { CATEGORY_COLOR } from "../data";
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-solidjs";

export default function DetailPanel() {
  const [closing, setClosing] = createSignal(false);
  const ev = createMemo(() => state.events.find((e) => e.id === state.selectedId) || null);

  // when store closes the detail (e.g. via delete/undo), play the exit settle then unmount
  createEffect(() => {
    if (!state.detailOpen && !closing()) {
      // nothing to animate
    }
  });

  function close() {
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      closeDetail();
      setTimeout(() => setClosing(false), 200);
    }, 180);
  }

  function onKey(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepDetail(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepDetail(1);
    }
  }

  const list = steppingList;
  const pos = createMemo(() => {
    const arr = list();
    const i = arr.findIndex((e) => e.id === state.selectedId);
    return { i, n: arr.length };
  });

  return (
    <Modal
      open={state.detailOpen}
      closing={closing()}
      onClose={close}
      onKeyDown={onKey}
      label="Event detail"
      contentClass="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[86vh] overflow-auto thin-scroll border border-[color:var(--line)]"
    >
      <Show
        when={ev()}
        fallback={<div class="p-6 text-sm text-[color:var(--ink-soft)]">No event selected.</div>}
      >
        {(e) => {
          const era = () => eraAtYear(e().year);
          return (
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-display italic text-sm text-[color:var(--ink-soft)] tracking-wide">
                    {fmtYear(e().year)} &middot; {e().place}
                  </p>
                  <h2 class="font-display text-[26px] leading-tight font-semibold tracking-tight mt-0.5">{e().title}</h2>
                </div>
                <button class="chrome-btn rounded-lg p-1.5 hover:bg-[color:var(--paper-deep)] shrink-0" onClick={close} aria-label="Close detail and return to stage">
                  <IconX size={20} />
                </button>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span class="rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] px-2.5 py-0.5 font-medium">{e().type}</span>
                <span class="rounded-full border border-[color:var(--line)] px-2.5 py-0.5 text-[color:var(--ink-soft)]">{era().name}</span>
                <For each={e().categories}>
                  {(c) => (
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium" style={{ background: CATEGORY_COLOR[c] + "22", color: CATEGORY_COLOR[c] }}>
                      <span class="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
                      {c}
                    </span>
                  )}
                </For>
              </div>

              <p class="mt-3 text-[15px] leading-relaxed text-[color:var(--ink-soft)]">{e().summary}</p>

              <div class="mt-4">
                <h3 class="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)] mb-1">mediaRefs</h3>
                <div class="flex flex-wrap gap-1.5">
                  <For each={e().mediaRefs}>
                    {(m) => <span class="mono text-[11px] rounded-md bg-[#1d1a16] text-[#f3ead9] px-2 py-0.5">{m}</span>}
                  </For>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-[color:var(--ink-soft)]">
                <div>
                  <span class="font-semibold text-[color:var(--ink)]">source</span> &middot; {e().source}
                </div>
                <div class="mono">
                  <span class="font-semibold text-[color:var(--ink)] not-italic" style={{ "font-family": "var(--font-body)" }}>timestamp</span> &middot; {e().timestamp}
                </div>
              </div>

              <div class="mt-5 flex items-center justify-between border-t border-[color:var(--line)] pt-3">
                <span class="text-xs text-[color:var(--ink-soft)]">
                  {pos().i + 1} of {pos().n} in view &middot; use &larr; / &rarr;
                </span>
                <div class="flex gap-2">
                  <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-3 py-1.5 text-sm font-medium" onClick={() => stepDetail(-1)} aria-label="Previous event">
                    <IconChevronLeft size={16} /> Previous
                  </button>
                  <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-3 py-1.5 text-sm font-medium" onClick={() => stepDetail(1)} aria-label="Next event">
                    Next <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      </Show>
    </Modal>
  );
}
