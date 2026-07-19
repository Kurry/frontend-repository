<script>
	import { CATEGORIES, TARGET_FORMATS } from "../formats.js";
	import {
		store,
		addFiles,
		addSample,
		setCategory,
		selectFile,
		setTarget,
		removeFile,
		convertAll,
		cancelConversion,
		download,
		clearQueue,
		counts,
	} from "../store.svelte.js";

	let dragover = $state(false);
	let fileInput;

	const cats = CATEGORIES;
	const targets = TARGET_FORMATS;

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

	function statusIcon(s) {
		return { ready: "•", converting: "…", done: "✓", failed: "✕", unsupported: "!" }[s] || "";
	}

	const c = $derived(counts());
	const anyReady = $derived(
		store.files.some((f) => f.status === "ready" || f.status === "failed"),
	);
	const anyDone = $derived(store.files.some((f) => f.status === "done"));

	function fmtSize(n) {
		if (n == null) return "";
		if (n < 1024) return n + " B";
		if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
		return (n / 1024 / 1024).toFixed(2) + " MB";
	}
</script>

<!-- hero -->
<section class="hero">
	<div>
		<h1>The file converter<br />you'll love.</h1>
		<p>
			All image, audio, and document processing is done on your device. Videos are
			converted on our lightning-fast servers. No file size limit, no ads, and completely
			open source.
		</p>
	</div>

	<div
		class="dropzone"
		class:dragover
		role="button"
		tabindex="0"
		aria-label="Drop or click to convert. Add a local image file to the conversion queue."
		onclick={openPicker}
		onkeydown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openPicker();
			}
		}}
		ondragover={(e) => {
			e.preventDefault();
			dragover = true;
		}}
		ondragleave={() => (dragover = false)}
		ondrop={onDrop}
	>
		<div class="circle" aria-hidden="true">⬆</div>
		<div class="dz-title">Drop or click to convert</div>
		<p class="setting-help" style="margin:0">
			Images convert locally in your browser. Supported inputs: png, jpg, jpeg, webp, gif,
			bmp, svg
		</p>
		<div class="sample-row" onclick={(e) => e.stopPropagation()} role="group" aria-label="Sample images">
			<button class="btn btn-sm" onclick={(e) => { e.stopPropagation(); addSample("png"); }}>
				Add sample png
			</button>
			<button class="btn btn-sm" onclick={(e) => { e.stopPropagation(); addSample("svg"); }}>
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

<!-- conversion queue -->
<section class="queue-wrap" aria-label="Conversion queue">
	<div class="queue-head">
		<h2>Conversion queue</h2>
		<div class="queue-actions">
			<button
				class="btn btn-primary"
				onclick={convertAll}
				disabled={!anyReady || store.converting}
			>
				{store.converting ? "Converting…" : "Convert"}
			</button>
			{#if store.converting}
				<button class="btn" onclick={cancelConversion}>Cancel</button>
			{/if}
			{#if store.files.length > 0}
				<button class="btn btn-danger" onclick={clearQueue}>Clear queue</button>
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
		<div class="empty-queue">
			<div class="big">Your conversion queue is empty</div>
			<p style="margin:0">
				Add a local image file above to get started. Nothing is uploaded and no
				download is produced until you add a file and convert it.
			</p>
		</div>
	{:else}
		<ul style="list-style:none;margin:0;padding:0">
			{#each store.files as f, i (f.id)}
				<li
					class="file-row"
					class:selected={store.selectedId === f.id}
					onclick={() => selectFile(f.id)}
				>
					<div class="file-meta">
						<div class="file-name">{f.name}</div>
						<div class="file-sub">
							{f.from} → {f.to ?? "—"} • {fmtSize(f.size)}
							{#if f.status === "done" && f.resultSize != null}
								• out {fmtSize(f.resultSize)}
							{/if}
							{#if f.error}
								• {f.error}
							{/if}
						</div>
					</div>

					<div class="fmt-field">
						<label for={"fmt-" + f.id}>Convert to</label>
						<select
							id={"fmt-" + f.id}
							class="fmt"
							value={f.to ?? ""}
							disabled={f.status === "unsupported"}
							onchange={(e) => setTarget(f.id, e.target.value)}
							onclick={(e) => e.stopPropagation()}
						>
							{#if f.status === "unsupported"}
								<option value="">n/a</option>
							{:else}
								{#each targets as t}
									<option value={t}>{t.slice(1)}</option>
								{/each}
							{/if}
						</select>
					</div>

					<span
						class="status-pill status-{f.status}"
						aria-label={"Status: " + statusText(f.status)}
					>
						<span aria-hidden="true">{statusIcon(f.status)}</span>
						{statusText(f.status)}
					</span>

					<div class="row-actions">
						<button
							class="btn btn-sm btn-primary"
							disabled={f.status !== "done"}
							onclick={(e) => { e.stopPropagation(); download(f.id); }}
						>
							Download
						</button>
						<button
							class="btn btn-sm btn-danger"
							onclick={(e) => { e.stopPropagation(); removeFile(f.id); }}
							aria-label={"Remove " + f.name}
						>
							Remove
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="divider"></div>

<!-- supports catalog -->
<h2 class="supports-title">VERT supports...</h2>
<section class="cards" aria-label="Supported conversion categories">
	{#each cats as cat}
		<button
			class="cat-card"
			class:active={store.category === cat.id}
			style="text-align:left;cursor:pointer;font-family:inherit"
			onclick={() => setCategory(cat.id)}
			aria-pressed={store.category === cat.id}
		>
			<div class="cat-head">
				<span class="cat-badge" aria-hidden="true">
					{cat.id === "images" ? "🖼" : cat.id === "audio" ? "🎵" : cat.id === "documents" ? "📄" : "🎬"}
				</span>
				{cat.label}
			</div>
			<div class="cat-support" class:server={cat.support === "server"}>
				<span aria-hidden="true">✓</span>
				{cat.support === "server" ? "Server supported" : "Local supported"}
			</div>
			<div class="cat-status">Status: <b>{cat.status}</b></div>
			<div class="cat-formats-label">Supported formats:</div>
			<div class="cat-formats">{cat.formats.join(", ")}</div>
		</button>
	{/each}
</section>
