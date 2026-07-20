// WebMCP surface for Ghostty Config.
//
// Every tool below drives the SAME domain code paths as the visible UI: navigation uses the
// SvelteKit router (same as the sidebar links), property edits call setSetting/resetSetting
// (the same functions every settings control binds to), Import lands on applyConfigText (the
// dialog's Apply path), profile ops call the profiles store (same as the Profiles panel),
// and export/copy call the same clipboard/download paths as the Copy and Download buttons.
// Handlers never invent a success path the UI does not have, and they never mutate the DOM
// or storage directly. Value bounds are enforced by the same Ghostty field contracts
// (utils/contracts.ts) that validate visible edits and Imports.
//
// Modules: structured-editor-v1 (spine) + artifact-transfer-v1 + browse-query-v1.

import {goto} from "$app/navigation";
import {resolve} from "$app/paths";
import config, {diff, resetSetting, setSetting} from "$lib/stores/config.svelte";
import {registry} from "$lib/settings/registry";
import {navigation} from "$lib/settings/navigation";
import {serialize} from "$lib/utils/parse";
import {THEMES, validateKeyValue} from "$lib/utils/contracts";
import {success} from "$lib/stores/toasts.svelte";
import {applyConfigText} from "$lib/stores/import.svelte";
import {applyProfile, deleteProfile, findProfileByName, profileOverrideCount, saveProfile} from "$lib/stores/profiles.svelte";
import {closeCompare, openCompare, panels, setEditorMode, type EditorMode} from "$lib/stores/editor.svelte";
import {setQuery} from "$lib/stores/search.svelte";

type ToolResult = Record<string, unknown>;
interface Tool {
    name: string;
    module: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>;
}

// Config sections = the top-level navigation panels. These are the editor object types and the
// browse destinations (plus the two chrome surfaces, profiles and command-palette). A closed,
// PRD-declared set — no arbitrary routes.
const SECTIONS = navigation.map(p => p.id) as string[];
const BROWSE_DESTINATIONS = [...SECTIONS, "profiles", "command-palette"];
const EDITOR_OBJECT_TYPES = [...SECTIONS, "profile"];
const EDITOR_MODES = ["edit", "diff", "compare"];

// Real Ghostty option keys → their internal registry id. The keys are exactly what appears in
// the generated config text (e.g. "font-family", "cursor-style", "background").
const KEY_TO_ID: Record<string, keyof typeof registry> = {};
for (const id of Object.keys(registry) as Array<keyof typeof registry>) {
    KEY_TO_ID[registry[id].key] = id;
}

// A representative, real subset advertised in tool metadata. update_property still validates
// against the full registry (a closed set), so any real option key is accepted.
const FEATURED_PROPERTIES = [
    "font-family", "font-size", "font-thicken", "cursor-style",
    "cursor-color", "cursor-opacity", "cursor-style-blink",
    "background", "foreground", "background-opacity", "theme",
    "window-padding-x", "window-padding-y", "window-decoration",
    "scrollback-limit", "mouse-scroll-multiplier",
    "clipboard-read", "clipboard-write", "copy-on-select"
];

function resolveId(property: unknown): keyof typeof registry | null {
    if (typeof property !== "string") return null;
    if (property in KEY_TO_ID) return KEY_TO_ID[property];
    if (property in registry) return property as keyof typeof registry;
    return null;
}

function generatedConfig(): string {
    return serialize(diff());
}

async function navigateToSection(section: unknown): Promise<ToolResult> {
    if (typeof section !== "string" || !SECTIONS.includes(section)) {
        return {ok: false, error: `Unknown section. Choose one of: ${SECTIONS.join(", ")}`};
    }
    await goto(resolve(`/settings/${section}` as `/settings/${string}`));
    return {ok: true, section};
}

