<script lang="ts">
  import { Dialog } from "bits-ui";
  import { DocumentPackageSchema, type DocumentPackage } from "$lib/schemas";

  let {
    open = $bindable(false),
    packageJson,
    onImport,
    onCopy,
    onDownload,
    copied = false,
    downloaded = false,
  } = $props<{
    open: boolean;
    packageJson: string;
    onImport: (data: DocumentPackage) => void;
    onCopy: () => void;
    onDownload: () => void;
    copied?: boolean;
    downloaded?: boolean;
  }>();

  let importText = $state("");
  let importError = $state<string | null>(null);

  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      const result = DocumentPackageSchema.safeParse(parsed);

      if (!result.success) {
        const error = result.error.issues[0];
        importError = `${error.path.join(".")}: ${error.message}`;
        return;
      }

      onImport(result.data);
      open = false;
      importError = null;
      importText = "";
    } catch (e) {
      importError = "Invalid JSON format";
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 transition-opacity" />
    <Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg">
      <Dialog.Title class="text-lg font-semibold">Document Package</Dialog.Title>
      <Dialog.Description class="text-muted-foreground mt-1 text-sm">
        View, export, or import the complete document package JSON.
      </Dialog.Description>

      <div class="mt-4 grid gap-4">
        <div class="flex flex-col gap-2">
          <label for="package-preview" class="text-sm font-medium">Live Package Preview</label>
          <textarea id="package-preview" readonly class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs" rows="8" value={packageJson}></textarea>
          <div class="flex gap-2 justify-end">
            <button onclick={onCopy} class="border-input hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1.5 text-sm transition-colors">{copied ? "Copied" : "Copy package"}</button>
            <button onclick={onDownload} class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm transition-colors">{downloaded ? "Downloaded" : "Download package"}</button>
          </div>
        </div>

        <hr class="border-border" />

        <div class="flex flex-col gap-2">
          <label for="package-import" class="text-sm font-medium">Import Package</label>
          <textarea id="package-import" bind:value={importText} placeholder="Paste document package JSON here..." class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs" rows="4"></textarea>
          {#if importError}
            <span class="text-destructive text-red-500 text-xs">{importError}</span>
          {/if}
          <div class="flex justify-end">
            <button onclick={handleImport} class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm transition-colors">Import package</button>
          </div>
        </div>
      </div>

      <Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <span class="sr-only">Close</span>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
