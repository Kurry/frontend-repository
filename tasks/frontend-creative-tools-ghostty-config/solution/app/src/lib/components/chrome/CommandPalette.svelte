<script lang="ts">
    // Command palette: Cmd/Ctrl+K opens a centered overlay, fuzzy-matches actions and
    // settings, and jumps to the chosen setting's category with its control focused — all
    // without a document reload. Keyboard shortcut hints sit beside each result.
    import {goto} from "$app/navigation";
    import {resolve} from "$app/paths";
    import {tick} from "svelte";
    import {fade, fly} from "svelte/transition";
    import {toAppWindow} from "$lib/attachments/portal";
    import Kbd from "./Kbd.svelte";
    import {panels, toggleDiff} from "$lib/stores/editor.svelte";
    import {copyConfig, downloadConfig, hasOverrides, resetAll} from "$lib/stores/actions.svelte";
    import {searchState, searchableSettings, setQuery} from "$lib/stores/search.svelte";
    import navigation from "$lib/settings/navigation";
    import {sequoiaEase} from "$lib/utils/animations";

    interface PaletteItem {
        id: string;
        kind: "command" | "setting";
        label: string;
        detail: string;
        hints: string[];
        score: number;
        run: () => void | Promise<void>;
    }

    let query = $state("");
    let activeIndex = $state(0);
    let inputEl: HTMLInputElement | undefined = $state();
    let cardEl: HTMLDivElement | undefined = $state();
    let previouslyFocused: HTMLElement | null = null;

    const isOpen = $derived(panels.paletteOpen);
    const overridesPresent = $derived(hasOverrides());

    const commands = $derived.by(() => [
        {id: "cmd-copy", label: "Copy config", detail: overridesPresent ? "Copy the generated config to the clipboard" : "Needs at least 1 override", hints: ["⌘", "⇧", "C"], disabled: !overridesPresent, run: () => {void copyConfig();}},
        {id: "cmd-download", label: "Download config", detail: "Save the generated config as a ghostty-config file", hints: ["⌘", "⇧", "S"], disabled: !overridesPresent, run: () => {downloadConfig();}},
        {id: "cmd-reset", label: "Reset all", detail: "Clear every override back to defaults", hints: [], disabled: !overridesPresent, run: () => {resetAll();}},
        {id: "cmd-import", label: "Import config…", detail: "Paste Ghostty config text to import", hints: ["⌘", "I"], disabled: false, run: () => {panels.importOpen = true;}},
        {id: "cmd-diff", label: "Toggle diff mode", detail: "Show each override beside its default", hints: ["⌘", "D"], disabled: false, run: () => {toggleDiff();}},
        {id: "cmd-profiles", label: "Profiles…", detail: "Save and re-apply named sets of overrides", hints: ["⌘", "P"], disabled: false, run: () => {panels.profilesOpen = true;}},
        {id: "cmd-compare", label: "Compare themes…", detail: "Preview two themes side by side", hints: [], disabled: false, run: () => {panels.compareOpen = true;}},
        {id: "cmd-share", label: "Share config link…", detail: "Encode your overrides into a shareable URL", hints: [], disabled: !overridesPresent, run: () => {void goto(resolve("/app/import-export"));}},
    ]);

    function fuzzyScore(token: string, text: string): number | null {
        let ti = 0;
        let score = 0;
        let lastHit = -2;
        for (const ch of token) {
            const hit = text.indexOf(ch, ti);
            if (hit === -1) return null;
            score += hit === 0 || /[^a-z0-9]/.test(text[hit - 1] ?? " ") ? 4 : 1; // word-start bonus
            score -= Math.min(hit - lastHit - 1, 8); // penalize gaps
            lastHit = hit;
            ti = hit + 1;
        }
        return score;
    }

    function matchScore(text: string): number | null {
        const haystack = text.toLocaleLowerCase();
        const tokens = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length) return 0;
        let total = 0;
        for (const token of tokens) {
            const tokenScore = fuzzyScore(token, haystack);
            if (tokenScore === null) return null;
            total += tokenScore;
        }
        return total;
    }

    const items = $derived.by((): PaletteItem[] => {
        const results: PaletteItem[] = [];
        for (const command of commands) {
            if (command.disabled && query) continue;
            const score = matchScore(command.label);
            if (score !== null) {
                results.push({id: command.id, kind: "command", label: command.label, detail: command.detail, hints: command.hints, score: score + 6, run: command.run});
            }
        }
        for (const setting of searchableSettings) {
            const score = matchScore(`${setting.settingName} ${setting.groupName}`);
            if (score !== null) {
                results.push({
                    id: `setting-${setting.routeKey}`,
                    kind: "setting",
                    label: setting.settingName,
                    detail: `${setting.categoryName} › ${setting.groupName}`,
                    hints: [],
                    score,
                    run: () => {void jumpToSetting(setting.categoryId, setting.settingId);}
                });
            }
        }
        return results.sort((a, b) => b.score - a.score).slice(0, 14);
    });

    async function jumpToSetting(categoryId: string, settingId: string) {
        close();
        await goto(resolve("/settings/[category]", {category: categoryId}));
        await tick();
        searchState.selectedId = settingId;
        await tick();
        // Focus the first operable control inside the flashed setting row.
        const row = document.querySelector<HTMLElement>(`[data-setting-id="${settingId}"]`);
        row?.querySelector<HTMLElement>("input, select, button, [tabindex]")?.focus();
    }

    function open() {
        previouslyFocused = document.activeElement as HTMLElement | null;
        panels.paletteOpen = true;
        query = "";
        activeIndex = 0;
        void tick().then(() => inputEl?.focus());
    }

    function close() {
        if (!panels.paletteOpen) return;
        panels.paletteOpen = false;
        query = "";
        setQuery("");
        previouslyFocused?.focus?.();
        previouslyFocused = null;
    }

    function toggle() {
        if (panels.paletteOpen) close();
        else open();
    }

    function runItem(item: PaletteItem) {
        const command = commands.find(c => c.id === item.id);
        if (command?.disabled) return;
        item.run();
        if (item.kind === "command") close();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            activeIndex = items.length ? (activeIndex + 1) % items.length : 0;
        }
        else if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = items.length ? (activeIndex - 1 + items.length) % items.length : 0;
        }
        else if (event.key === "Enter") {
            event.preventDefault();
            const item = items[activeIndex];
            if (item) runItem(item);
        }
        else if (event.key === "Escape") {
            event.stopPropagation();
            close();
        }
        else if (event.key === "Tab") {
            // Keep focus cycling inside the palette while it is open.
            event.preventDefault();
            inputEl?.focus();
        }
    }

    function handleGlobalKeydown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
            event.preventDefault();
            toggle();
            return;
        }
        // Escape closes the palette no matter which element holds focus.
        if (event.key === "Escape" && panels.paletteOpen) {
            event.stopPropagation();
            close();
        }
    }

    $effect(() => {
        if (activeIndex >= items.length) activeIndex = Math.max(items.length - 1, 0);
    });

    $effect(() => {
        if (!isOpen) return;
        const target = document.getElementById(`palette-item-${activeIndex}`);
        target?.scrollIntoView({block: "nearest"});
    });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if isOpen}
