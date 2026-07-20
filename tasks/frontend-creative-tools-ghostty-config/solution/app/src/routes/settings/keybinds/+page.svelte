<script lang="ts">
    import Page from "$lib/views/Page.svelte";
    import config from "$lib/stores/config.svelte";
    import Keybinds from "$lib/components/settings/Keybinds.svelte";
    import EditorToolbar from "$lib/components/chrome/EditorToolbar.svelte";
</script>

<Page title="Keybinds">
    {#snippet headerExtra()}
        <EditorToolbar />
    {/snippet}
    <Keybinds bind:value={config.keybind} />
</Page>
