import {parse} from "$lib/utils/parse";
import {validateConfigText} from "$lib/utils/contracts";
import config, {defaults, diffFromDefaults, load} from "$lib/stores/config.svelte";
import {withUndoEntry} from "$lib/stores/undo.svelte";
import {decodeConfig, getSharePayloadFromHash, removeSharePayloadFromHash} from "$lib/utils/share";
import {error, success} from "$lib/stores/toasts.svelte";
import {alert as showAlert} from "$lib/stores/modals.svelte";

export type ImportSource = "share" | "clipboard" | "file" | "paste";

export interface PreviewState {
    source: ImportSource;
    text: string;
    parsed: Record<string, string | string[]> | null;
    parsedDiff: Record<string, string | string[]> | null;
    parseError: boolean;
    validationErrors: string[];
}

const SOURCE_INFO: Record<ImportSource, {title: string; description: string; noConfigMessage: string; successMessage: string;}> = {
    share: {
        title: "Shared config",
        description: "Someone shared a Ghostty config with you. Review it before importing.",
        noConfigMessage: "We couldn't find any valid config settings in the shared URL.",
        successMessage: "Shared config imported"
    },
    clipboard: {
        title: "Import config",
        description: "Importing replaces your current overrides with the imported ones. Review it before importing.",
        noConfigMessage: "We couldn't find any valid config settings in the clipboard you provided.",
        successMessage: "Config imported"
    },
    file: {
        title: "Import config",
        description: "Importing replaces your current overrides with the imported ones. Review it before importing.",
        noConfigMessage: "We couldn't find any valid config settings in the file you provided.",
        successMessage: "Config imported"
    },
    paste: {
        title: "Import config",
        description: "Paste Ghostty config text (key = value lines plus # comments). Importing replaces your current overrides.",
        noConfigMessage: "No config settings found in the pasted text.",
        successMessage: "Config imported"
    }
};

export const incomingImport = $state<{preview: PreviewState | null; show: boolean;}>({preview: null, show: false});

export function getSourceInfo(source: ImportSource) {
    return SOURCE_INFO[source];
}

function clearHash() {
    if (typeof window === "undefined") return;
    const cleaned = removeSharePayloadFromHash(window.location.hash);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${cleaned}`);
}

function buildPreview(source: ImportSource, text: string): PreviewState {
    const validation = validateConfigText(text);
    if (!validation.ok) {
        return {source, text, parsed: null, parsedDiff: null, parseError: false, validationErrors: validation.errors};
    }

    try {
        const parsed = parse(validation.lines.map(l => `${l.key} = ${l.value}`).join("\n"));
        const parsedDiff = diffFromDefaults(parsed);
        return {source, text, parsed, parsedDiff, parseError: false, validationErrors: []};
    }
    catch {
        return {source, text, parsed: null, parsedDiff: null, parseError: true, validationErrors: []};
    }
}

export function checkTextForImport(source: ImportSource, text: string) {
    const preview = buildPreview(source, text);
    const hasKeys = preview.parsedDiff && Object.keys(preview.parsedDiff).length > 0;

    // Contract-invalid text never opens the review surface — it is rejected up front with the
    // problems named, and no overrides are touched.
    if (preview.validationErrors.length) {
        error(`Import rejected: ${preview.validationErrors[0]}`);
        if (source === "share") clearHash();
        incomingImport.preview = preview;
        incomingImport.show = true;
        return;
    }

    if (!hasKeys && !preview.parseError) {
        void showAlert({title: "No config found", message: SOURCE_INFO[source].noConfigMessage, buttonText: "Dismiss"});
        if (source === "share") clearHash();
        return;
    }

    incomingImport.preview = preview;
    incomingImport.show = true;
}

export function checkHashForShare() {
    if (typeof window === "undefined") return;
    const payload = getSharePayloadFromHash(window.location.hash);
    if (!payload) return;

    try {
        checkTextForImport("share", decodeConfig(payload));
    }
    catch {
        error("Failed to read shared config from URL");
        clearHash();
    }
}

export type ApplyResult = {ok: true; overrides: number;} | {ok: false; errors: string[];};

/**
 * The single Import apply path — the visible dialog's Apply button and the WebMCP
 * artifact_import tool both land here, so automation and the UI mutate the same state.
 * Replaces the current overrides with the imported ones under one undo entry.
 */
export function applyConfigText(text: string, source: ImportSource = "paste"): ApplyResult {
    const validation = validateConfigText(text);
    if (!validation.ok) {
        return {ok: false, errors: validation.errors};
    }

    let overrides = 0;
    try {
        const parsed = parse(validation.lines.map(l => `${l.key} = ${l.value}`).join("\n"));
        const importedDiff = diffFromDefaults(parsed);
        overrides = Object.keys(importedDiff).length;

        withUndoEntry(() => {
            // Replace semantics: reset every key, then layer the imported overrides on top.
            for (const key of Object.keys(config)) {
                const defaultValue = defaults[key as keyof typeof defaults];
                (config as Record<string, unknown>)[key] = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue;
            }
            load(parsed);
        });

        success(SOURCE_INFO[source].successMessage);
        return {ok: true, overrides};
    }
    catch (err) {
        console.error(err); // eslint-disable-line no-console
        return {ok: false, errors: ["The pasted config could not be applied. Check the line format and try again."]};
    }
}

export async function applyIncomingImport() {
    if (!incomingImport.preview?.parsed) return;
    const {source, text} = incomingImport.preview;

    const result = applyConfigText(text, source);
    if (!result.ok) {
        error(`Import rejected: ${result.errors[0]}`);
        await showAlert({
            title: "Could not load config",
            message: result.errors.join("\n\n"),
            buttonText: "Dismiss"
        });
    }

    dismissIncomingImport();
}

export function dismissIncomingImport() {
    incomingImport.show = false;
    incomingImport.preview = null;
    clearHash();
}
