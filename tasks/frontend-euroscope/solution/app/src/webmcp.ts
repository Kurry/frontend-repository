// WebMCP action surface (contract zto-webmcp-v1). Every handler calls the same
// store command a visible control calls — no success path the UI lacks.
//
// Modules:
//   form-workflow-v1     (form_*)     wizard advance / return
//   structured-editor-v1 (editor_*)   choose + preview colour set and icon set
//   artifact-transfer-v1 (artifact_*) generate / export the patched result

import { BITMAPS } from "./data/bitmaps";
import { THEME_ORDER, css, hexToInt, type ThemeName } from "./data/themes";
import {
  STEPS,
  goBack,
  goNext,
  goToStep,
  replacedCount,
  selectIconSet,
  selectTheme,
  setSwatch,
  state,
} from "./store";

const CONTRACT_VERSION = "zto-webmcp-v1";

const STEP_SLUGS = [
  "upload-euroscope-executable",
  "update-theme-colours",
  "update-embedded-bitmaps",
  "download-new-executable",
] as const;

const PROPERTY_INDEX: Record<string, number> = {
  "backdrop-darkest": 0,
  "backdrop-darker": 1,
  "backdrop-main": 2,
  "backdrop-lighter": 3,
  "backdrop-lightest": 4,
  "foreground-secondary": 5,
};

const THEME_LOOKUP = new Map<string, ThemeName>(
  THEME_ORDER.map((t) => [t.toLowerCase(), t]),
);

type ToolResult = { ok: boolean; [k: string]: unknown };

type Tool = {
  name: string;
  module: string;
  description: string;
  handler: (args: Record<string, unknown>) => ToolResult;
};

function snapshot() {
  return {
    step: state.step,
    step_slug: STEP_SLUGS[state.step],
    step_label: STEPS[state.step],
    base_theme: state.baseTheme,
    swatches: state.swatches.map(css),
    icon_set: state.iconSet,
    replaced_bitmaps: replacedCount(),
    total_bitmaps: BITMAPS.length,
    generated: state.generated,
  };
}

const TOOLS: Tool[] = [
  {
    name: "form_advance",
    module: "form-workflow-v1",
    description:
      "Advance to the next patcher step (same as the Continue / Generate button).",
    handler: () => {
      const moved = goNext();
      return { ok: moved, ...snapshot() };
    },
  },
  {
    name: "form_return",
    module: "form-workflow-v1",
    description:
      "Return to the previous patcher step (same as the Back button).",
    handler: () => {
      const moved = goBack();
      return { ok: moved, ...snapshot() };
    },
  },
  {
    name: "editor_select",
    module: "structured-editor-v1",
    description:
      "Select a base colour set or a base icon set. object_type: base-theme | base-icon-set.",
    handler: (args) => {
      const objectType = String(args.object_type ?? "");
      const value = String(args.value ?? "");
      if (objectType === "base-theme") {
        const theme = THEME_LOOKUP.get(value.toLowerCase());
        if (!theme) return { ok: false, error: "unknown base-theme" };
        selectTheme(theme);
        return { ok: true, ...snapshot() };
      }
      if (objectType === "base-icon-set") {
        const set = value.toLowerCase();
        if (set !== "none" && set !== "vector")
          return { ok: false, error: "unknown base-icon-set" };
        selectIconSet(set);
        return { ok: true, ...snapshot() };
      }
      return { ok: false, error: "unknown object_type" };
    },
  },
  {
    name: "editor_update_property",
    module: "structured-editor-v1",
    description:
      "Set one swatch colour. property: backdrop-darkest | backdrop-darker | backdrop-main | backdrop-lighter | backdrop-lightest | foreground-secondary. value: #rrggbb.",
    handler: (args) => {
      const property = String(args.property ?? "");
      const value = String(args.value ?? "");
      const index = PROPERTY_INDEX[property];
      if (index === undefined) return { ok: false, error: "unknown property" };
      if (!/^#?[0-9a-fA-F]{6}$/.test(value))
        return { ok: false, error: "value must be #rrggbb" };
      setSwatch(index, hexToInt(value));
      return { ok: true, ...snapshot() };
    },
  },
  {
    name: "editor_switch_mode",
    module: "structured-editor-v1",
    description:
      "Open the theme-colours editor or the embedded-bitmaps editor. mode: theme-colours | embedded-bitmaps.",
    handler: (args) => {
      const mode = String(args.mode ?? "");
      if (mode === "theme-colours") return { ok: goToStep(1), ...snapshot() };
      if (mode === "embedded-bitmaps") return { ok: goToStep(2), ...snapshot() };
      return { ok: false, error: "unknown mode" };
    },
  },
  {
    name: "editor_preview",
    module: "structured-editor-v1",
    description:
      "Read the current preview: selected colour set, swatches, icon set, and replaced bitmap count.",
    handler: () => ({ ok: true, ...snapshot() }),
  },
  {
    name: "artifact_export",
    module: "artifact-transfer-v1",
    description:
      "Generate the patched result and open the download-new-executable step. format: patched-executable. Returns status only; the file download stays a UI action.",
    handler: (args) => {
      const format = String(args.format ?? "patched-executable");
      if (format !== "patched-executable")
        return { ok: false, error: "unknown export format" };
      const moved = goToStep(3);
      return { ok: true, moved, ...snapshot() };
    },
  },
];

export function installWebmcp(): void {
  const w = window as unknown as Record<string, unknown>;

  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    app: "custom-euroscope",
    modules: ["form-workflow-v1", "structured-editor-v1", "artifact-transfer-v1"],
    tool_count: TOOLS.length,
    state: snapshot(),
  });

  w.webmcp_list_tools = () =>
    TOOLS.map((t) => ({
      name: t.name,
      module: t.module,
      description: t.description,
    }));

  w.webmcp_invoke_tool = (name: string, args?: Record<string, unknown>) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args ?? {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
