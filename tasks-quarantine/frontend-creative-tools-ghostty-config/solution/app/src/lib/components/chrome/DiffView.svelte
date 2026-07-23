<script lang="ts">
    // Diff mode: every overridden key with its default beside its current value in a distinct
    // changed treatment. Read-only — toggling Diff never clears overrides.
    import {fade, fly} from "svelte/transition";
    import config, {defaults, diff} from "$lib/stores/config.svelte";
    import {registry} from "$lib/settings/registry";

    const KEY_TO_ID: Record<string, keyof typeof registry> = {};
    for (const id of Object.keys(registry) as Array<keyof typeof registry>) {
        KEY_TO_ID[registry[id].key] = id;
    }

    interface DiffRow {
        id: string;
        key: string;
        def: string;
        current: string;
    }

    const rows = $derived.by((): DiffRow[] => {
        const out: DiffRow[] = [];
        for (const [key, value] of Object.entries(diff())) {
            const id = KEY_TO_ID[key];
            const def = id !== undefined ? defaults[id] : "";
            const defText = Array.isArray(def) ? (def.length ? def.join(", ") : "(none)") : String(def ?? "");
            const values = Array.isArray(value) ? value : [String(value)];
            values.forEach((v, i) => {
                out.push({id: `${key}=${v}#${i}`, key, def: defText, current: String(v)});
            });
        }
        return out;
    });

    // Referencing config keeps the derived honest for array-valued settings even when the
    // diff key set does not change shape.
    void config;
</script>

<div class="diff-view" transition:fade={{duration: 200}}>
    {#if rows.length}
        <div class="diff-head">
            <span class="diff-tag">changed</span>
            <span>{rows.length} {rows.length === 1 ? "line differs" : "lines differ"} from defaults</span>
        </div>
        <div class="diff-rows">
            {#each rows as row (row.id)}
                <div class="diff-row" in:fly={{x: -6, duration: 200}} out:fade={{duration: 160}}>
                    <div class="diff-key">{row.key}</div>
                    <div class="diff-values">
                        <span class="diff-default" title="Default value">{row.def}</span>
                        <span class="diff-arrow" aria-hidden="true">→</span>
                        <span class="diff-current" title="Current value">{row.current}</span>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="diff-empty">
            <p class="diff-empty-title">No differences</p>
            <p>Every setting matches its default. Change a setting on the left and it will appear here beside its default value.</p>
        </div>
    {/if}
</div>

<style>
.diff-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--config-bg);
    color: var(--config-fg);
    font-family: var(--config-font-family);
    font-size: calc(var(--config-font-size) * 0.85);
    border-radius: var(--radius-level-3);
    border: 1px solid rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 1px rgba(255, 255, 255, 0.5) inset;
    padding: 8px;
    overflow-y: auto;
    user-select: text;
}

.diff-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 8px;
    color: var(--config-palette-2);
    font-size: 0.8em;
}

.diff-tag {
    background: rgba(from var(--config-palette-3) r g b / 0.22);
    color: var(--config-palette-3);
    border-radius: 4px;
    padding: 1px 6px;
    font-weight: 700;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.diff-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.diff-row {
    border-left: 2px solid var(--config-palette-3);
    background: rgba(255, 255, 255, 0.045);
    border-radius: 0 6px 6px 0;
    padding: 4px 8px;
}

.diff-key {
    color: var(--config-palette-4);
    font-weight: 700;
}

.diff-values {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
}

.diff-default {
    color: var(--config-fg);
    opacity: 0.55;
    text-decoration: line-through;
    text-decoration-color: rgba(255, 255, 255, 0.4);
}

.diff-arrow {
    opacity: 0.6;
}

.diff-current {
    color: var(--config-palette-5);
    font-weight: 700;
}

.diff-empty {
    margin: auto;
    text-align: center;
    color: var(--config-fg);
    opacity: 0.75;
    padding: 16px;
    max-width: 240px;
}

.diff-empty-title {
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--config-palette-2);
}

.diff-empty p:last-child {
    margin: 0;
    font-size: 0.85em;
    line-height: 1.5;
}
</style>
