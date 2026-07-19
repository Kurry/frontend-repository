<script lang="ts">
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {resolve} from "$app/paths";

    // The primary workspace is the categorized settings editor with its live preview. Open
    // directly into it (Fonts holds the font-family and font-size controls) rather than a
    // separate landing page.
    onMount(() => {
        void goto(resolve("/settings/fonts"), {replaceState: true});
    });
</script>

<svelte:head>
    <title>Ghostty Config</title>
</svelte:head>

<div class="redirecting">
    <p>Opening the configuration editor…</p>
</div>

<style>
.redirecting {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    color: var(--font-color-muted);
    font-size: 1rem;
}
</style>
