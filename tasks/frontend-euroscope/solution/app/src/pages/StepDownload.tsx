import { For, Show, createSignal } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowLeft, Check, Download } from "../components/Icon";
import { BITMAPS, ICON_SET_LABELS } from "../data/bitmaps";
import { SWATCH_LABELS, css } from "../data/themes";
import { goBack, replacedCount, state } from "../store";
import PreviewPane from "./PreviewPane";

export default function StepDownload() {
  const [downloaded, setDownloaded] = createSignal(false);

  const download = () => {
    const summary =
      `Custom EuroScope patched build\n` +
      `source: ${state.fileName}\n` +
      `theme: ${state.baseTheme}\n` +
      `swatches: ${state.swatches.map(css).join(" ")}\n` +
      `icon set: ${ICON_SET_LABELS[state.iconSet]} (${replacedCount()}/${BITMAPS.length})\n`;
    const blob = new Blob([summary], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EuroScope.exe";
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  return (
    <>
      <div class="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-4">
        <span class="text-green-600">
          <Check size={20} />
        </span>
        <p class="text-sm font-medium text-green-800" aria-live="polite">
          Patched result generated. Your EuroScope build is ready to download.
        </p>
      </div>

      <div class="flex flex-col gap-3 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Chosen replacements</h2>

        <div class="flex items-center justify-between text-sm">
          <span class="text-scope-fg2">Colour set</span>
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

        <PreviewPane compact />

        <div class="flex items-center justify-between text-sm">
          <span class="text-scope-fg2">Icon set</span>
          <span class="font-medium text-scope-fg1">
            {ICON_SET_LABELS[state.iconSet]}
            <Show when={state.iconSet === "vector"}>
              {" "}
              ({replacedCount()}/{BITMAPS.length})
            </Show>
          </span>
        </div>
      </div>

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
        <Button variant="primary" class="w-[150px]" onClick={download}>
          <Download />
          <span>{downloaded() ? "Downloaded" : "Download"}</span>
        </Button>
      </div>
    </>
  );
}
