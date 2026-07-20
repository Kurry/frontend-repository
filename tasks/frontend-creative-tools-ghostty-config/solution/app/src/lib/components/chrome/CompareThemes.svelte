<script lang="ts">
    // Theme A/B compare: two equal-weight live previews with independent selectors. Nothing
    // touches the generated configuration or override count until an Apply is chosen — the
    // A/B selections are ephemeral view state in stores/editor.svelte.ts.
    import themes from "$lib/data/themes";
    import Panel from "./Panel.svelte";
    import Button from "$lib/components/Button.svelte";
    import MiniTerminal from "./MiniTerminal.svelte";
    import {closeCompare, compare, panels} from "$lib/stores/editor.svelte";
    import {setSetting} from "$lib/stores/config.svelte";
    import {THEMES} from "$lib/utils/contracts";
    import {success} from "$lib/stores/toasts.svelte";
    import type {ColorScheme} from "$lib/utils/colors";

    function schemeFor(name: string): ColorScheme {
        return (themes as Record<string, ColorScheme>)[name] ?? {palette: []};
    }

    function applySide(side: "A" | "B") {
        const theme = side === "A" ? compare.sideA : compare.sideB;
        setSetting("theme", theme);
        success(`Theme set to ${theme}`);
        closeCompare();
    }
</script>

{#if panels.compareOpen}
<Panel title="Compare themes" onclose={closeCompare} width="760px">
    <p class="compare-hint">
        Two live previews of the same terminal content, side by side. Changing a selector
        recolors only its own side; nothing is applied until you choose Apply.
    </p>
    <div class="compare-grid">
        {#each ["A", "B"] as side (side)}
            {@const selection = side === "A" ? compare.sideA : compare.sideB}
            <section class="compare-side" aria-label={`Compare side ${side}`}>
                <header class="compare-side-head">
                    <span class="compare-side-letter" aria-hidden="true">{side}</span>
                    <label class="sr-only" for={`compare-select-${side}`}>Theme for side {side}</label>
                    <select
                        id={`compare-select-${side}`}
                        class="compare-select"
                        value={selection}
                        onchange={(event) => {
                            const next = (event.currentTarget as HTMLSelectElement).value;
                            if (side === "A") compare.sideA = next;
                            else compare.sideB = next;
                        }}
                    >
                        {#each THEMES as themeName (themeName)}
                            <option value={themeName}>{themeName}</option>
                        {/each}
                    </select>
                </header>
                <MiniTerminal scheme={schemeFor(selection)} label={`Side ${side}: ${selection}`} />
                <Button primary onclick={() => applySide(side)}>Apply side {side}</Button>
            </section>
        {/each}
    </div>

    {#snippet footer()}
        <Button onclick={closeCompare}>Close without applying</Button>
    {/snippet}
</Panel>
{/if}

<style>
.compare-hint {
    margin: 0;
    color: var(--font-color-muted);
    font-size: 0.8rem;
    line-height: 1.5;
}

.compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.compare-side {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--border-level-1);
    border-radius: var(--radius-level-3);
    background: rgba(255, 255, 255, 0.04);
}

.compare-side-head {
    display: flex;
    align-items: center;
    gap: 10px;
}

.compare-side-letter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-selected);
    color: white;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.compare-select {
    flex: 1;
    min-width: 0;
    background: var(--bg-level-2);
    color: var(--font-color);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-level-5);
    padding: 5px 8px;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
}

.compare-select:focus-visible {
    outline: var(--border-input-focus);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}

@media (max-width: 640px) {
    .compare-grid {
        grid-template-columns: 1fr;
    }
}
</style>
