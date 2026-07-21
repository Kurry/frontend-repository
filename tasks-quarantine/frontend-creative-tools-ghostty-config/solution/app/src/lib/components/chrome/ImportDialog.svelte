<script lang="ts">
    // Paste-to-import surface: validates live against the Ghostty field contracts, names every
    // problem inline, and applies through the same applyConfigText path the WebMCP tool uses.
    import Panel from "./Panel.svelte";
    import Button from "$lib/components/Button.svelte";
    import Kbd from "./Kbd.svelte";
    import {panels} from "$lib/stores/editor.svelte";
    import {applyConfigText} from "$lib/stores/import.svelte";
    import {validateConfigText} from "$lib/utils/contracts";

    let text = $state("");

    const validation = $derived.by(() => text.trim() ? validateConfigText(text) : null);
    const validLineCount = $derived(validation?.ok ? validation.lines.length : 0);
    const canApply = $derived(!!validation?.ok && validLineCount > 0);

    function close() {
        panels.importOpen = false;
        text = "";
    }

    function apply() {
        const result = applyConfigText(text, "paste");
        if (!result.ok) return; // inline errors already show; applyConfigText keeps state untouched
        close();
    }
</script>

{#if panels.importOpen}
<Panel title="Import config" onclose={close} width="560px">
    <label class="import-label" for="import-config-text">Config text</label>
    <p class="import-hint">
        Paste Ghostty config text — <code>key = value</code> lines plus <code>#</code> comments.
        Importing replaces your current overrides and counts as one undo step.
    </p>
    <textarea
        id="import-config-text"
        data-autofocus
        class="import-text"
        rows="10"
        spellcheck="false"
        autocomplete="off"
        bind:value={text}
        aria-describedby="import-status"
    ></textarea>

    <div id="import-status" class="import-status">
        {#if validation && !validation.ok}
            <ul class="import-errors" role="alert">
                {#each validation.errors as errorMessage (errorMessage)}
                    <li>{errorMessage}</li>
                {/each}
            </ul>
        {:else if canApply}
            <p class="import-ok">{validLineCount} {validLineCount === 1 ? "setting" : "settings"} ready to import</p>
        {:else}
            <p class="import-idle">Waiting for config text…</p>
        {/if}
    </div>

    {#snippet footer()}
        <Button onclick={close}>Cancel</Button>
        <Button primary onclick={apply} disabled={!canApply}>Import <Kbd>↵</Kbd></Button>
    {/snippet}
</Panel>
{/if}

<style>
.import-label {
    font-weight: 600;
    font-size: 0.85rem;
}

.import-hint {
    margin: -6px 0 0;
    color: var(--font-color-muted);
    font-size: 0.8rem;
    line-height: 1.5;
}

.import-hint code {
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border-level-1);
    font-size: 0.9em;
}

.import-text {
    width: 100%;
    resize: vertical;
    min-height: 160px;
    background: var(--bg-level-2);
    color: var(--font-color);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-level-4);
    padding: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.82rem;
    line-height: 1.5;
    outline: none;
}

.import-text:focus {
    background: var(--bg-input-focus);
    outline: var(--border-input-focus);
}

.import-status {
    min-height: 20px;
    font-size: 0.8rem;
}

.import-errors {
    margin: 0;
    padding-left: 18px;
    color: var(--color-danger);
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 1.4;
}

.import-ok {
    margin: 0;
    color: var(--color-success);
    font-weight: 600;
}

.import-idle {
    margin: 0;
    color: var(--font-color-muted);
}
</style>
