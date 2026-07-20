<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { store, toggleTheme, applyTheme } from "../lib/store.svelte.js";
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
			<a class="brand" href="/" aria-label="VERT home">VERT</a>
			<a
				class="nav-link min-h-[44px]"
				class:active={page.url.pathname === "/"}
				href="/"
			>
				<span aria-hidden="true">⬆</span> Upload
			</a>
			<a
				class="nav-link min-h-[44px]"
				class:active={page.url.pathname === "/convert"}
				href="/convert"
			>
				<span aria-hidden="true">⟳</span> Convert
			</a>
			<a
				class="nav-link min-h-[44px]"
				class:active={page.url.pathname === "/settings"}
				href="/settings"
			>
				<span aria-hidden="true">⚙</span> Settings
			</a>
			<a
				class="nav-link min-h-[44px]"
				class:active={page.url.pathname === "/about"}
				href="/about"
			>
				<span aria-hidden="true">ⓘ</span> About
			</a>
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
		<a class="linkish min-h-[44px] focus-visible:ring-2" href="/about">Source code</a> •
		<a class="linkish min-h-[44px] focus-visible:ring-2" href="/about">Discord server</a> •
		<a class="linkish min-h-[44px] focus-visible:ring-2" href="/privacy">Privacy policy</a> •
		3384a007e1
	</footer>
</div>
