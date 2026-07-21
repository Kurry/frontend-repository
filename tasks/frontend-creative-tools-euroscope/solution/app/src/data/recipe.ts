// The Patch recipe field contract (schemaVersion euroscope-patch-v1). The
// recipe IS the would-be request body describing the patch: one object, no
// undeclared top-level keys, every key required. Exports compile it live from
// the session store; imports validate against the exact same rules.

import { BITMAPS } from "./bitmaps";
import { HEX_RE, css } from "./colour";
import { SWATCH_LABELS, THEME_ORDER, type ThemeName } from "./themes";

export const SCHEMA_VERSION = "euroscope-patch-v1";

export const COLOUR_KEYS = [
  "backdropDarkest",
  "backdropDarker",
  "backdropMain",
  "backdropLighter",
  "backdropLightest",
  "foregroundSecondary",
] as const;

export type ColourKey = (typeof COLOUR_KEYS)[number];

export interface RecipeBitmap {
  keepOriginal: boolean;
}

export interface PatchRecipe {
  schemaVersion: string;
  target: { product: "EuroScope"; executableName: string };
  baseTheme: ThemeName;
  colours: Record<ColourKey, string>;
  iconSet: "none" | "vector";
  bitmaps: Record<string, RecipeBitmap>;
}

export interface RecipeInput {
  step: number;
  fileName: string;
  baseTheme: ThemeName;
  swatches: number[];
  iconSet: "none" | "vector";
  keepOriginal: Record<string, boolean>;
}

/** Compile the Patch recipe JSON object live from the session state. */
export function buildRecipe(s: RecipeInput): PatchRecipe {
  const colours = {} as Record<ColourKey, string>;
  COLOUR_KEYS.forEach((key, i) => {
    colours[key] = css(s.swatches[i] ?? 0);
  });
  const bitmaps: Record<string, RecipeBitmap> = {};
  for (const bm of BITMAPS) {
    bitmaps[String(bm.id)] = { keepOriginal: Boolean(s.keepOriginal[String(bm.id)]) };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    target: { product: "EuroScope", executableName: s.fileName },
    baseTheme: s.baseTheme,
    colours,
    iconSet: s.iconSet,
    bitmaps,
  };
}

/** The exact text shown in the Export center's Patch recipe JSON tab. */
export function recipeText(s: RecipeInput): string {
  return JSON.stringify(buildRecipe(s), null, 2);
}

