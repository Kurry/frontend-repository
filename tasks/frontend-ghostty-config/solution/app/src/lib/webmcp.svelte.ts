// WebMCP surface for Ghostty Config.
//
// Every tool below drives the SAME domain code paths as the visible UI: navigation uses the
// SvelteKit router (same as the sidebar links), property edits call setSetting/resetSetting
// (the same functions every settings control binds to), and export/copy call the same
// clipboard/download paths as the Copy and Download buttons. Handlers never invent a success
// path the UI does not have, and they never mutate the DOM or storage directly.
//
// Modules: structured-editor-v1 (spine) + artifact-transfer-v1 + browse-query-v1.

import {goto} from "$app/navigation";
import {resolve} from "$app/paths";
import config, {diff, resetSetting, setSetting} from "$lib/stores/config.svelte";
import {registry} from "$lib/settings/registry";
import {navigation} from "$lib/settings/navigation";
import {serialize} from "$lib/utils/parse";
import {success} from "$lib/stores/toasts.svelte";

type ToolResult = Record<string, unknown>;
interface Tool {
    name: string;
    module: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>;
}

// Config sections = the top-level navigation panels. These are the editor object types and the
// browse destinations. A closed, PRD-declared set — no arbitrary routes.
const SECTIONS = navigation.map(p => p.id) as string[];

// Real Ghostty option keys → their internal registry id. The keys are exactly what appears in
// the generated config text (e.g. "font-family", "cursor-style", "background").
const KEY_TO_ID: Record<string, keyof typeof registry> = {};
for (const id of Object.keys(registry) as Array<keyof typeof registry>) {
    KEY_TO_ID[registry[id].key] = id;
}

// A representative, real subset advertised in tool metadata. update_property still validates
// against the full registry (a closed set), so any real option key is accepted.
const FEATURED_PROPERTIES = [
    "font-family", "font-size", "font-family-bold", "font-thicken",
    "cursor-style", "cursor-color", "cursor-opacity", "cursor-style-blink",
    "background", "foreground", "background-opacity", "theme",
    "window-padding-x", "window-padding-y", "window-decoration",
    "scrollback-limit", "mouse-scroll-multiplier",
    "clipboard-read", "clipboard-write", "copy-on-select"
];

// A handful of bundled color themes (present in the upstream iTerm2 sync) offered by set_theme.
const THEMES = ["Dracula", "Nord", "Gruvbox Dark", "Catppuccin Mocha", "Solarized Dark - Patched", "Builtin Dark"];

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
        description: "Open a configuration section (object type) for editing. Navigates the editor to that category, the same as clicking its sidebar entry.",
        parameters: {type: "object", properties: {object_type: {type: "string", enum: SECTIONS, description: "Config section id"}}, required: ["object_type"]},
        handler: (args) => navigateToSection(args.object_type ?? args.section)
    },
    {
        name: "editor_update_property",
        module: "structured-editor-v1",
        description: "Set a Ghostty option to a value. Uses the same setSetting path as the on-screen control, so the live preview and the generated config line both update. `property` is a real option key (e.g. font-family, font-size, cursor-style, background).",
        parameters: {type: "object", properties: {property: {type: "string", description: "Option key", examples: FEATURED_PROPERTIES}, value: {type: "string", description: "New value"}}, required: ["property", "value"]},
        handler: (args) => {
            const id = resolveId(args.property);
            if (!id) return {ok: false, error: `Unknown option. Featured keys: ${FEATURED_PROPERTIES.join(", ")}`};
            const value = args.value == null ? "" : String(args.value);
            const isArray = Array.isArray(registry[id].default);
            if (isArray) setSetting(id, (value === "" ? [] : [value]) as never);
            else setSetting(id, value as never);
            return {ok: true, property: registry[id].key, value: config[id], line: value === "" ? null : `${registry[id].key} = ${value}`};
        }
    },
    {
        name: "editor_delete",
        module: "structured-editor-v1",
        description: "Reset an option back to its default, dropping any override. Same as the row's reset control; the generated config line disappears (or returns to empty).",
        parameters: {type: "object", properties: {property: {type: "string", description: "Option key", examples: FEATURED_PROPERTIES}}, required: ["property"]},
        handler: (args) => {
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
            await window.navigator.clipboard.writeText(serialize(d));
            success("Config copied to clipboard");
            return {ok: true, overrides: Object.keys(d).length};
        }
    },

    // ----- browse-query-v1 -----
    {
        name: "browse_open",
        module: "browse-query-v1",
        description: "Open a configuration section by destination id. Same router navigation as the sidebar.",
        parameters: {type: "object", properties: {destination: {type: "string", enum: SECTIONS}}, required: ["destination"]},
        handler: (args) => navigateToSection(args.destination)
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
