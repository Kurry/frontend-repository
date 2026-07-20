<script>
	import { store } from "../lib/store.svelte.js";
	import Home from "../lib/views/Home.svelte";
	import Settings from "../lib/views/Settings.svelte";
	import About from "../lib/views/About.svelte";
	import Privacy from "../lib/views/Privacy.svelte";
</script>

{#if store.view === "home"}
	<Home />
{:else if store.view === "settings"}
	<Settings />
{:else if store.view === "about"}
	<About />
{:else if store.view === "privacy"}
	<Privacy />
{/if}