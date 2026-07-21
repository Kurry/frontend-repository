// WebMCP action surface (contract zto-webmcp-v1). Every handler calls the
// same store command the visible controls call — no success path the UI
// lacks, and no fake state: results always reflect the live store.
//
// Modules (tool prefixes in parens):
//   form-workflow-v1     (form_*)     advance / return / reset
//   structured-editor-v1 (editor_*)   select / add / delete / update_property
//                                     / switch_mode / preview
//   artifact-transfer-v1 (artifact_*) export / import / copy
//
// Bindings honoured exactly — nothing beyond the instruction's Bindings
// block is exposed (no validate/submit/cancel, no set_content, no
// print_preview/convert).

import { BITMAPS } from "./data/bitmaps";
import { isHex, hexToInt, type ColourBlindness } from "./data/colour";
import {
  COLOUR_KEYS,
  SCHEMA_VERSION,
} from "./data/recipe";
import { SWATCH_LABELS, THEME_ORDER, css, type ThemeName } from "./data/themes";
import {
  STEPS,
  copyExport,
  deleteSnapshot,
  downloadPatched,
  goBack,
  goNext,
  goToStep,
  importRecipeParsed,
  replacedCount,
  resetToBase,
  restoreSnapshot,
  saveSnapshot,
  selectIconSet,
  selectTheme,
  setColourBlindness,
  setCompareView,
  setKeepOriginal,
  setSwatch,
  state,
  toggleTileSelected,
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

type ToolResult = { status: "success" | "error"; [k: string]: unknown };

type Tool = {
  name: string;
  module: string;
  description: string;
  handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>;
};

const ok = (result: Record<string, unknown> = {}): ToolResult => ({
  status: "success",
  ...result,
});
const fail = (error: string): ToolResult => ({ status: "error", error });

function snapshot() {
  return {
    step: state.step,
    step_slug: STEP_SLUGS[state.step],
    step_label: STEPS[state.step],
    base_theme: state.baseTheme,
    swatches: Object.fromEntries(
      COLOUR_KEYS.map((key, i) => [key, css(state.swatches[i] ?? 0)]),
    ),
    icon_set: state.iconSet,
    replaced_bitmaps: replacedCount(),
    total_bitmaps: BITMAPS.length,
    keep_original_bitmap_ids: BITMAPS.filter((b) => state.keepOriginal[String(b.id)]).map(
      (b) => b.id,
    ),
    selected_bitmap_ids: BITMAPS.filter((b) => state.selection[String(b.id)]).map(
      (b) => b.id,
    ),
    snapshot_names: state.snapshots.map((s) => s.name),
    compare: state.compare
      ? {
          snapshot: state.snapshots.find((s) => s.id === state.compare!.id)?.name ?? null,
          view: state.compare.view,
        }
      : null,
    colour_blindness: state.colourBlindness,
    active_export_tab: state.activeExportTab,
    generated: state.generated,
    downloaded: state.downloaded,
  };
}

function bitmapId(raw: unknown): number | null {
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  return BITMAPS.some((b) => b.id === id) ? id : null;
}

function findSnapshot(nameOrId: string) {
  const lower = nameOrId.trim().toLowerCase();
  return state.snapshots.find(
    (s) => s.id === nameOrId || s.name.trim().toLowerCase() === lower,
  );
}

const TOOLS: Tool[] = [
  // ---- form-workflow-v1 -------------------------------------------------
  {
    name: "form_advance",
    module: "form-workflow-v1",
    description:
      "Advance to the next patcher step (same path as the visible Continue / Generate button). At update-embedded-bitmaps this generates the patched result.",
    handler: () => (goNext() ? ok(snapshot()) : fail("already on the final step")),
  },
  {
    name: "form_return",
    module: "form-workflow-v1",
    description:
      "Return to the previous patcher step (same path as the visible Back button).",
    handler: () => (goBack() ? ok(snapshot()) : fail("already on the first step")),
  },
  {
    name: "form_reset",
    module: "form-workflow-v1",
    description:
      "Reset the working colours (same path as the visible Reset to base control): restores all six swatches to the selected base theme palette.",
    handler: () => {
      resetToBase();
      return ok(snapshot());
    },
  },

  // ---- structured-editor-v1 ----------------------------------------------
  {
    name: "editor_select",
    module: "structured-editor-v1",
    description:
      "Select an editor object. object_type: base-theme (value: EuroScope | Grey | Primer | Ayu | Solarised), base-icon-set (value: none | vector), palette-snapshot (value: snapshot name — restores its six colours, same as the visible Restore button), or bitmap-tile (value: bitmap id — toggles its multi-selection).",
    handler: (args) => {
      const objectType = String(args.object_type ?? "");
      const value = String(args.value ?? "");
      if (objectType === "base-theme") {
        const theme = THEME_LOOKUP.get(value.trim().toLowerCase());
        if (!theme)
          return fail(`unknown base-theme "${value}" (expected one of ${THEME_ORDER.join(", ")})`);
        selectTheme(theme);
        return ok(snapshot());
      }
      if (objectType === "base-icon-set") {
        const set = value.trim().toLowerCase();
        if (set !== "none" && set !== "vector")
          return fail('unknown base-icon-set (expected "none" or "vector")');
        selectIconSet(set);
        return ok(snapshot());
      }
      if (objectType === "palette-snapshot") {
        const snap = findSnapshot(value);
        if (!snap) return fail(`no saved snapshot named "${value}"`);
        restoreSnapshot(snap.id);
        return ok({ restored: snap.name, ...snapshot() });
      }
      if (objectType === "bitmap-tile") {
        const id = bitmapId(value);
        if (id === null) return fail(`bitmap ${value} is not a seeded bitmap id`);
        toggleTileSelected(id);
        return ok(snapshot());
      }
      return fail(
        "unknown object_type (expected base-theme | base-icon-set | palette-snapshot | bitmap-tile)",
      );
    },
  },
  {
    name: "editor_add",
    module: "structured-editor-v1",
    description:
      "Add an editor object. object_type: palette-snapshot (arg name: a non-empty snapshot name — same as the visible Save snapshot control, stores the current six working colours) or bitmap-tile (arg id: bitmap id — adds the tile to the multi-selection).",
    handler: (args) => {
      const objectType = String(args.object_type ?? "");
      if (objectType === "palette-snapshot") {
        const name = String(args.name ?? args.value ?? "");
        const result = saveSnapshot(name);
        if (!result.ok) return fail(`snapshot name: ${result.error}`);
        return ok({ added_snapshot: name.trim(), ...snapshot() });
      }
      if (objectType === "bitmap-tile") {
        const id = bitmapId(args.id ?? args.value);
        if (id === null) return fail("arg id must be a seeded bitmap id");
        if (!state.selection[String(id)]) toggleTileSelected(id);
        return ok(snapshot());
      }
      return fail("unknown object_type (expected palette-snapshot | bitmap-tile)");
    },
  },
  {
    name: "editor_delete",
    module: "structured-editor-v1",
    description:
      "Delete an editor object. object_type: palette-snapshot (arg name or value: snapshot name — removes the row) or bitmap-tile (arg id: bitmap id — removes the tile from the multi-selection).",
    handler: (args) => {
      const objectType = String(args.object_type ?? "");
      if (objectType === "palette-snapshot") {
        const snap = findSnapshot(String(args.name ?? args.value ?? ""));
        if (!snap) return fail("no saved snapshot with that name");
        deleteSnapshot(snap.id);
        return ok({ deleted_snapshot: snap.name, ...snapshot() });
      }
      if (objectType === "bitmap-tile") {
        const id = bitmapId(args.id ?? args.value);
        if (id === null) return fail("arg id must be a seeded bitmap id");
        if (state.selection[String(id)]) toggleTileSelected(id);
        return ok(snapshot());
      }
      return fail("unknown object_type (expected palette-snapshot | bitmap-tile)");
    },
  },
  {
    name: "editor_update_property",
    module: "structured-editor-v1",
    description:
      "Update an editor property. property: backdrop-darkest | backdrop-darker | backdrop-main | backdrop-lighter | backdrop-lightest | foreground-secondary (value: #RRGGBB — same validation as the visible hex fields, invalid colours are rejected); keep-original (args id + boolean value — same as the per-bitmap Keep original toggle); colour-blindness (value: none | protanopia | deuteranopia — refreshes the visible simulation control); compare-mode (value: before | after | off — drives the Before/After compare state).",
    handler: (args) => {
      const property = String(args.property ?? "");
      const value = args.value;
      if (property in PROPERTY_INDEX) {
        const index = PROPERTY_INDEX[property];
        const text = String(value ?? "");
        if (!isHex(text))
          return fail(
            `${SWATCH_LABELS[index]} needs a #RRGGBB hex value (got ${JSON.stringify(text)})`,
          );
        setSwatch(index, hexToInt(text));
        return ok(snapshot());
      }
      if (property === "keep-original") {
        const id = bitmapId(args.id);
        if (id === null) return fail("arg id must be a seeded bitmap id");
        let flag: boolean;
        if (typeof value === "boolean") flag = value;
        else if (value === "true" || value === "false") flag = value === "true";
        else return fail("keep-original value must be a boolean");
        setKeepOriginal(id, flag);
        return ok(snapshot());
      }
      if (property === "colour-blindness") {
        const mode = String(value ?? "").toLowerCase();
        if (mode !== "none" && mode !== "protanopia" && mode !== "deuteranopia")
          return fail('colour-blindness must be "none", "protanopia", or "deuteranopia"');
        setColourBlindness(mode as ColourBlindness);
        return ok(snapshot());
      }
      if (property === "compare-mode") {
        const mode = String(value ?? "").toLowerCase();
        if (mode !== "before" && mode !== "after" && mode !== "off")
          return fail('compare-mode must be "before", "after", or "off"');
        const result = setCompareView(mode as "before" | "after" | "off");
        if (!result.ok) return fail(result.error ?? "compare-mode unavailable");
        return ok(snapshot());
      }
      return fail(
        "unknown property (expected a swatch property, keep-original, colour-blindness, or compare-mode)",
      );
    },
  },
  {
    name: "editor_switch_mode",
    module: "structured-editor-v1",
    description:
      "Switch editor mode. mode: theme-colours (the Update theme colours step), embedded-bitmaps (the Update embedded bitmaps step), or export-center (the step-four export surface).",
    handler: (args) => {
      const mode = String(args.mode ?? "");
      if (mode === "theme-colours") {
        goToStep(1);
        return ok(snapshot());
      }
      if (mode === "embedded-bitmaps") {
        goToStep(2);
        return ok(snapshot());
      }
      if (mode === "export-center") {
        goToStep(3);
        return ok(snapshot());
      }
      return fail('unknown mode (expected theme-colours | embedded-bitmaps | export-center)');
    },
  },
  {
    name: "editor_preview",
    module: "structured-editor-v1",
    description:
      "Read the current editor state: step, base theme, six swatches, icon set, replaced bitmap count, keep-original overrides, snapshots, compare state, and simulation mode.",
    handler: () => ok(snapshot()),
  },

  // ---- artifact-transfer-v1 ----------------------------------------------
  {
    name: "artifact_export",
    module: "artifact-transfer-v1",
    description:
      'Export an artifact. format: patched-executable (drives the same generate/download path as the visible Download control; the file download itself stays a browser action), patch-recipe-json (returns preview_text identical to the visible Patch recipe JSON tab), or theme-css (returns preview_text identical to the visible Theme CSS tab). Results never contain file bytes.',
    handler: (args) => {
      const format = String(args.format ?? "patched-executable");
      if (format === "patched-executable") {
        downloadPatched();
        return ok({
          format,
          downloaded_as: "EuroScope.exe",
          note: "generate/download path invoked; the binary download is a browser action",
          ...snapshot(),
        });
      }
      if (format === "patch-recipe-json") {
        const recipe = {
          schemaVersion: SCHEMA_VERSION,
          target: { product: "EuroScope" as const, executableName: state.fileName },
          baseTheme: state.baseTheme,
          colours: Object.fromEntries(
            COLOUR_KEYS.map((key, i) => [key, css(state.swatches[i] ?? 0)]),
          ),
          iconSet: state.iconSet,
          bitmaps: Object.fromEntries(
            BITMAPS.map((b) => [
              String(b.id),
              { keepOriginal: Boolean(state.keepOriginal[String(b.id)]) },
            ]),
          ),
        };
        return ok({
          format,
          preview_text: JSON.stringify(recipe, null, 2),
          ...snapshot(),
        });
      }
      if (format === "theme-css") {
        const lines = COLOUR_KEYS.map(
          (key, i) =>
            `  --es-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${css(state.swatches[i] ?? 0)};`,
        );
        return ok({
          format,
          preview_text: `:root {\n${lines.join("\n")}\n}`,
          ...snapshot(),
        });
      }
      return fail(
        'unknown export format (expected patched-executable | patch-recipe-json | theme-css)',
      );
    },
  },
  {
    name: "artifact_import",
    module: "artifact-transfer-v1",
    description:
      "Import an artifact. mode: patch-recipe with arg recipe (a Patch recipe JSON object) or recipe_text (its JSON string). Runs the same Patch recipe field-contract validation as the visible Import recipe control: on any violation nothing changes and the error names the offending field.",
    handler: (args) => {
      const mode = String(args.mode ?? "patch-recipe");
      if (mode !== "patch-recipe") return fail('import mode must be "patch-recipe"');
      let parsed: unknown;
      if (args.recipe !== undefined && args.recipe !== null) {
        parsed = args.recipe;
      } else if (typeof args.recipe_text === "string") {
        try {
          parsed = JSON.parse(args.recipe_text);
        } catch (err) {
          return fail(`recipe_text is not valid JSON (${(err as Error).message})`);
        }
      } else {
        return fail("provide arg recipe (object) or recipe_text (JSON string)");
      }
      const result = importRecipeParsed(parsed);
      if (!result.ok) return fail(result.message);
      return ok({ message: result.message, ...snapshot() });
    },
  },
  {
    name: "artifact_copy",
    module: "artifact-transfer-v1",
    description:
      "Copy export (same path as the visible Copy export control): puts the active Export center preview text on the clipboard and shows the same short confirmation. No content is returned in the result.",
    handler: async () => {
      const copied = await copyExport();
      if (!copied) return fail("clipboard write was blocked by the browser");
      return ok({
        copied: state.activeExportTab === "css" ? "theme-css" : state.activeExportTab === "summary" ? "summary" : "patch-recipe-json",
        note: "clipboard updated; confirmation shown in the UI",
      });
    },
  },
];

export function installWebmcp(): void {
  const w = window as unknown as Record<string, unknown>;

  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    app: "custom-euroscope",
    modules: ["form-workflow-v1", "structured-editor-v1", "artifact-transfer-v1"],
    workflow_steps: [...STEP_SLUGS],
    tool_count: TOOLS.length,
    state: snapshot(),
  });

  w.webmcp_list_tools = () =>
    TOOLS.map((t) => ({
      name: t.name,
      module: t.module,
      description: t.description,
    }));

  w.webmcp_invoke_tool = async (
    name: string,
    args?: Record<string, unknown>,
  ): Promise<ToolResult> => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return fail(`unknown tool: ${name}`);
    try {
      return await tool.handler(args ?? {});
    } catch (err) {
      return fail(`tool ${name} failed: ${String(err)}`);
    }
  };
}
