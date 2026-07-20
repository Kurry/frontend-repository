<script>
	import { CATEGORIES, TARGET_FORMATS } from "../formats.js";
	import {
		store,
		addFiles,
		addSample,
		setCategory,
		selectFile,
		toggleSelection,
		selectAll,
		setTarget,
		batchSetTarget,
		removeFile,
		removeSelectedFiles,
		convertAll,
		cancelConversion,
		download,
		clearQueue,
		counts,
		queueUndo,
		queueRedo
	} from "../store.svelte.js";
	import { Select } from "bits-ui";
	import { fade, scale, slide } from "svelte/transition";
	import { flip } from "svelte/animate";

	import UploadSimple from "phosphor-svelte/lib/UploadSimple";
	import CheckCircle from "phosphor-svelte/lib/CheckCircle";
	import XCircle from "phosphor-svelte/lib/XCircle";
	import CircleNotch from "phosphor-svelte/lib/CircleNotch";
	import WarningCircle from "phosphor-svelte/lib/WarningCircle";
	import ImageSquare from "phosphor-svelte/lib/Image";
	import FileAudio from "phosphor-svelte/lib/FileAudio";
	import FileText from "phosphor-svelte/lib/FileText";
	import FileVideo from "phosphor-svelte/lib/FileVideo";
	import Info from "phosphor-svelte/lib/Info";

	let dragover = $state(false);
	let fileInput;
	let batchTarget = $state("");
	let searchQuery = $state("");

	const cats = CATEGORIES;
	const targets = TARGET_FORMATS;

	const filteredCats = $derived(
		searchQuery
			? cats.map(c => ({
				...c,
				formats: c.formats.filter(f => f.includes(searchQuery.toLowerCase()))
			})).filter(c => c.formats.length > 0 || c.label.toLowerCase().includes(searchQuery.toLowerCase()))
			: cats
	);

	function openPicker() {
		fileInput?.click();
	}

	function onPicked(e) {
		const files = e.target.files;
		if (files && files.length) addFiles(files);
		e.target.value = "";
	}

	function onDrop(e) {
		e.preventDefault();
		dragover = false;
		const files = e.dataTransfer?.files;
		if (files && files.length) addFiles(files);
	}

	function statusText(s) {
		return {
			ready: "Ready",
			converting: "Converting",
			done: "Done",
			failed: "Failed",
			unsupported: "Unsupported",
		}[s] || s;
	}

	const c = $derived(counts());
	const anyReady = $derived(
		store.files.some((f) => f.status === "ready" || f.status === "failed"),
	);

	function fmtSize(n) {
		if (n == null) return "";
		if (n < 1024) return n + " B";
		if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
		return (n / 1024 / 1024).toFixed(2) + " MB";
	}

	function handleKeydown(e, f) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			f();
		}
	}

	let coachmarkDismissed = $state(false);
	$effect(() => {
		const val = localStorage.getItem("vert.coachmark");
		if (val) coachmarkDismissed = true;
	});

	function dismissCoachmark() {
		coachmarkDismissed = true;
		localStorage.setItem("vert.coachmark", "true");
	}
</script>

