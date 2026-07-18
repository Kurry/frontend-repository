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
