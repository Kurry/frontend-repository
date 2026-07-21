<script lang="ts">
    // A visible repeatable-value list editor: every value gets its own row with a remove
    // control, rows can be reordered, and "Add value" appends a new row — the list itself is
    // the control, no hidden modal step.
    import {fade, fly} from "svelte/transition";
    import {getSetting} from "$lib/contexts";

    type Props = {
        value: string[];
        placeholder?: string;
        canReorder?: boolean;
    };

    let {
        value = $bindable([]),
        placeholder = "Add a value…", // eslint-disable-line prefer-const
        canReorder = true, // eslint-disable-line prefer-const
    }: Props = $props();

    const settingInfo = getSetting();

    const baseId = $derived(settingInfo?.controlId ?? "repeatable-value");

    function setValueAt(index: number, next: string) {
        value[index] = next;
        value = [...value];
    }

    function addValue() {
        value = [...value, ""];
    }

    function removeValue(index: number) {
        value = value.filter((_, i) => i !== index);
    }

    function moveValue(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        [next[index], next[target]] = [next[target], next[index]];
        value = next;
    }
</script>

<div class="repeatable-setting">
    <div class="value-list">
        {#each value as entry, i (i)}
            <div class="value-row" in:fly={{y: -6, duration: 180}} out:fade={{duration: 150}}>
                <label class="sr-only" for={i === 0 ? baseId : `${baseId}-${i}`}>{settingInfo?.name ?? "Value"} {i + 1}</label>
                <input
                    id={i === 0 ? baseId : `${baseId}-${i}`}
                    type="text"
                    class="value-input"
                    value={entry}
                    {placeholder}
                    oninput={(event) => setValueAt(i, (event.currentTarget as HTMLInputElement).value)}
                />
                {#if canReorder}
                    <button
                        type="button"
                        class="row-action"
                        aria-label={`Move value ${i + 1} up`}
                        disabled={i === 0}
                        onclick={() => moveValue(i, -1)}
                    >↑</button>
                    <button
                        type="button"
                        class="row-action"
                        aria-label={`Move value ${i + 1} down`}
                        disabled={i === value.length - 1}
                        onclick={() => moveValue(i, 1)}
                    >↓</button>
                {/if}
                <button
                    type="button"
                    class="row-action remove"
                    aria-label={`Remove value ${i + 1}`}
                    onclick={() => removeValue(i)}
                >×</button>
            </div>
        {:else}
            <p class="value-empty">No values yet — add one below.</p>
        {/each}
    </div>
    <button type="button" class="add-value" onclick={addValue}>Add value</button>
</div>

<style>
.repeatable-setting {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    max-width: 380px;
}

.value-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
}

.value-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
}

.value-input {
    background: var(--bg-level-2);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-level-5);
    outline: none;
    color: inherit;
    text-align: right;
    flex: 1;
    min-width: 120px;
    max-width: 220px;
    padding: 2px 6px 3px;
}

.value-input:focus {
    background: var(--bg-input-focus);
    outline: var(--border-input-focus);
}

.row-action {
    border: none;
    background: rgba(255, 255, 255, 0.07);
    color: var(--font-color-muted);
    width: 20px;
    height: 20px;
    border-radius: 4px;
    font-size: 0.72rem;
    line-height: 1;
    cursor: pointer;
    transition: background 130ms ease, color 130ms ease;
}

.row-action:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    color: var(--font-color);
}

.row-action:focus-visible {
    outline: var(--border-input-focus);
}

.row-action:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.row-action.remove:hover:not(:disabled) {
    background: rgba(from var(--color-danger) r g b / 0.35);
    color: white;
}

.add-value {
    border: 1px dashed rgba(255, 255, 255, 0.28);
    background: transparent;
    color: var(--font-color-muted);
    border-radius: var(--radius-level-4);
    font-size: 0.75rem;
    font-weight: 500;
    padding: 3px 10px;
    cursor: pointer;
    transition: background 130ms ease, color 130ms ease, border-color 130ms ease;
}

.add-value:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--font-color);
    border-color: rgba(255, 255, 255, 0.45);
}

.add-value:focus-visible {
    outline: var(--border-input-focus);
}

.value-empty {
    margin: 0;
    color: var(--font-color-muted);
    font-size: 0.78rem;
    text-align: right;
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
</style>
