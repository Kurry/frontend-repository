import { For } from "solid-js";
import { contrastRatio, css } from "../data/colour";
import { SWATCH_LABELS } from "../data/themes";
import { state } from "../store";

// Live ATC contrast matrix: WCAG AA (4.5:1) verdicts for the pairings that
// matter on a scope. Ratios and Pass/Fail marks recompute the instant any
// swatch changes, because everything derives from the shared store.

const PAIRINGS: { fg: number; bg: number }[] = [
  { fg: 0, bg: 5 }, // Backdrop darkest on Foreground secondary
  { fg: 2, bg: 5 }, // Backdrop main on Foreground secondary
  { fg: 4, bg: 0 }, // Backdrop lightest on Backdrop darkest
];

export default function ContrastMatrix() {
  const passing = () =>
    PAIRINGS.filter(
      (p) => contrastRatio(state.swatches[p.fg], state.swatches[p.bg]) >= 4.5,
    ).length;
  return (
    <div class="flex flex-col gap-2 rounded-lg border border-scope-bg3 bg-white p-4">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-base font-medium text-scope-fg1">ATC contrast matrix</h2>
        <span class="text-xs text-scope-fg2" aria-live="polite">
          {passing()} of {PAIRINGS.length} pairings pass WCAG AA
        </span>
      </div>
      <ul class="flex flex-col gap-1.5">
        <For each={PAIRINGS}>
          {(p) => {
            const ratio = () =>
              contrastRatio(state.swatches[p.fg], state.swatches[p.bg]);
            const pass = () => ratio() >= 4.5;
            return (
              <li class="flex items-center gap-2 rounded-md bg-scope-bg2/50 px-2.5 py-1.5 text-sm">
                <span
                  class="flex h-5 w-9 shrink-0 items-center justify-center rounded border border-black/10 text-[10px] font-semibold"
                  style={{
                    background: css(state.swatches[p.bg]),
                    color: css(state.swatches[p.fg]),
                  }}
                  aria-hidden="true"
                >
                  Aa
                </span>
                <span class="min-w-0 grow truncate text-scope-fg1">
                  {SWATCH_LABELS[p.fg]} on {SWATCH_LABELS[p.bg]}
                </span>
                <span class="shrink-0 font-mono text-xs text-scope-fg2">
                  {ratio().toFixed(2)}:1
                </span>
                <span
                  classList={{
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold": true,
                    "bg-green-100 text-green-800": pass(),
                    "bg-amber-100 text-amber-800": !pass(),
                  }}
                >
                  {pass() ? "Pass" : "Fail"}
                </span>
              </li>
            );
          }}
        </For>
      </ul>
    </div>
  );
}