<div
    class="palette-backdrop"
    role="presentation"
    onclick={(event) => {if (event.target === event.currentTarget) close();}}
    transition:fade={{duration: 160}}
    {@attach toAppWindow}
>
    <div
        class="palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        bind:this={cardEl}
        transition:fly={{y: -18, duration: 220, easing: sequoiaEase}}
    >
        <div class="palette-input-row">
            <svg class="palette-search-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path fill="currentColor" d="M8.5 3a5.5 5.5 0 1 0 3.4 9.8l3.2 3.2 1-1-3.2-3.2A5.5 5.5 0 0 0 8.5 3Zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/>
            </svg>
            <input
                bind:this={inputEl}
                class="palette-input"
                type="search"
                aria-label="Search settings and actions"
                autocomplete="off"
                spellcheck="false"
                bind:value={query}
                oninput={() => {activeIndex = 0;}}
                onkeydown={handleKeydown}
            />
            <Kbd>esc</Kbd>
        </div>

        <ul class="palette-list" role="listbox" aria-label="Results">
            {#each items as item, index (item.id)}
                <li>
                    <button
                        type="button"
                        id={`palette-item-${index}`}
                        class="palette-item"
                        class:active={index === activeIndex}
                        role="option"
                        aria-selected={index === activeIndex}
                        onmouseenter={() => {activeIndex = index;}}
                        onclick={() => runItem(item)}
                    >
                        <span class="palette-item-kind" aria-hidden="true">{item.kind === "command" ? "⚡" : "⚙"}</span>
                        <span class="palette-item-text">
                            <span class="palette-item-label">{item.label}</span>
                            <span class="palette-item-detail">{item.detail}</span>
                        </span>
                        {#if item.hints.length}
                            <span class="palette-item-hints">
                                {#each item.hints as hint (hint)}<Kbd>{hint}</Kbd>{/each}
                            </span>
                        {/if}
                    </button>
                </li>
            {:else}
                <li class="palette-empty">No matches — try a setting name like “font” or an action like “import”.</li>
            {/each}
        </ul>
    </div>
</div>
{/if}

<style>
.palette-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.45);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 14%;
    z-index: 700;
}

.palette-card {
    width: min(560px, calc(100vw - 40px));
    max-height: 420px;
    display: flex;
    flex-direction: column;
    background: rgba(from var(--bg-level-1) r g b / 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border-level-1);
    border-radius: var(--radius-level-2);
    box-shadow:
        0 24px 60px -12px rgba(0, 0, 0, 0.8),
        0 0 1px white inset;
    overflow: hidden;
}

.palette-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-level-1);
}

.palette-search-icon {
    width: 16px;
    height: 16px;
    color: var(--font-color-muted);
    flex-shrink: 0;
}

.palette-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--font-color);
    font-size: 0.95rem;
}

.palette-input-row:focus-within {
    outline: var(--border-input-focus);
    outline-offset: -2px;
    border-radius: var(--radius-level-2) var(--radius-level-2) 0 0;
}

.palette-list {
    list-style: none;
    margin: 0;
    padding: 6px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.palette-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: var(--radius-level-4);
    background: transparent;
    color: var(--font-color);
    text-align: left;
    cursor: pointer;
    transition: background 120ms ease;
}

.palette-item.active {
    background: var(--color-selected);
    color: white;
}

.palette-item:focus-visible {
    outline: var(--border-input-focus);
}

.palette-item-kind {
    font-size: 0.9rem;
    opacity: 0.85;
    flex-shrink: 0;
}

.palette-item-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.palette-item-label {
    font-weight: 600;
    font-size: 0.88rem;
}

.palette-item-detail {
    font-size: 0.74rem;
    opacity: 0.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.palette-item-hints {
    display: inline-flex;
    gap: 3px;
    flex-shrink: 0;
}

.palette-empty {
    padding: 16px 12px;
    color: var(--font-color-muted);
    font-size: 0.84rem;
    text-align: center;
}
</style>
