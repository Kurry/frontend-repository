<script>
	import { setView } from "../store.svelte.js";
</script>

<div class="page">
	<h1>About VERT</h1>
	<p>
		VERT is the file converter you'll love. It converts your images right on your device
		using your browser's built-in codecs, so your files never leave your computer.
	</p>

	<h2>Why VERT</h2>
	<p>
		Most online converters upload your files to a server you do not control. VERT keeps
		image, audio, and document processing local. There is no file size limit, no ads, and
		the project is completely open source.
	</p>

	<h2>Privacy</h2>
	<p>
		Your privacy comes first. Read how VERT handles your files on the
		<button class="linkish" style="color:var(--accent-strong);text-decoration:underline" onclick={() => setView("privacy")}>
			privacy policy
		</button>
		page.
	</p>

	<h2>Resources</h2>
	<p>Source code, the community Discord server, and documentation are open to everyone.</p>
</div>
