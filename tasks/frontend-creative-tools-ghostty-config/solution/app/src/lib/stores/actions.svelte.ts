// Shared config actions — the visible chrome buttons, the command palette, and WebMCP all
// call these, so every path produces the same state change and the same feedback.

import config, {diff, resetSetting} from "$lib/stores/config.svelte";
import {registry} from "$lib/settings/registry";
import {serialize} from "$lib/utils/parse";
import {error, success} from "$lib/stores/toasts.svelte";
import {withUndoEntry} from "$lib/stores/undo.svelte";

export function hasOverrides(): boolean {
    return Object.keys(diff()).length > 0;
}

export async function copyConfig(): Promise<boolean> {
    if (!hasOverrides()) return false;
    try {
        await window.navigator.clipboard.writeText(serialize(diff()));
        success("Config copied to clipboard");
        return true;
    }
    catch {
        error("Clipboard access failed. Copy the text manually or download instead.");
        return false;
    }
}

export function downloadConfig(): boolean {
    if (!hasOverrides()) return false;
    const blob = new Blob([serialize(diff())], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ghostty-config";
    link.click();
    URL.revokeObjectURL(url);
    success("Config downloaded");
    return true;
}

/** Reset every override as ONE undoable step. */
export function resetAll(): boolean {
    if (!hasOverrides()) return false;
    withUndoEntry(() => {
        for (const key of Object.keys(registry)) resetSetting(key as keyof typeof config);
    });
    success("All settings reset to defaults");
    return true;
}
