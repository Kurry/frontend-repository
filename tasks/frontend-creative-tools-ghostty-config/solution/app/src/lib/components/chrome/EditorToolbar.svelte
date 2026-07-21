<script lang="ts">
    import Kbd from "./Kbd.svelte";
    import {canRedo, canUndo, redo, undo} from "$lib/stores/undo.svelte";
    import {editor, panels, toggleDiff} from "$lib/stores/editor.svelte";
    import {success} from "$lib/stores/toasts.svelte";

    const undoAvailable = $derived(canUndo());
    const redoAvailable = $derived(canRedo());
    const diffActive = $derived(editor.mode === "diff");

    function handleUndo() {
        if (undo()) success("Last change undone");
    }

    function handleRedo() {
        if (redo()) success("Change redone");
    }

    function handleToggleDiff() {
        const mode = toggleDiff();
        success(mode === "diff" ? "Diff mode on" : "Diff mode off");
    }
</script>

<div class="editor-toolbar" role="toolbar" aria-label="Editor actions">
    <button
        type="button"
        class="tool"
        onclick={handleUndo}
        disabled={!undoAvailable}
        aria-label="Undo"
        title="Undo the last setting change"
    >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6 3 2 6.5 6 10V7.5h3.5a3.25 3.25 0 0 1 0 6.5H7v1.5h2.5A4.75 4.75 0 0 0 6 6v-3Z"/></svg>
        Undo
        <Kbd>⌘Z</Kbd>
    </button>
    <button
        type="button"
        class="tool"
        onclick={handleRedo}
        disabled={!redoAvailable}
        aria-label="Redo"
        title="Reapply the undone change"
    >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M10 3 14 6.5 10 10V7.5H6.5a3.25 3.25 0 0 0 0 6.5H9v1.5H6.5A4.75 4.75 0 0 1 10 6V3Z"/></svg>
        Redo
        <Kbd>⌘⇧Z</Kbd>
    </button>

    <span class="divider" role="separator"></span>

    <button
        type="button"
        class="tool"
        aria-pressed={diffActive}
        onclick={handleToggleDiff}
        title="Compare each override with its default"
    >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h5v5H2V2Zm1 1v3h3V3H3Zm7-1h4v4h-4V2Zm1 1v2h2V3h-2ZM2 9h4v4H2V9Zm1 1v2h2v-2H3Zm7-1h4v4h-4V9Zm1 1v2h2v-2h-2Z"/></svg>
        Diff
        <Kbd>⌘D</Kbd>
    </button>
    <button
        type="button"
        class="tool"
        onclick={() => {panels.importOpen = true;}}
        title="Paste Ghostty config text to import"
    >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1 4 5h2.5v4h3V5H12L8 1ZM3 11v3h10v-3h1.5v4.5h-13V11H3Z"/></svg>
        Import
        <Kbd>⌘I</Kbd>
    </button>
    <button
        type="button"
        class="tool"
        onclick={() => {panels.profilesOpen = true;}}
        title="Save and re-apply named sets of overrides"
    >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 1h6l3 3v11H4V1Zm1 1v12h7V4.5L9.5 2H5Zm1 2h4v2H6V4Zm0 4h5v1H6V7Zm0 2.5h5v1H6v-1Z"/></svg>
        Profiles
        <Kbd>⌘P</Kbd>
    </button>
</div>

<style>
.editor-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 0 2px;
    flex-wrap: wrap;
}

.tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-level-4);
    background: rgba(255, 255, 255, 0.06);
    color: var(--font-color);
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, transform 120ms ease;
}

.tool svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}

.tool:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.13);
    border-color: rgba(255, 255, 255, 0.24);
}

.tool:active:not(:disabled) {
    transform: scale(0.96);
}

.tool:focus-visible {
    outline: var(--border-input-focus);
}

.tool[aria-pressed="true"] {
    background: var(--color-selected);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
}

.tool:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.tool :global(.kbd) {
    opacity: 0.75;
}

.divider {
    width: 1px;
    height: 18px;
    background: rgba(255, 255, 255, 0.14);
    margin: 0 4px;
}

@media (max-width: 900px) {
    .tool :global(.kbd) {
        display: none;
    }
}
</style>
