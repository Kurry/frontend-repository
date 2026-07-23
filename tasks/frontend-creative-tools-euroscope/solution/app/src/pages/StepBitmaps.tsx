import { For, Show, createSignal } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowLeft, ArrowRight, Dropdown, Reset, Swap } from "../components/Icon";
import { BITMAPS, ICON_SET_LABELS, type Bitmap, type IconSet } from "../data/bitmaps";
import { css } from "../data/themes";
import {
  batchKeepOriginal,
  bitmapReplaced,
  clearSelection,
  goBack,
  goNext,
  replacedCount,
  selectIconSet,
  selectedTileCount,
  setKeepOriginal,
  state,
  toggleTileSelected,
} from "../store";

function Tile(props: { bm: Bitmap; replaced: boolean }) {
  const bg = () => css(state.swatches[2]);
  const fg = () => css(state.swatches[5]);
  return (
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-scope-bg3 transition-colors duration-150"
      style={
        props.replaced
          ? { background: bg(), color: "#ffffff" }
          : { background: "#e5e5e5", color: "#8a8a8a" }
      }
      title={props.replaced ? "Vector (recoloured)" : "Original"}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill={props.replaced ? fg() : "currentColor"}
        aria-hidden="true"
      >
        <path d={props.bm.glyph} />
      </svg>
    </div>
  );
}

export default function StepBitmaps() {
  const [advanced, setAdvanced] = createSignal(false);
  return (
    <>
      <div class="rounded-lg border border-scope-bg3 bg-white p-4">
        <p class="text-sm leading-relaxed">
          The EuroScope executable embeds many bitmaps used for buttons and
          other UI. To match your new colours, choose one of the base icon sets
          below.
        </p>
      </div>

      <Alert type="warn">
        <p>
          For icons and UI elements to match your selected theme, choose Vector
          as your icon set.
        </p>
      </Alert>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Base icon set</h2>
        <span class="relative inline-flex">
          <select
            aria-label="Base icon set"
            class="h-[46px] w-[210px] cursor-pointer appearance-none rounded-md border-2 border-scope-bg2 bg-scope-bg2 pl-3 pr-9 text-sm font-medium text-scope-fg1 transition-[border-color,box-shadow] duration-150 hover:border-scope-bg3 hover:shadow-sm focus:border-scope-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-scope-accent focus-visible:ring-offset-1"
            value={state.iconSet}
            onChange={(e) => selectIconSet(e.currentTarget.value as IconSet)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
              e.preventDefault();
              const options: IconSet[] = ["none", "vector"];
              const current = options.indexOf(state.iconSet);
              const next = Math.max(
                0,
                Math.min(options.length - 1, current + (e.key === "ArrowDown" ? 1 : -1)),
              );
              if (next !== current) selectIconSet(options[next]);
            }}
          >
            <option value="none">{ICON_SET_LABELS.none}</option>
            <option value="vector">{ICON_SET_LABELS.vector}</option>
          </select>
          <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-scope-fg2">
            <Dropdown size={16} />
          </span>
        </span>
        <p class="text-sm text-scope-fg2" aria-live="polite">
          {replacedCount()} of {BITMAPS.length} bitmaps set to Vector.
          <Show when={state.iconSet === "none"}> Keeping the original embedded bitmaps.</Show>
        </p>
      </div>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-medium text-scope-fg1">Preview</h2>
          <Button
            variant="ghost"
            small
            aria-expanded={advanced()}
            onClick={() => setAdvanced(!advanced())}
          >
            <span>
              {advanced() ? "Hide advanced options" : "Show advanced options"}
            </span>
          </Button>
        </div>

        <div class="flex flex-wrap gap-2.5">
          <For each={BITMAPS}>
            {(bm) => <Tile bm={bm} replaced={bitmapReplaced(bm.id)} />}
          </For>
        </div>

        {/* animated height expand for the per-bitmap list */}
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ "grid-template-rows": advanced() ? "1fr" : "0fr" }}
        >
          <div class="min-h-0 overflow-hidden">
            <div class="flex flex-col gap-2 pt-1">
              <div class="flex flex-wrap items-center gap-2 rounded-md bg-scope-bg2/60 px-2.5 py-2">
                <span class="text-xs font-medium text-scope-fg2" aria-live="polite">
                  {selectedTileCount()} of {BITMAPS.length} selected
                </span>
                <span class="grow" />
                <Button
                  small
                  variant="ghost"
                  disabled={selectedTileCount() === 0 || state.iconSet !== "vector"}
                  onClick={() => batchKeepOriginal(true)}
                >
                  <Reset size={13} />
                  <span>Keep original selected</span>
                </Button>
                <Button
                  small
                  variant="ghost"
                  disabled={selectedTileCount() === 0 || state.iconSet !== "vector"}
                  onClick={() => batchKeepOriginal(false)}
                >
                  <Swap size={13} />
                  <span>Use Vector selected</span>
                </Button>
                <Show when={selectedTileCount() > 0}>
                  <Button small variant="ghost" onClick={() => clearSelection()}>
                    Clear
                  </Button>
                </Show>
              </div>

              <For each={BITMAPS}>
                {(bm) => {
                  const key = () => String(bm.id);
                  return (
                    <div
                      classList={{
                        "flex items-center gap-3 rounded-md border p-2 transition-colors duration-100":
                          true,
                        "border-scope-accent/50 bg-scope-info": state.selection[key()],
                        "border-scope-bg3 hover:bg-scope-bg2/60": !state.selection[key()],
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select bitmap ${bm.id}`}
                        class="h-[18px] w-[18px] shrink-0 cursor-pointer accent-scope-accent"
                        checked={Boolean(state.selection[key()])}
                        onChange={() => toggleTileSelected(bm.id)}
                      />
                      <Tile bm={bm} replaced={bitmapReplaced(bm.id)} />
                      <div class="min-w-0 grow">
                        <h3 class="text-sm font-medium text-scope-fg1">
                          Bitmap {bm.id}
                        </h3>
                        <p class="text-xs text-scope-fg2">
                          {bm.width}&#215;{bm.height} @ {bm.bpp}bpp &middot;{" "}
                          {bitmapReplaced(bm.id) ? "Vector" : "Original"}
                        </p>
                      </div>
                      <Show when={state.iconSet === "vector"}>
                        <Button
                          small
                          variant="ghost"
                          aria-pressed={Boolean(state.keepOriginal[key()])}
                          onClick={() =>
                            setKeepOriginal(bm.id, !state.keepOriginal[key()])
                          }
                        >
                          <Show
                            when={state.keepOriginal[key()]}
                            fallback={
                              <>
                                <Reset size={13} />
                                <span>Keep original</span>
                              </>
                            }
                          >
                            <Swap size={13} />
                            <span>Use Vector</span>
                          </Show>
                        </Button>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between">
        <Button variant="ghost" class="w-[110px]" onClick={() => goBack()}>
          <ArrowLeft />
          <span>Back</span>
        </Button>
        <Button variant="primary" class="w-[130px]" onClick={() => goNext()}>
          <span>Generate</span>
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}