const tools: Tool[] = [
    // ----- structured-editor-v1 -----
    {
        name: "editor_select",
        module: "structured-editor-v1",
        description: "Open a configuration section (object type) for editing — the same as clicking its sidebar entry. With object_type \"profile\" and a profile-name, applies that saved profile's overrides instead (the same as its Apply button).",
        parameters: {type: "object", properties: {object_type: {type: "string", enum: EDITOR_OBJECT_TYPES, description: "Config section id, or \"profile\""}, profile_name: {type: "string", description: "Required when object_type is \"profile\""}}, required: ["object_type"]},
        handler: async (args) => {
            const objectType = args.object_type ?? args.section;
            if (objectType === "profile") {
                const name = typeof args.profile_name === "string" ? args.profile_name.trim() : "";
                if (!name) return {ok: false, error: "profile-name is required (non-empty) to select a profile."};
                const profile = findProfileByName(name);
                if (!profile) return {ok: false, error: `No profile named "${name}".`};
                applyProfile(profile.id);
                return {ok: true, object_type: "profile", profile_name: profile.name, overrides: profileOverrideCount(profile)};
            }
            return navigateToSection(objectType);
        }
    },
    {
        name: "editor_update_property",
        module: "structured-editor-v1",
        description: "Set a Ghostty option to a value. Uses the same setSetting path as the on-screen control, so the live preview and the generated config line both update. Values are checked against the Ghostty field contracts (font-size 4-60, cursor-style enum, #RRGGBB colors, opacities 0-1, declared enums); invalid values are rejected and change nothing. An empty value clears the override.",
        parameters: {type: "object", properties: {property: {type: "string", description: "Option key", examples: FEATURED_PROPERTIES}, value: {type: "string", description: "New value (empty string clears the override)"}}, required: ["property", "value"]},
        handler: (args) => {
            const property = args.property;
            if (property === "profile-name") {
                return {ok: false, error: "profile-name is managed through editor_add / editor_select with object_type \"profile\", not as a config property."};
            }
            const id = resolveId(property);
            if (!id) return {ok: false, error: `Unknown option. Featured keys: ${FEATURED_PROPERTIES.join(", ")}`};

            const key = registry[id].key;
            const value = args.value == null ? "" : String(args.value);

            if (value === "") {
                resetSetting(id);
                return {ok: true, property: key, cleared: true, value: config[id]};
            }

            const contractError = validateKeyValue(key, value);
            if (contractError) return {ok: false, error: contractError};

            const isArray = Array.isArray(registry[id].default);
            if (isArray) setSetting(id, [value] as never);
            else setSetting(id, value as never);
            return {ok: true, property: key, value: config[id], line: `${key} = ${value}`};
        }
    },
    {
        name: "editor_delete",
        module: "structured-editor-v1",
        description: "Reset an option back to its default, dropping its override — same as the row's reset control; the generated config line disappears. With object_type \"profile\" and a profile-name, deletes that saved profile instead.",
        parameters: {type: "object", properties: {property: {type: "string", description: "Option key", examples: FEATURED_PROPERTIES}, object_type: {type: "string", enum: ["profile"], description: "Set to \"profile\" to delete a saved profile"}, profile_name: {type: "string", description: "Profile to delete when object_type is \"profile\""}}},
        handler: (args) => {
            if (args.object_type === "profile") {
                const name = typeof args.profile_name === "string" ? args.profile_name.trim() : "";
                if (!name) return {ok: false, error: "profile-name is required (non-empty) to delete a profile."};
                const profile = findProfileByName(name);
                if (!profile) return {ok: false, error: `No profile named "${name}".`};
                deleteProfile(profile.id);
                return {ok: true, object_type: "profile", deleted: profile.name};
            }

            const id = resolveId(args.property);
            if (!id) return {ok: false, error: "Unknown option."};
            resetSetting(id);
            return {ok: true, property: registry[id].key, value: config[id]};
        }
    },
    {
        name: "editor_preview",
        module: "structured-editor-v1",
        description: "Return the current generated Ghostty configuration text exactly as rendered in the preview pane, plus the number of overrides.",
        parameters: {type: "object", properties: {}},
        handler: () => {
            const d = diff();
            return {ok: true, overrides: Object.keys(d).length, text: generatedConfig()};
        }
    },
    {
        name: "editor_switch_mode",
        module: "structured-editor-v1",
        description: "Switch the editor surface: \"edit\" shows the normal form + generated config, \"diff\" shows the Diff view (each override's default beside its current value), \"compare\" opens the Compare themes surface. Same handlers as the Diff toggle and Compare themes control.",
        parameters: {type: "object", properties: {mode: {type: "string", enum: EDITOR_MODES}}, required: ["mode"]},
        handler: (args) => {
            const mode = args.mode;
            if (typeof mode !== "string" || !EDITOR_MODES.includes(mode)) {
                return {ok: false, error: `Unknown mode. Choose one of: ${EDITOR_MODES.join(", ")}`};
            }
            if (mode === "compare") openCompare();
            else {
                closeCompare();
                setEditorMode(mode as EditorMode);
            }
            return {ok: true, mode};
        }
    },
    {
        name: "editor_add",
        module: "structured-editor-v1",
        description: "Add a new object. Object type \"profile\" saves the current override set under the given profile-name (required, non-empty, no duplicates) — the same as the Profiles panel's Save.",
        parameters: {type: "object", properties: {object_type: {type: "string", enum: ["profile"]}, profile_name: {type: "string", description: "Name for the new profile (non-empty)"}}, required: ["object_type", "profile_name"]},
        handler: (args) => {
            if (args.object_type !== "profile") {
                return {ok: false, error: "Only object_type \"profile\" can be added."};
            }
            const name = typeof args.profile_name === "string" ? args.profile_name : "";
            if (!name.trim()) return {ok: false, error: "profile-name must be a non-empty string."};
            const result = saveProfile(name);
            if (!result.ok) return {ok: false, error: result.error};
            return {ok: true, object_type: "profile", profile_name: result.profile.name, overrides: profileOverrideCount(result.profile)};
        }
    },

    // ----- artifact-transfer-v1 -----
    {
        name: "artifact_export",
        module: "artifact-transfer-v1",
        description: "Download the generated configuration as a ghostty-config file, the same as the Download button. Returns a status only; the file itself is delivered to the browser.",
        parameters: {type: "object", properties: {}},
        handler: () => {
            const d = diff();
            if (Object.keys(d).length === 0) return {ok: false, error: "No overrides to export yet."};
            const blob = new Blob([serialize(d)], {type: "text/plain"});
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ghostty-config";
            link.click();
            URL.revokeObjectURL(url);
            success("Config downloaded");
            return {ok: true, overrides: Object.keys(d).length, filename: "ghostty-config"};
        }
    },
    {
        name: "artifact_copy",
        module: "artifact-transfer-v1",
        description: "Copy the generated configuration to the clipboard, the same as the Copy button. Returns a status only; clipboard contents are not returned.",
        parameters: {type: "object", properties: {}},
        handler: async () => {
            const d = diff();
            if (Object.keys(d).length === 0) return {ok: false, error: "No overrides to copy yet."};
            try {
                await window.navigator.clipboard.writeText(serialize(d));
            }
            catch {
                return {ok: false, error: "Clipboard access failed in this browser context."};
            }
            success("Config copied to clipboard");
            return {ok: true, overrides: Object.keys(d).length};
        }
    },
    {
        name: "artifact_import",
        module: "artifact-transfer-v1",
        description: "Import Ghostty config text (mode \"config-text\"): key = value lines plus # comments. Validates every line against the Ghostty field contracts and replaces the current overrides, exactly like the visible Import action's Apply. Malformed or contract-invalid text is rejected whole and changes nothing.",
        parameters: {type: "object", properties: {mode: {type: "string", enum: ["config-text"], description: "Import mode"}, text: {type: "string", description: "Ghostty config text"}}, required: ["text"]},
        handler: (args) => {
            const mode = args.mode ?? "config-text";
            if (mode !== "config-text") return {ok: false, error: "Only import mode \"config-text\" is supported."};
            if (typeof args.text !== "string") return {ok: false, error: "text must be a string of Ghostty config lines."};

            const result = applyConfigText(args.text, "paste");
            if (!result.ok) return {ok: false, errors: result.errors};
            return {ok: true, overrides: result.overrides};
        }
    },

    // ----- browse-query-v1 -----
    {
        name: "browse_open",
        module: "browse-query-v1",
        description: "Open a destination: any config section (same router navigation as the sidebar), the \"profiles\" panel, or the \"command-palette\" overlay.",
        parameters: {type: "object", properties: {destination: {type: "string", enum: BROWSE_DESTINATIONS}}, required: ["destination"]},
        handler: async (args) => {
            const destination = args.destination;
            if (typeof destination !== "string" || !BROWSE_DESTINATIONS.includes(destination)) {
                return {ok: false, error: `Unknown destination. Choose one of: ${BROWSE_DESTINATIONS.join(", ")}`};
            }
            if (destination === "profiles") {
                panels.profilesOpen = true;
                return {ok: true, destination};
            }
            if (destination === "command-palette") {
                panels.paletteOpen = true;
                return {ok: true, destination};
            }
            return navigateToSection(destination);
        }
    },
    {
        name: "browse_apply_filter",
        module: "browse-query-v1",
        description: "Apply the setting-search filter: filters the visible setting rows exactly like typing into the sidebar search field.",
        parameters: {type: "object", properties: {filter: {type: "string", enum: ["setting-search"]}, query: {type: "string", description: "Search text"}}, required: ["filter", "query"]},
        handler: (args) => {
            if (args.filter !== "setting-search") return {ok: false, error: "Only the \"setting-search\" filter exists."};
            const query = typeof args.query === "string" ? args.query : "";
            setQuery(query);
            return {ok: true, filter: "setting-search", query};
        }
    },
    {
        name: "browse_clear_filter",
        module: "browse-query-v1",
        description: "Clear the setting-search filter, restoring the full unfiltered form for the active category.",
        parameters: {type: "object", properties: {filter: {type: "string", enum: ["setting-search"]}}, required: ["filter"]},
        handler: (args) => {
            if (args.filter !== "setting-search") return {ok: false, error: "Only the \"setting-search\" filter exists."};
            setQuery("");
            return {ok: true, filter: "setting-search", cleared: true};
        }
    },
    {
        name: "browse_set_theme",
        module: "browse-query-v1",
        description: "Apply a bundled color theme. Sets the theme option (the same control on the Colors page); the terminal preview recolors and a `theme = <name>` line appears in the generated config.",
        parameters: {type: "object", properties: {theme: {type: "string", enum: THEMES}}, required: ["theme"]},
        handler: (args) => {
            const theme = args.theme;
            if (typeof theme !== "string" || !THEMES.includes(theme)) return {ok: false, error: `Unknown theme. Choose one of: ${THEMES.join(", ")}`};
            setSetting("theme", theme);
            return {ok: true, theme, line: `theme = ${theme}`};
        }
    }
];

