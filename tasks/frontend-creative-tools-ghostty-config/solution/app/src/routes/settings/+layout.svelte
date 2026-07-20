<script lang="ts">
    import type {Snippet} from "svelte";
    import ConfigPreview from "$lib/components/ConfigPreview.svelte";
    import Button from "$lib/components/Button.svelte";
    import config, {diff, resetSetting} from "$lib/stores/config.svelte";
    import {registry} from "$lib/settings/registry";
    import {serialize} from "$lib/utils/parse";
    import {debounce, withPendingGuard} from "$lib/utils/debounce";
    import {error, success} from "$lib/stores/toasts.svelte";

    const {children}: {children: Snippet} = $props();

    // The generated configuration, derived live from the settings store. Every edit to a
    // control on the left recomputes this diff and re-renders the monospace preview on the
    // right, so the control value, live preview, and generated line always agree.
    const currentDiff = $derived(diff());
    const changeCount = $derived(Object.keys(currentDiff).length);
    const hasChanges = $derived(changeCount > 0);

    const copyConfig = withPendingGuard(async () => {
        if (!hasChanges) return;
        try {
            await (async (t) => {
                if (!window.navigator.clipboard) {
                    const textArea = document.createElement("textarea");
                    textArea.value = t;
                    textArea.style.position = "fixed";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try { document.execCommand('copy'); } catch (err) { throw err; }
                    document.body.removeChild(textArea);
                } else {
                    try {
                        await window.navigator.clipboard.writeText(t);
                    } catch (err) {
                        const textArea = document.createElement("textarea");
                        textArea.value = t;
                        textArea.style.position = "fixed";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try { document.execCommand('copy'); } catch (e) { throw e; }
                        document.body.removeChild(textArea);
                    }
                }
            })(serialize(currentDiff));
            success("Config copied to clipboard");
        }
        catch {
            error("Clipboard access failed. Copy the text manually or download instead.");
        }
    });

    const downloadConfig = debounce(function() {
        if (!hasChanges) return;
        const blob = new Blob([serialize(currentDiff)], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "ghostty-config";
        link.click();
        URL.revokeObjectURL(url);
        success("Config downloaded");
    });

    function resetAll() {
        for (const key of Object.keys(registry)) resetSetting(key as keyof typeof config);
        success("All settings reset to defaults");
    }
</script>

<div class="settings-shell">
    <div class="settings-main">
        {@render children()}
    </div>
    <aside class="config-aside" aria-label="Generated configuration">
        <div class="aside-head">
            <h2>Generated config</h2>
            <span class="change-count" aria-live="polite">{changeCount} {changeCount === 1 ? "override" : "overrides"}</span>
        </div>
        <div class="aside-preview" id="generated-config">
            <ConfigPreview parsed={currentDiff} parsedDiff={currentDiff} />
        </div>
        <div class="aside-actions">
            <Button primary onclick={copyConfig} disabled={!hasChanges}>Copy</Button>
            <Button onclick={downloadConfig} disabled={!hasChanges}>Download</Button>
            <Button danger onclick={resetAll} disabled={!hasChanges}>Reset all</Button>
        </div>
    </aside>
</div>

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

.aside-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
    }
}
</style>
