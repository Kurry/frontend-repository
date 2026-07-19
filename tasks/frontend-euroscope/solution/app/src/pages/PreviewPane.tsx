import { css } from "../data/themes";
import { state } from "../store";

// Live scope preview: two stacked panels tinted by the working swatches, the
// same mechanism the upstream Page2 preview used.
export default function PreviewPane(props: { compact?: boolean }) {
  const s = () => state.swatches;
  return (
    <div
      class="grid grid-cols-2 overflow-hidden rounded-md border border-scope-bg3"
      style={{ height: props.compact ? "72px" : "96px" }}
      data-testid="scope-preview"
    >
      <div
        class="flex items-center justify-center border-r border-black/20"
        style={{ background: css(s()[2]) }}
      >
        <div
          class="rounded px-3 py-1.5 text-sm font-medium"
          style={{ background: css(s()[1]), color: "#ffffff" }}
        >
          Primary
        </div>
      </div>
      <div
        class="flex items-center justify-center"
        style={{ background: css(s()[4]) }}
      >
        <div
          class="rounded px-3 py-1.5 text-sm font-medium"
          style={{ background: css(s()[3]), color: css(s()[5]) }}
        >
          Secondary
        </div>
      </div>
    </div>
  );
}
