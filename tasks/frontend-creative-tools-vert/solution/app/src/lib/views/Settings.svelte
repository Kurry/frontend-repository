<script>
	import { store, setSettings, setTheme, savePreset, loadPreset, deletePreset, importSession, compileSession, compileConversionReport, targetsFor } from "../store.svelte.js";
	import { SettingsUpdate, ConversionPreset } from "../schemas.js";
	import { dur } from "../motion.js";
	import { superForm, defaults } from "sveltekit-superforms";
	import { zod4 } from "sveltekit-superforms/adapters";
	import * as Form from "formsnap";
	import { Select, Dialog } from "bits-ui";
	import { fade, scale } from "svelte/transition";

	const targets = targetsFor().map((target) => target.slice(1));
	let settingsSubmitted = false;

	const form = superForm(
		defaults({ quality: store.quality, keepMetadata: store.keepMetadata, defaultTarget: store.defaultTarget.slice(1), theme: store.theme }, zod4(SettingsUpdate)),
		{
			SPA: true,
			// Keep the user's submitted values in the form; the default reset
			// would snap controls back to the values captured at mount time.
			resetForm: false,
			validators: zod4(SettingsUpdate),
			onSubmit() {
				settingsSubmitted = true;
			},
			onUpdate({ form }) {
				if (settingsSubmitted && form.valid) {
					setSettings(form.data);
				}
				settingsSubmitted = false;
			}
		}
	);
	const { form: formData, enhance } = form;

	function syncSettingsForm() {
		$formData.quality = store.quality;
		$formData.keepMetadata = store.keepMetadata;
		$formData.defaultTarget = store.defaultTarget.slice(1);
		$formData.theme = store.theme;
	}

	function chooseTheme(theme) {
		setTheme(theme);
		$formData.theme = theme;
	}

	function loadAndSyncPreset(id) {
		loadPreset(id);
		syncSettingsForm();
	}

	let presetOpen = $state(false);
	let presetSubmitted = false;
	const presetForm = superForm(
		defaults({ name: "", quality: store.quality, target: store.defaultTarget.slice(1) }, zod4(ConversionPreset)),
		{
			SPA: true,
			resetForm: false,
			validators: zod4(ConversionPreset),
			onSubmit() {
				presetSubmitted = true;
			},
			onUpdate({ form }) {
				if (presetSubmitted && form.valid) {
					savePreset(form.data.name, form.data.quality, form.data.target, store.keepMetadata);
					presetOpen = false;
				}
				presetSubmitted = false;
			}
		}
	);
	const { form: presetData, enhance: presetEnhance } = presetForm;

	function openPresetDialog() {
		$presetData.name = "";
		$presetData.quality = store.quality;
		$presetData.target = store.defaultTarget.slice(1);
		presetOpen = true;
	}

	function confirmDeletePreset(preset) {
		if (window.confirm(`Delete preset "${preset.name}"?`)) deletePreset(preset.id);
	}

	let importOpen = $state(false);
	let importText = $state("");
	let importError = $state("");
	let importSuccess = $state(false);

	function handleImport() {
		try {
			const doc = JSON.parse(importText);
			const result = importSession(doc);
			if (result.ok) {
				syncSettingsForm();
				importError = "";
				importSuccess = true;
				setTimeout(() => {
					importSuccess = false;
					importOpen = false;
				}, 1500);
			} else {
				importError = result.error;
			}
		} catch (e) {
			importError = "Invalid JSON — paste the exact text from a Session export";
		}
	}

	// WebMCP artifact_import surfaces the same Import session dialog the
	// visible control opens (and pre-fills/applies a session document when one
	// is provided through the contract).
	function showImportRequest(detail) {
		importText = detail?.text ?? "";
		importError = "";
		importSuccess = !!detail?.applied;
		importOpen = true;
		if (importSuccess) {
			syncSettingsForm();
			setTimeout(() => { importSuccess = false; }, 1500);
		}
	}

	$effect(() => {
		const onOpenImport = (event) => showImportRequest(event.detail);
		window.addEventListener("vert:open-import", onOpenImport);
		return () => window.removeEventListener("vert:open-import", onOpenImport);
	});

	// Consume a request that was stored while this view was not mounted.
	$effect(() => {
		if (store.importRequest) {
			const pending = store.importRequest;
			store.importRequest = null;
			showImportRequest(pending);
		}
	});

	const storedTab = typeof localStorage !== "undefined" ? localStorage.getItem("vert.exportTab") : null;
	let exportOpen = $state(false);
	let exportFormat = $state(storedTab === "conversion-report" ? "conversion-report" : "session-json");
	$effect(() => {
		try { localStorage.setItem("vert.exportTab", exportFormat); } catch { /* ignore */ }
	});
	let exportText = $derived(
		exportFormat === "session-json"
			? JSON.stringify(compileSession(), null, 2)
			: compileConversionReport()
	);
	let exportCopied = $state(false);
	let copyFallback = "";

	async function copyExport() {
		let ok = false;
		try {
			await navigator.clipboard.writeText(exportText);
			ok = true;
		} catch {
			// Clipboard can be unavailable in restricted contexts; fall back to
			// a transient selection copy so Copy always works.
			const helper = document.createElement("textarea");
			helper.value = exportText;
			helper.setAttribute("readonly", "");
			helper.style.position = "fixed";
			helper.style.opacity = "0";
			document.body.appendChild(helper);
			helper.select();
			try { ok = document.execCommand("copy"); } catch { ok = false; }
			helper.remove();
		}
		if (ok) {
			exportCopied = true;
			clearTimeout(copyFallback);
			copyFallback = setTimeout(() => { exportCopied = false; }, 2000);
		}
	}

	function downloadExport() {
		const markdown = exportFormat === "conversion-report";
		const blob = new Blob([exportText], { type: markdown ? "text/markdown" : "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = markdown ? "vert-conversion-report.md" : "vert-session.json";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}

	function openImportFromExport() {
		exportOpen = false;
		importText = exportText;
		importError = "";
		importSuccess = false;
		importOpen = true;
	}
</script>

<div class="page motion-safe:transition-all">
	<h1>Settings</h1>
	<p>Configure how VERT converts your files. Everything runs locally in your browser.</p>

	<form method="POST" use:enhance>
		<h2>Conversion</h2>
		<input type="hidden" name="theme" value={store.theme} />
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
						<Form.Label class="setting-label">Default target</Form.Label>
						<Form.Description class="setting-help">Default output format for newly added files</Form.Description>
					</div>
					<Select.Root type="single" name={props.name} bind:value={$formData.defaultTarget}>
						<Select.Trigger class="btn focus-visible:ring-2 bg-surface min-h-[44px]" aria-label="Default target format">
							{$formData.defaultTarget}
						</Select.Trigger>
						<Select.Content class="bg-surface border border-border rounded shadow-lg p-1 z-50">
							{#each targets as t}
								<Select.Item value={t} class="px-3 py-1.5 cursor-pointer hover:bg-surface-2 rounded">
									{t}
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
			<button class="btn btn-primary min-h-[44px] min-w-[44px] focus-visible:ring-2">Apply settings</button>
		</div>
	</form>

	<div class="divider"></div>

	<h2>Presets</h2>
	<p class="setting-help">Save your current settings as a preset for quick access.</p>

	<div class="presets-list mb-4 grid gap-2">
		{#each store.presets as p (p.id)}
			<div
				class="flex items-center justify-between p-3 border border-border rounded bg-surface-2 motion-safe:transition-all"
				in:fade|global={{ duration: dur(200) }}
				out:fade|global={{ duration: dur(180) }}
			>
				<div>
					<div class="font-bold">{p.name}</div>
					<div class="text-sm text-text-muted">
						{p.target.slice(1)} • Quality: {p.quality} • Meta: {p.keepMetadata ? 'On' : 'Off'}
					</div>
				</div>
				<div class="flex gap-2">
					<button class="btn btn-sm focus-visible:ring-2 min-h-[44px] min-w-[44px]" onclick={() => loadAndSyncPreset(p.id)}>Apply preset</button>
					<button class="btn btn-sm btn-danger focus-visible:ring-2 min-h-[44px] min-w-[44px]" onclick={() => confirmDeletePreset(p)}>Delete</button>
				</div>
			</div>
		{/each}
	</div>

	<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={openPresetDialog}>Save preset</button>

	<div class="divider"></div>

	<h2>Session</h2>
	<div class="flex gap-4">
		<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={() => { exportOpen = true; }}>Export session</button>
		<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={() => { importOpen = true; importText = ""; importError = ""; importSuccess = false; }}>Import session</button>
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
					onclick={() => chooseTheme("light")}
			>
				Light
			</button>
			<button
				class="btn min-h-[44px] min-w-[44px] focus-visible:ring-2"
				class:btn-primary={store.theme === "dark"}
					onclick={() => chooseTheme("dark")}
			>
				Dark
			</button>
		</div>
	</div>
</div>

<Dialog.Root bind:open={presetOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40 dialog-overlay-anim" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-md z-50 dialog-anim">
			<Dialog.Title class="text-xl font-bold mb-4">Save preset</Dialog.Title>
			<form method="POST" use:presetEnhance class="flex flex-col gap-4">
				<Form.Field form={presetForm} name="name">
					<Form.Control>
						{#snippet children({ props })}
						<Form.Label>Preset name</Form.Label>
						<input type="text" {...props} bind:value={$presetData.name} class="input block w-full border border-border p-2 rounded focus-visible:ring-2 bg-surface-2" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-bad text-sm" />
				</Form.Field>
				<Form.Field form={presetForm} name="quality">
					<Form.Control>
						{#snippet children({ props })}
						<Form.Label>Quality</Form.Label>
						<input type="number" min="1" max="100" {...props} bind:value={$presetData.quality} class="input block w-full border border-border p-2 rounded focus-visible:ring-2 bg-surface-2" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-bad text-sm" />
				</Form.Field>
				<Form.Field form={presetForm} name="target">
					<Form.Control>
						{#snippet children({ props })}
						<Form.Label>Target format</Form.Label>
						<div class="pt-1">
							<Select.Root type="single" name={props.name} bind:value={$presetData.target}>
								<Select.Trigger class="btn bg-surface-2 focus-visible:ring-2 min-h-[44px] w-full justify-start" aria-label="Preset target format">
									{$presetData.target}
								</Select.Trigger>
								<Select.Content class="bg-surface border border-border rounded shadow-lg p-1 z-50">
									{#each targets as t}
										<Select.Item value={t} class="px-3 py-1.5 cursor-pointer hover:bg-surface-2 rounded">
											{t}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-bad text-sm" />
				</Form.Field>
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
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40 dialog-overlay-anim" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-xl z-50 dialog-anim">
			<Dialog.Title class="text-xl font-bold mb-4">Import session</Dialog.Title>
			<label class="setting-label block mb-1" for="import-text">Session JSON</label>
			<textarea id="import-text" bind:value={importText} class="w-full h-48 border border-border p-2 rounded font-mono text-sm focus-visible:ring-2 mb-2 bg-surface-2" placeholder="Paste session JSON here..."></textarea>

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
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-40 dialog-overlay-anim" />
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded shadow-xl w-[90vw] max-w-xl z-50 dialog-anim">
			<Dialog.Title class="text-xl font-bold mb-4">Export session</Dialog.Title>
			<div class="flex gap-2 mb-3" role="tablist" aria-label="Export format">
				<button class="btn btn-sm focus-visible:ring-2 min-h-[44px]" class:btn-primary={exportFormat === "session-json"} role="tab" aria-selected={exportFormat === "session-json"} onclick={() => exportFormat = "session-json"}>Session JSON</button>
				<button class="btn btn-sm focus-visible:ring-2 min-h-[44px]" class:btn-primary={exportFormat === "conversion-report"} role="tab" aria-selected={exportFormat === "conversion-report"} onclick={() => exportFormat = "conversion-report"}>Conversion report</button>
			</div>
			<textarea readonly value={exportText} aria-label={exportFormat === "session-json" ? "Session JSON preview" : "Conversion report preview"} class="w-full h-64 border border-border p-2 rounded font-mono text-sm focus-visible:ring-2 mb-2 bg-surface-2"></textarea>

			<div aria-live="polite" class="min-h-[24px]">
				{#if exportCopied}
					<div class="text-good text-sm">Copied to clipboard!</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2 mt-4 flex-wrap">
				<Dialog.Close class="btn focus-visible:ring-2 min-h-[44px]">Close</Dialog.Close>
				<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={openImportFromExport}>Import session JSON</button>
				<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={downloadExport}>Download session</button>
				<button class="btn btn-primary focus-visible:ring-2 min-h-[44px]" onclick={copyExport}>{exportCopied ? "Copied!" : "Copy"}</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
