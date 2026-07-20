// Ghostty create/update field contracts.
//
// The generated config is the would-be Ghostty create/update request body, so every committed
// override — typed into a control, pasted through Import, or set through WebMCP — validates
// against the same closed set of rules below. One implementation, three consumers, no drift.

export const THEMES = ["Dracula", "Nord", "Gruvbox Dark", "Catppuccin Mocha", "Solarized Dark - Patched", "Builtin Dark"];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const LOOSE_HEX_RE = /^#?[0-9a-fA-F]{6}$/;

const ENUMS: Record<string, string[]> = {
    "cursor-style": ["block", "bar", "underline", "block_hollow"],
    "theme": THEMES,
    "clipboard-read": ["ask", "allow", "deny"],
    "clipboard-write": ["ask", "allow", "deny"],
    "copy-on-select": ["true", "false", "clipboard"],
    "window-decoration": ["auto", "none", "client", "server"],
};

const HEX_KEYS = new Set(["background", "foreground", "cursor-color", "selection-background", "selection-foreground"]);

function isNumber(text: string): boolean {
    return text.trim() !== "" && !Number.isNaN(Number(text));
}

function isNonNegativeNumber(text: string): boolean {
    return isNumber(text) && Number(text) >= 0;
}

/** Normalize an accepted hex color to canonical #RRGGBB form. */
export function canonicalHex(value: string): string {
    const v = value.trim();
    return v.startsWith("#") ? v : `#${v}`;
}

/**
 * Validate one `key = value` pair against the Ghostty field contracts.
 * Returns null when the value is valid, or a message naming the setting and its contract.
 */
export function validateKeyValue(key: string, value: string): string | null {
    const v = value.trim();

    if (key === "font-family") {
        return v === "" ? "font-family must be a non-empty string" : null;
    }

    if (key === "font-size") {
        if (!isNumber(v) || Number(v) < 4 || Number(v) > 60) return "font-size must be a number from 4 to 60";
        return null;
    }

    if (key in ENUMS) {
        const allowed = ENUMS[key];
        if (!allowed.includes(v)) return `${key} must be one of ${allowed.join(", ")}`;
        return null;
    }

    if (HEX_KEYS.has(key)) {
        return LOOSE_HEX_RE.test(v) ? null : `${key} must be a #RRGGBB hex color`;
    }

    if (key === "background-opacity" || key === "cursor-opacity") {
        if (!isNumber(v) || Number(v) < 0 || Number(v) > 1) return `${key} must be a number from 0 to 1`;
        return null;
    }

    if (key === "window-padding-x" || key === "window-padding-y") {
        // Ghostty accepts one value or a comma-separated pair; every part must be >= 0.
        const parts = v.split(",").map(part => part.trim());
        if (parts.length === 0 || parts.length > 2 || parts.some(part => !isNonNegativeNumber(part))) {
            return `${key} must be a non-negative number (or two comma-separated numbers)`;
        }
        return null;
    }

    if (key === "scrollback-limit") {
        if (!isNumber(v) || !Number.isInteger(Number(v)) || Number(v) < 0) return "scrollback-limit must be a non-negative integer";
        return null;
    }

    if (key === "profile-name") {
        return v === "" ? "profile-name must be a non-empty string" : null;
    }

    // Every other Ghostty option keeps its free-form string value.
    return null;
}

/** Validate a single palette entry value of the form `N=#RRGGBB` (N is 0 to 255). */
export function validatePaletteValue(value: string): string | null {
    const [rawIndex, rawColor] = value.split("=");
    const index = Number(rawIndex?.trim());
    const color = rawColor?.trim() ?? "";
    if (rawIndex === undefined || rawColor === undefined || !Number.isInteger(index) || index < 0 || index > 255) {
        return "palette entries must be N=#RRGGBB with N from 0 to 255";
    }
    if (!LOOSE_HEX_RE.test(color)) return `palette entry ${index} must use a #RRGGBB hex color`;
    return null;
}

/** Validate a keybind entry of the form `trigger=action`. */
export function validateKeybindValue(value: string): string | null {
    const eq = value.indexOf("=");
    if (eq <= 0 || eq === value.length - 1) return "keybind entries must be trigger=action";
    return null;
}

export interface ParsedLine {
    key: string;
    value: string;
}

export type ConfigValidation =
    | {ok: true; lines: ParsedLine[];}
    | {ok: false; errors: string[];};

const LINE_RE = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*)\s*$/;

/**
 * Validate a pasted Ghostty config (key = value lines plus # comments). Malformed lines and
 * contract violations reject the whole text — Import applies nothing unless every line holds.
 */
export function validateConfigText(text: string): ConfigValidation {
    const errors: string[] = [];
    const lines: ParsedLine[] = [];
    const keybindTriggers = new Map<string, string>(); // trigger -> first action

    const rawLines = text.split("\n");
    for (let i = 0; i < rawLines.length; i++) {
        const raw = rawLines[i].trim();
        if (raw === "" || raw.startsWith("#")) continue;

        const match = LINE_RE.exec(raw);
        if (!match) {
            errors.push(`Line ${i + 1} is not a valid "key = value" line: "${raw.length > 40 ? `${raw.slice(0, 40)}…` : raw}"`);
            continue;
        }

        const key = match[1].trim();
        let value = match[2].trim();

        if (key === "palette") {
            const paletteError = validatePaletteValue(value);
            if (paletteError) errors.push(`Line ${i + 1}: ${paletteError}`);
            else {
                const [idx, color] = value.split("=");
                lines.push({key, value: `${Number(idx.trim())}=${canonicalHex(color.trim())}`});
            }
            continue;
        }

        if (key === "keybind") {
            const keybindError = validateKeybindValue(value);
            if (keybindError) {
                errors.push(`Line ${i + 1}: ${keybindError}`);
                continue;
            }
            const eq = value.indexOf("=");
            const trigger = value.slice(0, eq).trim();
            const action = value.slice(eq + 1).trim();
            const existing = keybindTriggers.get(trigger);
            if (existing && existing !== action) {
                errors.push(`Duplicate keybind trigger "${trigger}" is assigned to both "${existing}" and "${action}"`);
                continue;
            }
            keybindTriggers.set(trigger, action);
            lines.push({key, value: `${trigger}=${action}`});
            continue;
        }

        // Normalize bare 6-digit hex colors the same way Ghostty accepts them.
        if (HEX_KEYS.has(key) && LOOSE_HEX_RE.test(value)) value = canonicalHex(value);

        const contractError = validateKeyValue(key, value);
        if (contractError) {
            errors.push(`Line ${i + 1}: ${contractError}`);
            continue;
        }

        lines.push({key, value});
    }

    if (errors.length) return {ok: false, errors};
    return {ok: true, lines};
}
