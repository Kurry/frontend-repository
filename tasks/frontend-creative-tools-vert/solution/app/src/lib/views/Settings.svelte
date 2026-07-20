<script>
	import { store, setSettings, setTheme, savePreset, loadPreset, deletePreset, importSession, compileSession, targetsFor } from "../store.svelte.js";
	import { SettingsUpdate, ConversionPreset } from "../schemas.js";
	import { superForm, defaults } from "sveltekit-superforms";
	import { zod } from "sveltekit-superforms/adapters";
	import * as Form from "formsnap";
	import { Select, Dialog } from "bits-ui";

	const targets = targetsFor();

	const form = superForm(
		defaults({ quality: store.quality, keepMetadata: store.keepMetadata, defaultTarget: store.defaultTarget }, zod(SettingsUpdate)),
		{
			SPA: true,
			validators: zod(SettingsUpdate),
			onUpdate({ form }) {
				if (form.valid) {
					setSettings(form.data);
				}
			}
		}
	);
	const { form: formData, enhance } = form;

	$effect(() => {
		$formData.quality = store.quality;
		$formData.keepMetadata = store.keepMetadata;
		$formData.defaultTarget = store.defaultTarget;
	});

	let presetOpen = $state(false);
	const presetForm = superForm(
		defaults({ name: "", quality: store.quality, target: store.defaultTarget, keepMetadata: store.keepMetadata }, zod(ConversionPreset)),
		{
			SPA: true,
			validators: zod(ConversionPreset),
			onUpdate({ form }) {
				if (form.valid) {
					savePreset(form.data.name, form.data.quality, form.data.target, form.data.keepMetadata);
					presetOpen = false;
				}
			}
		}
	);
	const { form: presetData, enhance: presetEnhance } = presetForm;

	function openPresetDialog() {
		$presetData.name = "";
		$presetData.quality = store.quality;
		$presetData.target = store.defaultTarget;
		$presetData.keepMetadata = store.keepMetadata;
		presetOpen = true;
	}

	let importOpen = $state(false);
	let importText = $state("");
	let importError = $state("");
	let importSuccess = $state(false);

	function handleImport() {
		try {
			const doc = JSON.parse(importText);
			if (importSession(doc)) {
				importError = "";
				importSuccess = true;
				setTimeout(() => {
					importSuccess = false;
					importOpen = false;
				}, 1500);
			} else {
				importError = "Invalid session document structure";
			}
		} catch (e) {
			importError = "Invalid JSON";
		}
	}

	let exportOpen = $state(false);
	let exportText = $derived(JSON.stringify(compileSession(), null, 2));
	let exportCopied = $state(false);

	function copyExport() {
		navigator.clipboard.writeText(exportText).then(() => {
			exportCopied = true;
			setTimeout(() => { exportCopied = false; }, 2000);
		});
	}
</script>

