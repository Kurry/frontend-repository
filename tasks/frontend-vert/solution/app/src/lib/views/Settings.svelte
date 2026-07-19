<script>
	import { store, setQuality, setKeepMetadata, setTheme } from "../store.svelte.js";
</script>

<div class="page">
	<h1>Settings</h1>
	<p>Configure how VERT converts your files. Everything runs locally in your browser.</p>

	<h2>Conversion</h2>
	<div class="setting-row">
		<div>
			<div class="setting-label">Output quality</div>
			<div class="setting-help">
				Compression quality for jpeg and webp output, from 1 to 100
			</div>
		</div>
		<div style="display:flex;align-items:center;gap:12px">
			<input
				type="range"
				min="1"
				max="100"
				value={store.quality}
				oninput={(e) => setQuality(+e.target.value)}
				aria-label="Output quality"
			/>
			<span style="min-width:3ch;font-weight:600">{store.quality}</span>
		</div>
	</div>

	<div class="setting-row">
		<div>
			<div class="setting-label">Keep metadata</div>
			<div class="setting-help">Preserve image metadata where the target format allows it</div>
		</div>
		<label class="switch">
			<input
				type="checkbox"
				checked={store.keepMetadata}
				onchange={(e) => setKeepMetadata(e.target.checked)}
			/>
			<span>{store.keepMetadata ? "On" : "Off"}</span>
		</label>
	</div>

	<h2>Appearance</h2>
	<div class="setting-row">
		<div>
			<div class="setting-label">Theme</div>
			<div class="setting-help">Choose a light or dark interface</div>
		</div>
		<div style="display:flex;gap:8px">
			<button
				class="btn"
				class:btn-primary={store.theme === "light"}
				onclick={() => setTheme("light")}
			>
				Light
			</button>
			<button
				class="btn"
				class:btn-primary={store.theme === "dark"}
				onclick={() => setTheme("dark")}
			>
				Dark
			</button>
		</div>
	</div>
</div>
