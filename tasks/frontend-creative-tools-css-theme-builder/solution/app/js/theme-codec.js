/* Theme hash codec: JSON → UTF-8 → zlib deflate → URL-safe Base64 (no padding) */

function toUrlSafeB64(bytes) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafeB64(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeTheme(theme) {
  const json = JSON.stringify(theme);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  return toUrlSafeB64(compressed);
}

export function decodeTheme(payload) {
  const bytes = fromUrlSafeB64(payload);
  const inflated = pako.inflate(bytes);
  const json = new TextDecoder().decode(inflated);
  return JSON.parse(json);
}

export function readThemeHash(hash = location.hash) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  const payload = params.get("theme");
  if (!payload) return null;
  try {
    return decodeTheme(payload);
  } catch (err) {
    console.warn("Failed to decode #theme hash", err);
    return null;
  }
}

export function writeThemeHash(theme) {
  const payload = encodeTheme(serializeTheme(theme));
  const next = `#theme=${payload}`;
  if (location.hash !== next) {
    history.replaceState(null, "", next);
  }
}

const TOKEN_KEYS = [
  "name",
  "color-scheme",
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
  "--color-accent",
  "--color-accent-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-info",
  "--color-info-content",
  "--color-success",
  "--color-success-content",
  "--color-warning",
  "--color-warning-content",
  "--color-error",
  "--color-error-content",
  "--radius-selector",
  "--radius-field",
  "--radius-box",
  "--size-selector",
  "--size-field",
  "--border",
  "--depth",
  "--noise",
];

export function serializeTheme(theme) {
  const out = {};
  for (const key of TOKEN_KEYS) {
    if (theme[key] != null) out[key] = theme[key];
  }
  return out;
}

const COLOR_KEYS = TOKEN_KEYS.filter((key) => key.startsWith("--color-"));
const COLOR_PATTERN = /^(?:oklch\([^)]+\)|#[0-9a-f]{6})$/i;
const ENUM_FIELDS = {
  "--radius-box": ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"],
  "--radius-field": ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"],
  "--radius-selector": ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"],
  "--size-field": ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"],
  "--size-selector": ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"],
  "--border": ["0.5px", "1px", "1.5px", "2px"],
  "--depth": ["0", "1"],
  "--noise": ["0", "1"],
};

export function validateThemeDocument(input) {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("theme: expected a JSON object");
  }

  const name = String(data.name ?? "").trim();
  if (!name || name.length > 64 || !/^[a-z0-9_-]+$/.test(name)) {
    throw new Error("name: use 1-64 lowercase letters, digits, hyphens, or underscores");
  }
  if (!['light', 'dark'].includes(data["color-scheme"])) {
    throw new Error("color-scheme: expected light or dark");
  }
  for (const key of COLOR_KEYS) {
    if (!COLOR_PATTERN.test(String(data[key] ?? ""))) {
      throw new Error(`${key}: expected oklch(...) or #RRGGBB`);
    }
  }
  for (const [key, allowed] of Object.entries(ENUM_FIELDS)) {
    if (!allowed.includes(String(data[key] ?? ""))) {
      throw new Error(`${key}: value is outside the allowed set`);
    }
  }

  const result = serializeTheme(data);
  result.name = name;
  result["--depth"] = String(data["--depth"]);
  result["--noise"] = String(data["--noise"]);
  return result;
}

export function themeToExtension(theme) {
  const lines = ["@theme {"];
  for (const key of TOKEN_KEYS) {
    if (key === "name") continue;
    if (theme[key] != null) lines.push(`  ${key}: ${theme[key]};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function cssThemeName(name) {
  const cleaned = String(name || "mytheme")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return cleaned || "mytheme";
}

export function themeToCss(theme) {
  const name = cssThemeName(theme.name || "mytheme");
  const scheme = theme["color-scheme"] === "dark" ? "dark" : "light";
  const lines = [`[data-theme="${name}"] {`, `  color-scheme: ${scheme};`];
  for (const key of TOKEN_KEYS) {
    if (key === "name" || key === "color-scheme") continue;
    if (theme[key] != null) lines.push(`  ${key}: ${theme[key]};`);
  }
  lines.push("}");
  return lines.join("\n");
}