<div class="page motion-safe:transition-all">
	<h1>Settings</h1>
	<p>Configure how VERT converts your files. Everything runs locally in your browser.</p>

	<form method="POST" use:enhance>
		<h2>Conversion</h2>
		<Form.Field {form} name="quality">
			<Form.Control>
				{#snippet children({ props })}
				<div class="setting-row">
					<div>
						<Form.Label class="setting-label">Output quality</Form.Label>
						<Form.Description class="setting-help">
							Compression quality for jpeg and webp output, from 1 to 100
						</Form.Description>
					</div>
					<div style="display:flex;align-items:center;gap:12px">
						<input type="range" min="1" max="100" aria-label="Output quality" {...props} bind:value={$formData.quality} class="focus-visible:ring-2" />
						<span style="min-width:3ch;font-weight:600">{$formData.quality}</span>
					</div>
				</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-bad text-sm mt-1" />
		</Form.Field>

		<Form.Field {form} name="keepMetadata">
			<Form.Control>
				{#snippet children({ props })}
				<div class="setting-row">
					<div>
						<Form.Label class="setting-label">Keep metadata</Form.Label>
						<Form.Description class="setting-help">Preserve image metadata where the target format allows it</Form.Description>
					</div>
					<label class="switch">
						<input type="checkbox" {...props} bind:checked={$formData.keepMetadata} class="focus-visible:ring-2 focus-visible:ring-offset-2" />
						<span>{$formData.keepMetadata ? "On" : "Off"}</span>
					</label>
				</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-bad text-sm mt-1" />
		</Form.Field>

		<Form.Field {form} name="defaultTarget">
			<Form.Control>
				{#snippet children({ props })}
				<div class="setting-row">
					<div>
						<Form.Label class="setting-label">Default Target</Form.Label>
						<Form.Description class="setting-help">Default output format for newly added files</Form.Description>
					</div>
					<Select.Root type="single" name={props.name} bind:value={$formData.defaultTarget}>
						<Select.Trigger class="btn focus-visible:ring-2 bg-surface" aria-label="Default target format">
							{$formData.defaultTarget.slice(1)}
						</Select.Trigger>
						<Select.Content class="bg-surface border border-border rounded shadow-lg p-1 z-50">
							{#each targets as t}
								<Select.Item value={t} class="px-3 py-1.5 cursor-pointer hover:bg-surface-2 rounded">
									{t.slice(1)}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-bad text-sm mt-1" />
		</Form.Field>

		<div class="mt-4 mb-8">
			<button class="btn btn-primary min-h-[44px] min-w-[44px] focus-visible:ring-2">Apply Settings</button>
		</div>
	</form>

	<div class="divider"></div>

	<h2>Presets</h2>
	<p class="setting-help">Save your current settings as a preset for quick access.</p>

	<div class="presets-list mb-4 grid gap-2">
		{#each store.presets as p (p.id)}
			<div class="flex items-center justify-between p-3 border border-border rounded bg-surface-2">
				<div>
					<div class="font-bold">{p.name}</div>
					<div class="text-sm text-text-muted">
						{p.target.slice(1)} • Quality: {p.quality} • Meta: {p.keepMetadata ? 'On' : 'Off'}
					</div>
				</div>
				<div class="flex gap-2">
					<button class="btn btn-sm focus-visible:ring-2 min-h-[44px] min-w-[44px]" onclick={() => loadPreset(p.id)}>Load</button>
					<button class="btn btn-sm btn-danger focus-visible:ring-2 min-h-[44px] min-w-[44px]" onclick={() => deletePreset(p.id)}>Delete</button>
				</div>
			</div>
		{/each}
	</div>

	<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={openPresetDialog}>Save Current as Preset</button>

	<div class="divider"></div>

	<h2>Session</h2>
	<div class="flex gap-4">
		<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={() => { exportOpen = true; }}>Export Session</button>
		<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={() => { importOpen = true; importText = ""; importError = ""; }}>Import Session</button>
	</div>

	<div class="divider"></div>

	<h2>Appearance</h2>
	<div class="setting-row">
		<div>
			<div class="setting-label">Theme</div>
			<div class="setting-help">Choose a light or dark interface</div>
		</div>
		<div style="display:flex;gap:8px">
			<button
				class="btn min-h-[44px] min-w-[44px] focus-visible:ring-2"
				class:btn-primary={store.theme === "light"}
				onclick={() => setTheme("light")}
			>
				Light
			</button>
			<button
				class="btn min-h-[44px] min-w-[44px] focus-visible:ring-2"
				class:btn-primary={store.theme === "dark"}
				onclick={() => setTheme("dark")}
			>
				Dark
			</button>
		</div>
	</div>
</div>

<Dialog.Root bind:open={presetOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-md z-50">
			<Dialog.Title class="text-xl font-bold mb-4">Save Preset</Dialog.Title>
			<form method="POST" use:presetEnhance class="flex flex-col gap-4">
				<Form.Field form={presetForm} name="name">
					<Form.Control>
						{#snippet children({ props })}
						<Form.Label>Preset Name</Form.Label>
						<input type="text" {...props} bind:value={$presetData.name} class="input block w-full border border-border p-2 rounded focus-visible:ring-2 bg-surface-2" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-bad text-sm" />
				</Form.Field>
				<input type="hidden" name="quality" value={$presetData.quality} />
				<input type="hidden" name="target" value={$presetData.target} />
				<input type="hidden" name="keepMetadata" value={$presetData.keepMetadata} />
				<div class="flex justify-end gap-2 mt-4">
					<Dialog.Close class="btn focus-visible:ring-2 min-h-[44px]">Cancel</Dialog.Close>
					<button class="btn btn-primary focus-visible:ring-2 min-h-[44px]">Save</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Dialog.Root bind:open={importOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-xl z-50">
			<Dialog.Title class="text-xl font-bold mb-4">Import Session</Dialog.Title>
			<textarea bind:value={importText} class="w-full h-48 border border-border p-2 rounded font-mono text-sm focus-visible:ring-2 mb-2 bg-surface-2" placeholder="Paste session JSON here..."></textarea>

			<div aria-live="polite" class="min-h-[24px]">
				{#if importError}
					<div class="text-bad text-sm">{importError}</div>
				{:else if importSuccess}
					<div class="text-good text-sm">Session imported successfully!</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2 mt-4">
				<Dialog.Close class="btn focus-visible:ring-2 min-h-[44px]">Cancel</Dialog.Close>
				<button class="btn btn-primary focus-visible:ring-2 min-h-[44px]" onclick={handleImport}>Import</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Dialog.Root bind:open={exportOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-xl z-50">
			<Dialog.Title class="text-xl font-bold mb-4">Export Session</Dialog.Title>
			<textarea readonly value={exportText} class="w-full h-64 border border-border p-2 rounded font-mono text-sm focus-visible:ring-2 mb-2 bg-surface-2"></textarea>

			<div aria-live="polite" class="min-h-[24px]">
				{#if exportCopied}
					<div class="text-good text-sm">Copied to clipboard!</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2 mt-4">
				<Dialog.Close class="btn focus-visible:ring-2 min-h-[44px]">Close</Dialog.Close>
				<button class="btn btn-primary focus-visible:ring-2 min-h-[44px]" onclick={copyExport}>Copy JSON</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>