export function registerWebMCP() {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    if (w.webmcp_list_tools) return; // already registered

    const publicTools = tools.map(t => ({name: t.name, module: t.module, description: t.description, parameters: t.parameters}));

    w.webmcp_session_info = () => ({
        app: "Ghostty Config",
        contract_version: "zto-webmcp-v1",
        modules: ["structured-editor-v1", "artifact-transfer-v1", "browse-query-v1"],
        tool_count: tools.length
    });
    w.webmcp_list_tools = () => publicTools;
    w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
        const tool = tools.find(t => t.name === name);
        if (!tool) return {ok: false, error: `Unknown tool: ${name}`};
        try {
            return await tool.handler(args ?? {});
        }
        catch (e) {
            return {ok: false, error: e instanceof Error ? e.message : String(e)};
        }
    };

    // Optional navigator.modelContext registration alongside the window surface.
    const nav = window.navigator as unknown as {modelContext?: {registerTool?: (t: unknown) => void}};
    if (nav.modelContext && typeof nav.modelContext.registerTool === "function") {
        for (const t of tools) {
            try {
                nav.modelContext.registerTool({
                    name: t.name,
                    description: t.description,
                    inputSchema: t.parameters,
                    execute: (args: Record<string, unknown>) => t.handler(args ?? {})
                });
            }
            catch {
                // Non-fatal: the window.* surface remains the source of truth.
            }
        }
    }
}
