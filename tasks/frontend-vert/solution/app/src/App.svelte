<script>
	import { onMount } from "svelte";
	import { store, setView, toggleTheme, applyTheme } from "./lib/store.svelte.js";
	import { installWebMCP } from "./lib/webmcp.js";
	import Home from "./lib/views/Home.svelte";
	import Settings from "./lib/views/Settings.svelte";
	import About from "./lib/views/About.svelte";
	import Privacy from "./lib/views/Privacy.svelte";

	onMount(() => {
		applyTheme();
		installWebMCP();
	});

	const nav = [
		{ id: "home", label: "Upload", icon: "⬆" },
		{ id: "home", label: "Convert", icon: "⟳", key: "convert" },
		{ id: "settings", label: "Settings", icon: "⚙" },
		{ id: "about", label: "About", icon: "ⓘ" },
	];
</script>

<div class="app-bg">
	<header class="navbar">
		<nav class="nav-pill" aria-label="Primary">
			<button class="brand" onclick={() => setView("home")} aria-label="VERT home">VERT</button>
			<button
				class="nav-link"
				class:active={store.view === "home"}
				onclick={() => setView("home")}
			>
				<span aria-hidden="true">⬆</span> Upload
			</button>
			<button
				class="nav-link"
				class:active={store.view === "home"}
				onclick={() => setView("home")}
			>
				<span aria-hidden="true">⟳</span> Convert
			</button>
			<button
				class="nav-link"
				class:active={store.view === "settings"}
				onclick={() => setView("settings")}
			>
				<span aria-hidden="true">⚙</span> Settings
			</button>
			<button
				class="nav-link"
				class:active={store.view === "about"}
				onclick={() => setView("about")}
			>
				<span aria-hidden="true">ⓘ</span> About
			</button>
			<div class="nav-sep" aria-hidden="true"></div>
			<button
				class="icon-btn"
				onclick={toggleTheme}
				aria-label={store.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
				title="Toggle theme"
			>
				{store.theme === "dark" ? "☀" : "☾"}
			</button>
		</nav>
	</header>

	<main class="container">
		{#if store.view === "home"}
			<Home />
		{:else if store.view === "settings"}
			<Settings />
		{:else if store.view === "about"}
			<About />
		{:else if store.view === "privacy"}
			<Privacy />
		{/if}
	</main>

	<footer class="footer container">
		© 2026 VERT. •
		<button class="linkish" onclick={() => setView("about")}>Source code</button> •
		<button class="linkish" onclick={() => setView("about")}>Discord server</button> •
		<button class="linkish" onclick={() => setView("privacy")}>Privacy policy</button> •
		3384a007e1
	</footer>
</div>
