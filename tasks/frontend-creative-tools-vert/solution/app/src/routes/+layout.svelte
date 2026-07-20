<script>
	import { onMount } from "svelte";
	import { store, setView, toggleTheme, applyTheme } from "../lib/store.svelte.js";
	import { installWebMCP } from "../lib/webmcp.js";
	import "../app.css";

	let { children } = $props();

	onMount(() => {
		applyTheme();
		installWebMCP();
	});
</script>

<div class="app-bg">
	<header class="navbar">
		<nav class="nav-pill" aria-label="Primary">
			<button class="brand" onclick={() => setView("home")} aria-label="VERT home">VERT</button>
			<button
				class="nav-link min-h-[44px]"
				class:active={store.view === "home"}
				onclick={() => setView("home")}
			>
				<span aria-hidden="true">⬆</span> Upload
			</button>
			<button
				class="nav-link min-h-[44px]"
				class:active={store.view === "home"}
				onclick={() => setView("home")}
			>
				<span aria-hidden="true">⟳</span> Convert
			</button>
			<button
				class="nav-link min-h-[44px]"
				class:active={store.view === "settings"}
				onclick={() => setView("settings")}
			>
				<span aria-hidden="true">⚙</span> Settings
			</button>
			<button
				class="nav-link min-h-[44px]"
				class:active={store.view === "about"}
				onclick={() => setView("about")}
			>
				<span aria-hidden="true">ⓘ</span> About
			</button>
			<div class="nav-sep" aria-hidden="true"></div>
			<button
				class="icon-btn min-h-[44px] min-w-[44px]"
				onclick={toggleTheme}
				aria-label={store.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
				title="Toggle theme"
			>
				{store.theme === "dark" ? "☀" : "☾"}
			</button>
		</nav>
	</header>

	<main class="container">
		{@render children()}
	</main>

	<footer class="footer container">
		© 2026 VERT. •
		<button class="linkish min-h-[44px] focus-visible:ring-2" onclick={() => setView("about")}>Source code</button> •
		<button class="linkish min-h-[44px] focus-visible:ring-2" onclick={() => setView("about")}>Discord server</button> •
		<button class="linkish min-h-[44px] focus-visible:ring-2" onclick={() => setView("privacy")}>Privacy policy</button> •
		3384a007e1
	</footer>
</div>