<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { DocumentPackageSchema, type DocumentPackage } from '$lib/schemas';
	import { Package, Copy, DownloadSimple, Check, X } from 'phosphor-svelte';

	let {
		open = $bindable(false),
		packageJson,
		onImport,
		onCopy,
		onDownload,
		copied = false,
		downloaded = false
	} = $props<{
		open: boolean;
		packageJson: string;
		onImport: (data: DocumentPackage) => void;
		onCopy: () => void;
		onDownload: () => void;
		copied?: boolean;
		downloaded?: boolean;
	}>();

	let importText = $state('');
	let importError = $state<string | null>(null);

	function handleImport() {
		try {
			const parsed = JSON.parse(importText);
			const result = DocumentPackageSchema.safeParse(parsed);

			if (!result.success) {
				const error = result.error.issues[0];
				const path = error.path.length ? error.path.join('.') : 'document';
				importError = `${path}: ${error.message}`;
				return;
			}

			onImport(result.data);
			open = false;
			importError = null;
			importText = '';
		} catch {
			importError = 'Invalid JSON format';
		}
	}

	function onFilePick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			importText = String(reader.result ?? '');
			importError = null;
		};
		reader.readAsText(file);
		input.value = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="dialog-overlay fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out"
		/>
		<Dialog.Content
			class="dialog-content bg-popover text-popover-foreground fixed top-[50%] left-[50%] z-50 w-[min(92vw,32rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg data-[state=open]:animate-dialog-pop-in data-[state=closed]:animate-dialog-pop-out"
		>
			<Dialog.Title class="flex items-center gap-2 text-lg font-semibold">
				<Package size={18} aria-hidden="true" />
				Document package
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground mt-1 text-sm">
				View, export, or import the complete document package JSON.
			</Dialog.Description>

			<div class="mt-4 grid gap-4">
				<div class="flex flex-col gap-2">
					<label for="package-preview" class="text-sm font-medium">Live package preview</label>
					<textarea
						id="package-preview"
						readonly
						class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs"
						rows="8"
						value={packageJson}
					></textarea>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={onCopy}
							class="chrome-btn border-input hover:bg-accent hover:text-accent-foreground flex min-h-11 items-center gap-1.5 rounded border px-3 text-sm"
						>
							{#if copied}
								<Check size={14} class="text-green-500" aria-hidden="true" />
								Copied
							{:else}
								<Copy size={14} aria-hidden="true" />
								Copy package
							{/if}
						</button>
						<button
							type="button"
							onclick={onDownload}
							class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 flex min-h-11 items-center gap-1.5 rounded px-3 text-sm"
						>
							{#if downloaded}
								<Check size={14} aria-hidden="true" />
								Downloaded
							{:else}
								<DownloadSimple size={14} aria-hidden="true" />
								Download package
							{/if}
						</button>
					</div>
				</div>

				<hr class="border-border" />

				<div class="flex flex-col gap-2">
					<label for="package-import" class="text-sm font-medium">Import package</label>
					<textarea
						id="package-import"
						bind:value={importText}
						placeholder="Paste document package JSON here..."
						class="border-input bg-background w-full rounded border px-3 py-2 font-mono text-xs"
						rows="4"
					></textarea>
					<input
						type="file"
						accept="application/json,.json"
						aria-label="Pick document package JSON file"
						class="text-sm"
						onchange={onFilePick}
					/>
					{#if importError}
						<span class="text-destructive text-xs text-red-500" role="alert">{importError}</span>
					{/if}
					<div class="flex justify-end">
						<button
							type="button"
							onclick={handleImport}
							class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 rounded px-3 text-sm"
						>
							Import package
						</button>
					</div>
				</div>
			</div>

			<Dialog.Close
				class="chrome-btn absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
				aria-label="Close document package dialog"
			>
				<X size={16} aria-hidden="true" />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
