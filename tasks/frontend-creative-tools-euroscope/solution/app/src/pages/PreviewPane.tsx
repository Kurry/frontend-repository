import { Show } from "solid-js";
import { css, simulate } from "../data/colour";
import { BASE_COMPARE_ID, previewColours, state } from "../store";

// Live scope preview: two side-by-side panels (Primary and Secondary) tinted
// from the working swatches. The colour-blindness simulation shifts only the
// rendered colours here — the six hex field values never change — and the
// Before/After compare swaps in the snapshot palette without touching state.

export default function PreviewPane(props: { compact?: boolean }) {
  const render = () => {
    const cols = previewColours();
    const mode = state.colourBlindness;
    return cols.map((c) => simulate(c, mode));
  };
  const compareLabel = () => {
    if (!state.compare) return null;
    if (state.compare.id === BASE_COMPARE_ID) {
      return state.compare.view === "before"
        ? "Before — base theme"
        : "After — current edit";
    }
    const snap = state.snapshots.find((s) => s.id === state.compare!.id);
    if (!snap) return null;
    return state.compare.view === "before"
      ? `Before — snapshot “${snap.name}”`
      : "After — current edit";
  };
  return (
    <div class="relative">
      <div
        class="grid grid-cols-2 overflow-hidden rounded-md border border-scope-bg3"
        style={{ height: props.compact ? "72px" : "96px" }}
        data-testid="scope-preview"
        role="img"
        aria-label="Live scope preview tinted from the working colours"
      >
        <div
          class="flex items-center justify-center border-r border-black/20 transition-colors duration-150"
          style={{ background: css(render()[2]) }}
        >
          <div
            class="rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150"
            style={{ background: css(render()[1]), color: "#ffffff" }}
          >
            Primary
          </div>
        </div>
        <div
          class="flex items-center justify-center transition-colors duration-150"
          style={{ background: css(render()[4]) }}
        >
          <div
            class="rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150"
            style={{
              background: css(render()[3]),
              color: css(render()[5]),
            }}
          >
            Secondary
          </div>
        </div>
      </div>
      <Show when={compareLabel()}>
        {(label) => (
          <span class="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {label()}
          </span>
        )}
      </Show>
    </div>
  );
}
