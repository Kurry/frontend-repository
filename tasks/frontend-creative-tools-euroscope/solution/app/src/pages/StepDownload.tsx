import { For, Show } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import ExportCenter from "../components/ExportCenter";
import { ArrowLeft, Check, Download } from "../components/Icon";
import { BITMAPS, ICON_SET_LABELS } from "../data/bitmaps";
import { SWATCH_LABELS, THEMES, css } from "../data/themes";
import { downloadPatched, goBack, replacedCount, state } from "../store";
import PreviewPane from "./PreviewPane";

export default function StepDownload() {
  const customised = () =>
    state.swatches
      .map((value, i) => ({ label: SWATCH_LABELS[i], value, base: THEMES[state.baseTheme][i] }))
      .filter((row) => css(row.value) !== css(row.base));

  return (
    <>
      <div class="confirm-in flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-4">
        <span class="text-green-600">
          <Check size={20} label="Patched result generated" />
        </span>
        <p class="text-sm font-medium text-green-800" aria-live="polite">
          Patched result generated. Your EuroScope build is ready to download.
        </p>
      </div>

      <div class="flex flex-col gap-3 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Chosen replacements</h2>

        <div class="flex items-center justify-between text-sm">
          <span class="text-scope-fg2">Base theme</span>
          <span class="font-medium text-scope-fg1">{state.baseTheme}</span>
        </div>

        <div class="flex gap-1.5" aria-label="Selected swatches">
          <For each={state.swatches}>
            {(value, i) => (
              <div
                class="h-8 w-full rounded border border-scope-bg3"
                style={{ background: css(value) }}
                title={`${SWATCH_LABELS[i()]} ${css(value)}`}
              />
            )}
          </For>
        </div>

        <Show
          when={customised().length > 0}
          fallback={
            <p class="text-xs text-scope-fg2">
              No custom colours — using the {state.baseTheme} palette unchanged.
            </p>
          }
        >
          <div class="rounded-md border border-scope-bg3 bg-scope-bg2/40 p-2.5">
            <p class="mb-1.5 text-xs font-medium text-scope-fg2">
              Changes from base theme ({customised().length} of 6 swatches)
            </p>
            <ul class="flex flex-col gap-1">
              <For each={customised()}>
                {(row) => (
                  <li class="flex items-center gap-2 text-xs text-scope-fg1">
                    <span class="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10" style={{ background: css(row.base) }} aria-hidden="true" />
                    <span aria-hidden="true" class="text-scope-fg3">→</span>
                    <span class="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10" style={{ background: css(row.value) }} aria-hidden="true" />
                    <span class="grow truncate">{row.label}</span>
                    <span class="font-mono text-[10px] text-scope-fg2">
                      {css(row.base)} → {css(row.value)}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>

        <PreviewPane compact />

        <div class="flex items-center justify-between text-sm">
          <span class="text-scope-fg2">Base icon set</span>
          <span class="font-medium text-scope-fg1">
            {ICON_SET_LABELS[state.iconSet]}
          </span>
        </div>
        <p class="-mt-1 text-xs text-scope-fg2" aria-live="polite">
          {replacedCount()} of {BITMAPS.length} bitmaps replaced.
        </p>
      </div>

      <ExportCenter />

      <Alert type="caut">
        <p>
          Keep a backup of the original EuroScope executable under a different
          name, so it can be restored if needed.
        </p>
      </Alert>

      <div class="flex justify-between">
        <Button variant="ghost" class="w-[110px]" onClick={() => goBack()}>
          <ArrowLeft />
          <span>Back</span>
        </Button>
        <Button variant="primary" class="min-w-[150px]" onClick={() => downloadPatched()}>
          <Download />
          <span>{state.downloaded ? "Downloaded" : "Download"}</span>
        </Button>
      </div>
    </>
  );
}
