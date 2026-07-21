<script lang="ts">
    import type {Snippet} from "svelte";
    import {fade} from "svelte/transition";
    import ConfigPreview from "$lib/components/ConfigPreview.svelte";
    import Button from "$lib/components/Button.svelte";
    import Kbd from "$lib/components/chrome/Kbd.svelte";
    import DiffView from "$lib/components/chrome/DiffView.svelte";
    import ImportDialog from "$lib/components/chrome/ImportDialog.svelte";
    import ProfilesPanel from "$lib/components/chrome/ProfilesPanel.svelte";
    import CompareThemes from "$lib/components/chrome/CompareThemes.svelte";
    import {diff} from "$lib/stores/config.svelte";
    import {editor, panels, toggleDiff} from "$lib/stores/editor.svelte";
    import {redo, undo} from "$lib/stores/undo.svelte";
    import {copyConfig, downloadConfig, resetAll} from "$lib/stores/actions.svelte";
    import {success} from "$lib/stores/toasts.svelte";

    const {children}: {children: Snippet} = $props();

    // The generated configuration, derived live from the settings store. Every edit to a
    // control on the left recomputes this diff and re-renders the monospace preview on the
    // right, so the control value, live preview, and generated line always agree.
    const currentDiff = $derived(diff());
    const changeCount = $derived(Object.keys(currentDiff).length);
    const changesPresent = $derived(changeCount > 0);
    const diffMode = $derived(editor.mode === "diff");

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

    // Editor shortcuts share the exact same handlers as the toolbar buttons. Skipped while
    // typing in a form field so native text editing wins; the command palette keeps its own
    // global Cmd/Ctrl+K binding.
    function handleWindowKeydown(event: KeyboardEvent) {
        if (!(event.metaKey || event.ctrlKey)) return;
        const target = event.target as HTMLElement | null;
        const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
        if (typing) return;

        const key = event.key.toLocaleLowerCase();
        if (key === "z") {
            event.preventDefault();
            if (event.shiftKey) handleRedo();
            else handleUndo();
        }
        else if (key === "i") {
            event.preventDefault();
            panels.importOpen = !panels.importOpen;
        }
        else if (key === "d") {
            event.preventDefault();
            handleToggleDiff();
        }
        else if (key === "p") {
            event.preventDefault();
            panels.profilesOpen = !panels.profilesOpen;
        }
        else if (event.shiftKey && key === "c") {
            event.preventDefault();
            void copyConfig();
        }
        else if (event.shiftKey && key === "s") {
            event.preventDefault();
            downloadConfig();
        }
    }

</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="settings-shell">
    <div class="settings-main">
        {@render children()}
    </div>
    <aside class="config-aside" aria-label="Generated configuration">
        <div class="aside-head">
            <h2>{diffMode ? "Differences" : "Generated config"}</h2>
            <span class="change-count" aria-live="polite">{changeCount} {changeCount === 1 ? "override" : "overrides"}</span>
        </div>
        <div class="aside-preview" id="generated-config">
            {#if diffMode}
                <DiffView />
            {:else}
                <div class="preview-wrap" in:fade={{duration: 200}} out:fade={{duration: 160}}>
                    <ConfigPreview parsed={currentDiff} parsedDiff={currentDiff} />
                </div>
            {/if}
        </div>
        <div class="aside-actions">
            <Button primary onclick={() => {void copyConfig();}} disabled={!changesPresent} title={changesPresent ? "Copy the generated config" : "No changes yet"}>
                Copy <span class="action-kbd"><Kbd>⌘⇧C</Kbd></span>
            </Button>
            <Button onclick={() => {downloadConfig();}} disabled={!changesPresent} title={changesPresent ? "Download as ghostty-config" : "No changes yet"}>Download</Button>
            <Button danger onclick={() => {resetAll();}} disabled={!changesPresent} title={changesPresent ? "Clear every override" : "No changes yet"}>Reset all</Button>
        </div>
    </aside>
</div>

<ImportDialog />
<ProfilesPanel />
<CompareThemes />

<style>
.settings-shell {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-width: 0;
    height: 100%;
}

.settings-main {
    flex: 1;
    min-width: 0;
    display: flex;
}

.config-aside {
    width: 340px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 60px 16px 16px 16px;
    border-left: 1px solid var(--border-level-1);
    background: rgba(44, 39, 51, 0.55);
    backdrop-filter: blur(10px);
    overflow: hidden;
}

.aside-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
}

.aside-head h2 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    color: var(--font-color);
}

.change-count {
    font-size: 0.8rem;
    color: var(--font-color-muted);
}

.aside-preview {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
}

.preview-wrap {
    display: flex;
    flex: 1;
    min-height: 0;
}

.aside-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.action-kbd {
    display: inline-flex;
    margin-left: 2px;
    opacity: 0.8;
}

@media (max-width: 900px) {
    .settings-shell {
        flex-direction: column;
        height: auto;
    }

    .config-aside {
        width: auto;
        border-left: none;
        border-top: 1px solid var(--border-level-1);
        padding-top: 16px;
        /* Keep the export actions clear of the fixed dock at the bottom of the stack. */
        padding-bottom: 150px;
    }

    .action-kbd {
        display: none;
    }
}
</style>
