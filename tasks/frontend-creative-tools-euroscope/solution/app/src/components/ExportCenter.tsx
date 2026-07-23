import { For, Show, createSignal } from "solid-js";
import {
  copyExport,
  downloadRecipe,
  exportTabText,
  importRecipeText,
  setActiveExportTab,
  state,
  type PatcherState,
} from "../store";
import Button from "./Button";
import { Check, Copy, Download, ImportIcon } from "./Icon";
import Alert from "./Alert";

const TABS: { id: PatcherState["activeExportTab"]; label: string }[] = [
  { id: "recipe", label: "Patch recipe JSON" },
  { id: "css", label: "Theme CSS" },
  { id: "summary", label: "Summary" },
];

// Export center: three tabs whose monospaced preview text is compiled live
// from the session store. Copy export uses the clipboard and shows a short
// confirmation that reverts; Download recipe writes patch-recipe.json;
// Import recipe validates through the same Patch recipe field contract and
// changes nothing (with a field-naming error) unless the file conforms.

export default function ExportCenter() {
  const [copied, setCopied] = createSignal(false);
  const [recipeDownloaded, setRecipeDownloaded] = createSignal(false);
  const [importStatus, setImportStatus] = createSignal<{
    ok: boolean;
    message: string;
  } | null>(null);
  let fileRef: HTMLInputElement | undefined;
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const onCopy = async () => {
    const ok = await copyExport();
    if (!ok) return;
    setCopied(true);
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => setCopied(false), 1600);
  };

  const onDownloadRecipe = () => {
    downloadRecipe();
    setRecipeDownloaded(true);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importRecipeText(String(reader.result ?? ""));
      setImportStatus(result);
    };
    reader.onerror = () =>
      setImportStatus({ ok: false, message: "Import failed: could not read the file." });
    reader.readAsText(file);
  };

  return (
    <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
      <h2 class="text-base font-medium text-scope-fg1">Export center</h2>

      <div role="tablist" aria-label="Export previews" class="flex flex-wrap gap-1.5">
        <For each={TABS}>
          {(tab) => (
            <button
              type="button"
              role="tab"
              id={`export-tab-${tab.id}`}
              aria-selected={state.activeExportTab === tab.id}
              aria-controls="export-preview-panel"
              onClick={() => setActiveExportTab(tab.id)}
              classList={{
                "h-10 cursor-pointer rounded-md border-2 px-3 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-scope-accent focus-visible:ring-offset-1":
                  true,
                "border-scope-accent bg-scope-accent text-white":
                  state.activeExportTab === tab.id,
                "border-scope-bg2 bg-scope-bg2 text-scope-fg1 hover:border-scope-bg3 hover:bg-white":
                  state.activeExportTab !== tab.id,
              }}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>

      <pre
        id="export-preview-panel"
        role="tabpanel"
        aria-labelledby={`export-tab-${state.activeExportTab}`}
        aria-label="Export preview"
        data-export-preview
        class="max-h-[220px] overflow-auto rounded-md border border-scope-bg3 bg-scope-bg2/50 p-3 font-mono text-[11px] leading-relaxed text-scope-fg1"
      >
        {exportTabText(state.activeExportTab)}
      </pre>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onCopy}>
          <Copy />
          <span>Copy export</span>
        </Button>
        <Show when={copied()}>
          {(flag) => (
            <span
              role="status"
              aria-live="polite"
              classList={{
                "confirm-in inline-flex items-center gap-1 text-xs font-medium text-green-700":
                  true,
                "opacity-100": flag(),
              }}
            >
              <Check size={14} label="Copied" />
              Copied export to clipboard.
            </span>
          )}
        </Show>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onDownloadRecipe}>
          <Download />
          <span>{recipeDownloaded() ? "Recipe downloaded" : "Download recipe"}</span>
        </Button>

        <Button variant="ghost" onClick={() => fileRef?.click()}>
          <ImportIcon />
          <span>Import recipe</span>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import recipe file"
          class="hidden"
          onChange={(e) => {
            onFile(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <div aria-live="polite">
        <Show when={importStatus()}>
          {(status) => (
            <Show when={!status().ok} fallback={
              <p role="status" class="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
                {status().message}
              </p>
            }>
              <div role="status" class="mt-2 text-left">
                <Alert type="warn"><p>{status().message}</p></Alert>
              </div>
            </Show>
          )}
        </Show>
      </div>
    </div>
  );
}
