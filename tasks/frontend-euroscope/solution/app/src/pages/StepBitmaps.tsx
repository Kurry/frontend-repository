import { For, Show, createSignal } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowLeft, ArrowRight, Reset, Swap } from "../components/Icon";
import { BITMAPS, ICON_SET_LABELS, type Bitmap, type IconSet } from "../data/bitmaps";
import { css } from "../data/themes";
import {
  bitmapReplaced,
  goBack,
  goNext,
  replacedCount,
  selectIconSet,
  state,
  toggleKeepOriginal,
} from "../store";

function Tile(props: { bm: Bitmap; replaced: boolean }) {
  const bg = () => css(state.swatches[2]);
  const fg = () => css(state.swatches[5]);
  return (
    <div
      class="flex h-14 w-14 items-center justify-center rounded-md border border-scope-bg3"
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
        <select
          aria-label="Base icon set"
          class="h-[28px] w-[190px] cursor-pointer rounded-md border-2 border-scope-bg2 bg-scope-bg2 px-2 text-sm hover:border-scope-bg3 focus:border-scope-accent focus:outline-none"
          value={state.iconSet}
          onInput={(e) => selectIconSet(e.currentTarget.value as IconSet)}
        >
          <option value="none">{ICON_SET_LABELS.none}</option>
          <option value="vector">{ICON_SET_LABELS.vector}</option>
        </select>
        <p class="text-sm text-scope-fg2" aria-live="polite">
          <Show
            when={state.iconSet === "vector"}
            fallback={<>Keeping the original embedded bitmaps.</>}
          >
            {replacedCount()} of {BITMAPS.length} bitmaps set to Vector.
          </Show>
        </p>
      </div>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-medium text-scope-fg1">Preview</h2>
          <Show when={!advanced()}>
            <Button variant="ghost" onClick={() => setAdvanced(true)}>
              <span>Show advanced options</span>
            </Button>
          </Show>
        </div>

        <Show
          when={advanced()}
          fallback={
            <div class="scope-scroll flex flex-wrap gap-2.5">
              <For each={BITMAPS}>
                {(bm) => <Tile bm={bm} replaced={bitmapReplaced(bm.id)} />}
              </For>
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <For each={BITMAPS}>
              {(bm) => (
                <div class="flex items-center gap-3 rounded-md border border-scope-bg3 p-2 transition-colors hover:bg-scope-bg2/50">
                  <Tile bm={bm} replaced={bitmapReplaced(bm.id)} />
                  <div class="grow">
                    <h3 class="text-sm font-medium text-scope-fg1">
                      Bitmap {bm.id}
                    </h3>
                    <p class="text-xs text-scope-fg2">
                      {bm.width}&#215;{bm.height} @ {bm.bpp}bpp &middot;{" "}
                      {bitmapReplaced(bm.id) ? "Vector" : "Original"}
                    </p>
                  </div>
                  <Show when={state.iconSet === "vector"}>
                    <Button variant="ghost" onClick={() => toggleKeepOriginal(bm.id)}>
                      <Show
                        when={state.keepOriginal[String(bm.id)]}
                        fallback={
                          <>
                            <Reset />
                            <span>Keep original</span>
                          </>
                        }
                      >
                        <Swap />
                        <span>Use vector</span>
                      </Show>
                    </Button>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
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
