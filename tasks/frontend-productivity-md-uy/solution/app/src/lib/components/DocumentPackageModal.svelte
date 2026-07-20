<script lang="ts">
  import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
  import { Dialog } from "bits-ui";
  import { DocumentPackageSchema } from "$lib/schemas";

  let {
    open = $bindable(false),
    packageJson,
    onImport,
    onCopy,
    onDownload,
  } = $props<{
    open: boolean;
    packageJson: string;
    onImport: (content: string) => void;
    onCopy: () => void;
    onDownload: () => void;
  }>();

  let importText = $state("");
  let importError = $state<string | null>(null);

  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      const result = DocumentPackageSchema.safeParse(parsed);

      if (!result.success) {
        const error = result.error.errors[0];
        importError = `${error.path.join(".")}: ${error.message}`;
        return;
      }

      onImport(importText);
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
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }} />
    <Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}>
      <Dialog.Title class="text-lg font-semibold">Document package</Dialog.Title>

      <div class="mt-4 grid gap-4">
        <div class="flex flex-col gap-2">
          <label for="package-preview" class="text-sm font-medium">Preview</label>
          <textarea id="package-preview" readonly class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs" rows="8" value={packageJson}></textarea>
          <div class="flex gap-2 justify-end mt-1">
            <button onclick={onCopy} class="border-input hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1.5 text-sm transition-colors">Copy package</button>
            <button onclick={onDownload} class="border-input hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1.5 text-sm transition-colors">Download package</button>
          </div>
        </div>

        <div class="flex flex-col gap-2 mt-2">
          <label for="package-import" class="text-sm font-medium">Import</label>
          <textarea id="package-import" bind:value={importText} placeholder="Paste JSON here..." class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs" rows="4"></textarea>
          {#if importError}
            <span class="text-destructive text-red-500 text-xs">{importError}</span>
          {/if}
          <div class="flex justify-end mt-1">
            <button onclick={handleImport} class="border-input hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1.5 text-sm transition-colors">Import package</button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <Dialog.Close class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm">Close</Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