<section class="hero">
	<div>
		<h1>The file converter<br />you'll love.</h1>
		<p>
			All image, audio, and document processing is done on your device. Videos are
			converted on our lightning-fast servers. No file size limit, no ads, and completely
			open source.
		</p>

		{#if !coachmarkDismissed}
			<div class="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-xl flex gap-3 text-sm items-start motion-safe:transition-all" out:slide>
				<Info size={24} weight="duotone" class="text-accent flex-shrink-0" />
				<div>
					<strong>First time here?</strong> Drop an image file in the drop zone to the right, or click the buttons below it to load sample images. Then click Convert to test it out!
					<button class="block mt-2 font-bold text-accent hover:underline" onclick={dismissCoachmark}>Got it, thanks</button>
				</div>
			</div>
		{/if}
	</div>

	<div
		class="dropzone focus-visible:ring-2 motion-safe:transition-all"
		class:dragover
		role="button"
		tabindex="0"
		aria-label="Drop or click to convert. Add a local image file to the conversion queue."
		onclick={openPicker}
		onkeydown={(e) => handleKeydown(e, openPicker)}
		ondragover={(e) => {
			e.preventDefault();
			dragover = true;
		}}
		ondragleave={() => (dragover = false)}
		ondrop={onDrop}
	>
		<div class="circle transition-transform motion-safe:duration-200" class:scale-110={dragover} aria-hidden="true">
			<UploadSimple size={32} weight="bold" />
		</div>
		<div class="dz-title">Drop or click to convert</div>
		<p class="setting-help" style="margin:0">
			Images convert locally in your browser. Supported inputs: png, jpg, jpeg, webp, gif, bmp, svg
		</p>
		<div class="sample-row" role="group" aria-label="Sample images" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
			<button class="btn btn-sm focus-visible:ring-2 min-h-[44px]" onclick={(e) => { e.stopPropagation(); addSample("png"); }}>
				Add sample png
			</button>
			<button class="btn btn-sm focus-visible:ring-2 min-h-[44px]" onclick={(e) => { e.stopPropagation(); addSample("svg"); }}>
				Add sample svg
			</button>
		</div>
	</div>

	<input
		type="file"
		multiple
		accept="image/*,.svg"
		data-file-input
		bind:this={fileInput}
		onchange={onPicked}
		class="visually-hidden"
		aria-hidden="true"
		tabindex="-1"
	/>
</section>

<section class="queue-wrap" aria-label="Conversion queue">
	<div class="queue-head">
		<h2>Conversion queue</h2>
		<div class="queue-actions">
			<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={queueUndo} disabled={store.history.undo.length === 0} aria-label="Undo">Undo</button>
			<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={queueRedo} disabled={store.history.redo.length === 0} aria-label="Redo">Redo</button>
			<button
				class="btn btn-primary focus-visible:ring-2 min-h-[44px]"
				onclick={convertAll}
				disabled={!anyReady || store.converting}
			>
				{store.converting ? "Converting…" : "Convert"}
			</button>
			{#if store.converting}
				<button class="btn focus-visible:ring-2 min-h-[44px]" onclick={cancelConversion}>Cancel</button>
			{/if}
			{#if store.files.length > 0}
				<button class="btn btn-danger focus-visible:ring-2 min-h-[44px]" onclick={clearQueue}>Clear queue</button>
			{/if}
		</div>
	</div>

	<p class="queue-counts" aria-live="polite">
		{#if store.files.length === 0}
			0 files queued
		{:else}
			{c.total} queued • {c.ready} ready • {c.done} done{#if c.failed > 0} • {c.failed} failed{/if}
		{/if}
	</p>

	{#if store.files.length === 0}
		<div class="empty-queue motion-safe:transition-all" in:fade>
			<div class="big">Your conversion queue is empty</div>
			<p style="margin:0">
				Add a local image file above to get started. Nothing is uploaded and no download is produced until you add a file and convert it.
			</p>
		</div>
	{:else}
		{#if store.selection.size > 0}
			<div class="bg-surface-2 border border-border rounded-lg p-3 mb-4 flex items-center justify-between shadow-sm motion-safe:transition-all" transition:slide>
				<div class="text-sm font-semibold">{store.selection.size} selected</div>
				<div class="flex gap-2 items-center">
					<Select.Root type="single" bind:value={batchTarget} onValueChange={(val) => { if (val) batchSetTarget(val); }}>
						<Select.Trigger class="btn btn-sm focus-visible:ring-2 min-h-[44px]" aria-label="Batch set format">
							Batch set format
						</Select.Trigger>
						<Select.Content class="bg-surface border border-border rounded shadow-lg p-1 z-50">
							{#each targets as t}
								<Select.Item value={t} class="px-3 py-1.5 cursor-pointer hover:bg-surface-2 rounded">
									{t.slice(1)}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<button class="btn btn-sm btn-danger focus-visible:ring-2 min-h-[44px]" onclick={removeSelectedFiles}>Remove selected</button>
				</div>
			</div>
		{/if}

		<div class="mb-2 flex gap-2 items-center text-sm px-2">
			<button class="linkish text-xs focus-visible:ring-2 min-h-[44px]" onclick={selectAll}>Select All</button>
		</div>

		<ul style="list-style:none;margin:0;padding:0">
			{#each store.files as f (f.id)}
				<li class="file-row motion-safe:transition-all" class:selected={store.selection.has(f.id) || store.selectedId === f.id} animate:flip={{ duration: 300 }} in:scale|global={{ start: 0.95, duration: 200 }} out:scale|global={{ start: 0.95, duration: 200 }}>
					<div class="flex items-center gap-3 w-full min-w-0">
						<input type="checkbox" checked={store.selection.has(f.id)} onchange={() => toggleSelection(f.id)} class="w-5 h-5 focus-visible:ring-2" aria-label="Select {f.name}" />
						<div class="file-meta cursor-pointer flex-1 min-w-0" onclick={() => selectFile(f.id)} role="button" tabindex="0" onkeydown={(e) => handleKeydown(e, () => selectFile(f.id))}>
							<div class="file-name truncate">{f.name}</div>
							<div class="file-sub">
								{f.from} → {f.to ?? "—"} • {fmtSize(f.size)}
								{#if f.status === "done" && f.resultSize != null}
									• out {fmtSize(f.resultSize)}
								{/if}
								{#if f.error}
									• <span class="text-bad">{f.error}</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="fmt-field">
						<label for={"fmt-" + f.id}>Convert to</label>
						<Select.Root type="single" value={f.to ?? ""} disabled={f.status === "unsupported"} onValueChange={(val) => setTarget(f.id, val)}>
							<Select.Trigger class="fmt min-h-[44px] focus-visible:ring-2 bg-surface" id={"fmt-" + f.id} aria-label="Convert to">
								{#if f.status === "unsupported"}
									n/a
								{:else}
									{f.to ? f.to.slice(1) : ""}
								{/if}
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

					<span class="status-pill status-{f.status}" aria-label={"Status: " + statusText(f.status)}>
						<span aria-hidden="true" class="flex items-center">
							{#if f.status === "ready"}<CircleNotch weight="bold" />
							{:else if f.status === "converting"}<CircleNotch weight="bold" class="animate-spin" />
							{:else if f.status === "done"}<CheckCircle weight="fill" />
							{:else if f.status === "failed"}<XCircle weight="fill" />
							{:else if f.status === "unsupported"}<WarningCircle weight="fill" />
							{/if}
						</span>
						{statusText(f.status)}
					</span>

					<div class="row-actions">
						<button class="btn btn-sm btn-primary min-h-[44px] focus-visible:ring-2" disabled={f.status !== "done"} onclick={(e) => { e.stopPropagation(); download(f.id); }}>
							Download
						</button>
						<button class="btn btn-sm btn-danger min-h-[44px] focus-visible:ring-2" onclick={(e) => { e.stopPropagation(); removeFile(f.id); }} aria-label={"Remove " + f.name}>
							Remove
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="divider"></div>

<div class="flex items-center justify-between flex-wrap gap-4 mb-6 mt-8">
	<h2 class="supports-title !m-0">VERT supports...</h2>
	<input type="search" bind:value={searchQuery} placeholder="Search formats..." class="input bg-surface-2 border border-border rounded-lg px-4 py-2 focus-visible:ring-2 min-h-[44px]" aria-label="Search supported formats" />
</div>

<section class="cards" aria-label="Supported conversion categories">
	{#each filteredCats as cat}
		<button
			class="cat-card focus-visible:ring-2 motion-safe:transition-all"
			class:active={store.category === cat.id}
			style="text-align:left;cursor:pointer;font-family:inherit"
			onclick={() => setCategory(cat.id)}
			aria-pressed={store.category === cat.id}
		>
			<div class="cat-head">
				<span class="cat-badge" aria-hidden="true">
					{#if cat.id === "images"}<ImageSquare weight="duotone" />
					{:else if cat.id === "audio"}<FileAudio weight="duotone" />
					{:else if cat.id === "documents"}<FileText weight="duotone" />
					{:else}<FileVideo weight="duotone" />
					{/if}
				</span>
				{cat.label}
			</div>
			<div class="cat-support" class:server={cat.support === "server"}>
				<CheckCircle weight="bold" aria-hidden="true" />
				{cat.support === "server" ? "Server supported" : "Local supported"}
			</div>
			<div class="cat-status">Status: <b>{cat.status}</b></div>
			<div class="cat-formats-label">Supported formats:</div>
			<div class="cat-formats">{cat.formats.join(", ")}</div>
		</button>
	{/each}
</section>