/** The exact text shown in the Export center's Theme CSS tab. */
export function themeCssText(s: RecipeInput): string {
  const token = (key: string) =>
    "--es-" + key.replace(/([A-Z])/g, "-$1").toLowerCase();
  const lines = COLOUR_KEYS.map((key, i) => `  ${token(key)}: ${css(s.swatches[i] ?? 0)};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Human-readable Summary tab text. */
export function summaryText(s: RecipeInput): string {
  const replaced =
    s.iconSet === "vector"
      ? BITMAPS.filter((b) => !s.keepOriginal[String(b.id)]).length
      : 0;
  const kept = BITMAPS.length - replaced;
  const lines = [
    "Custom EuroScope patch summary",
    `Source executable: ${s.fileName}`,
    `Base theme: ${s.baseTheme}`,
    "",
    "Working colours:",
    ...COLOUR_KEYS.map((key, i) => `  ${SWATCH_LABELS[i]}: ${css(s.swatches[i] ?? 0)}`),
    "",
    `Base icon set: ${s.iconSet === "vector" ? "Vector" : "None (keep as-is)"}`,
    `Bitmaps replaced: ${replaced} of ${BITMAPS.length}`,
    s.iconSet === "vector" && kept > 0
      ? `Keep-original overrides: ${BITMAPS.filter((b) => s.keepOriginal[String(b.id)])
          .map((b) => b.id)
          .join(", ")}`
      : "Keep-original overrides: none",
  ];
  return lines.join("\n");
}

export type RecipeValidation =
  | { ok: true; recipe: PatchRecipe }
  | { ok: false; error: string };

const TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "target",
  "baseTheme",
  "colours",
  "iconSet",
  "bitmaps",
]);

const SEED_IDS = BITMAPS.map((b) => String(b.id));

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validate a parseable JSON value against the Patch recipe field contract.
 * Every failure names the offending field; nothing is applied on failure.
 */
export function validateRecipe(parsed: unknown): RecipeValidation {
  if (!isObject(parsed)) {
    return { ok: false, error: "recipe must be a single JSON object" };
  }
  for (const key of Object.keys(parsed)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      return { ok: false, error: `undeclared top-level key: ${key}` };
    }
  }

  if (!("schemaVersion" in parsed))
    return { ok: false, error: "missing required key: schemaVersion" };
  if (parsed.schemaVersion !== SCHEMA_VERSION)
    return {
      ok: false,
      error: `schemaVersion must be exactly "${SCHEMA_VERSION}" (got ${JSON.stringify(parsed.schemaVersion)})`,
    };

  if (!("target" in parsed)) return { ok: false, error: "missing required key: target" };
  const target = parsed.target;
  if (!isObject(target)) return { ok: false, error: "target must be an object" };
  for (const key of Object.keys(target)) {
    if (key !== "product" && key !== "executableName")
      return { ok: false, error: `undeclared key in target: ${key}` };
  }
  if (!("product" in target))
    return { ok: false, error: "missing required key: target.product" };
  if (target.product !== "EuroScope")
    return { ok: false, error: 'target.product must be exactly "EuroScope"' };
  if (!("executableName" in target))
    return { ok: false, error: "missing required key: target.executableName" };
  if (
    typeof target.executableName !== "string" ||
    !target.executableName.endsWith(".exe")
  )
    return { ok: false, error: 'target.executableName must be a string ending in ".exe"' };

  if (!("baseTheme" in parsed))
    return { ok: false, error: "missing required key: baseTheme" };
  if (!THEME_ORDER.includes(parsed.baseTheme as ThemeName))
    return {
      ok: false,
      error: `baseTheme must be one of ${THEME_ORDER.join(", ")} (got ${JSON.stringify(parsed.baseTheme)})`,
    };

  if (!("colours" in parsed))
    return { ok: false, error: "missing required key: colours" };
  const colours = parsed.colours;
  if (!isObject(colours)) return { ok: false, error: "colours must be an object" };
  for (const key of COLOUR_KEYS) {
    if (!(key in colours))
      return { ok: false, error: `missing required key: colours.${key}` };
    if (typeof colours[key] !== "string" || !HEX_RE.test(colours[key]))
      return {
        ok: false,
        error: `colours.${key} must be a #RRGGBB hex string (got ${JSON.stringify(colours[key])})`,
      };
  }
  for (const key of Object.keys(colours)) {
    if (!(COLOUR_KEYS as readonly string[]).includes(key))
      return { ok: false, error: `undeclared colours key: ${key}` };
  }

  if (!("iconSet" in parsed))
    return { ok: false, error: "missing required key: iconSet" };
  if (parsed.iconSet !== "none" && parsed.iconSet !== "vector")
    return {
      ok: false,
      error: `iconSet must be exactly "none" or "vector" (got ${JSON.stringify(parsed.iconSet)})`,
    };

  if (!("bitmaps" in parsed))
    return { ok: false, error: "missing required key: bitmaps" };
  const bitmaps = parsed.bitmaps;
  if (!isObject(bitmaps)) return { ok: false, error: "bitmaps must be an object" };
  for (const id of SEED_IDS) {
    if (!(id in bitmaps))
      return { ok: false, error: `bitmaps.${id} is missing (one entry per seeded bitmap is required)` };
    const entry = bitmaps[id];
    if (!isObject(entry))
      return { ok: false, error: `bitmaps.${id} must be an object with a boolean keepOriginal` };
    for (const key of Object.keys(entry)) {
      if (key !== "keepOriginal")
        return { ok: false, error: `undeclared key in bitmaps.${id}: ${key}` };
    }
    if (typeof entry.keepOriginal !== "boolean")
      return { ok: false, error: `bitmaps.${id}.keepOriginal must be a boolean` };
  }
  for (const id of Object.keys(bitmaps)) {
    if (!SEED_IDS.includes(id))
      return { ok: false, error: `bitmaps.${id} is not a seeded bitmap id` };
  }

  return { ok: true, recipe: parsed as unknown as PatchRecipe };
}
