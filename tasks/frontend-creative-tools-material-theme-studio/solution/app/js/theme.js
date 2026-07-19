/* ThemeOptions model + CSS variable sync for Material Theme Studio */
(function (global) {
  "use strict";

  var STORAGE_KEY = "material-theme-studio.themes.v1";
  var ACTIVE_KEY = "material-theme-studio.active.v1";

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function lighten(hex, amount) {
    return mix(hex, "#ffffff", amount);
  }

  function darken(hex, amount) {
    return mix(hex, "#000000", amount);
  }

  function mix(a, b, t) {
    var ca = parseHex(a);
    var cb = parseHex(b);
    if (!ca || !cb) return a;
    var r = Math.round(ca.r + (cb.r - ca.r) * t);
    var g = Math.round(ca.g + (cb.g - ca.g) * t);
    var bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return rgbToHex(r, g, bl);
  }

  function parseHex(hex) {
    if (!hex || typeof hex !== "string") return null;
    var h = hex.replace("#", "").trim();
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6) return null;
    var n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(function (v) {
          return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  function contrastText(hex) {
    var c = parseHex(hex);
    if (!c) return "#ffffff";
    var yiq = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
    return yiq >= 150 ? "#000000" : "#ffffff";
  }

  function expandColor(main) {
    return {
      main: main,
      light: lighten(main, 0.35),
      dark: darken(main, 0.25),
      contrastText: contrastText(main),
    };
  }

  function defaultTheme(overrides) {
    var base = {
      id: "default",
      name: "Default Theme",
      updatedAt: Date.now(),
      options: {
        palette: {
          type: "light",
          primary: expandColor("#3f51b5"),
          secondary: expandColor("#f50057"),
          error: expandColor("#f44336"),
          warning: expandColor("#ff9800"),
          info: expandColor("#2196f3"),
          success: expandColor("#4caf50"),
          background: { default: "#fafafa", paper: "#ffffff" },
          text: {
            primary: "rgba(0, 0, 0, 0.87)",
            secondary: "rgba(0, 0, 0, 0.54)",
            disabled: "rgba(0, 0, 0, 0.38)",
            hint: "rgba(0, 0, 0, 0.38)",
          },
          divider: "rgba(0, 0, 0, 0.12)",
        },
        typography: {
          fontFamily: "Roboto, Helvetica, Arial, sans-serif",
          fontSize: 14,
          h1: { fontSize: "6rem" },
          h2: { fontSize: "3.75rem" },
          h3: { fontSize: "3rem" },
          body1: { fontSize: "1rem" },
          button: { textTransform: "uppercase" },
        },
      },
      fonts: ["Roboto"],
    };
    if (overrides) {
      if (overrides.name) base.name = overrides.name;
      if (overrides.id) base.id = overrides.id;
      if (overrides.options) base.options = mergeOptions(base.options, overrides.options);
      if (overrides.fonts) base.fonts = overrides.fonts.slice();
    }
    return base;
  }

  function mergeOptions(target, source) {
    var out = deepClone(target);
    Object.keys(source || {}).forEach(function (k) {
      if (
        source[k] &&
        typeof source[k] === "object" &&
        !Array.isArray(source[k]) &&
        out[k] &&
        typeof out[k] === "object"
      ) {
        out[k] = mergeOptions(out[k], source[k]);
      } else {
        out[k] = deepClone(source[k]);
      }
    });
    return out;
  }

  function applyDarkSurfaces(options) {
    var o = deepClone(options);
    if (o.palette.type === "dark") {
      o.palette.background = { default: "#303030", paper: "#424242" };
      o.palette.text = {
        primary: "#fff",
        secondary: "rgba(255, 255, 255, 0.7)",
        disabled: "rgba(255, 255, 255, 0.5)",
        hint: "rgba(255, 255, 255, 0.5)",
      };
      o.palette.divider = "rgba(255, 255, 255, 0.12)";
    } else {
      o.palette.background = { default: "#fafafa", paper: "#ffffff" };
      o.palette.text = {
        primary: "rgba(0, 0, 0, 0.87)",
        secondary: "rgba(0, 0, 0, 0.54)",
        disabled: "rgba(0, 0, 0, 0.38)",
        hint: "rgba(0, 0, 0, 0.38)",
      };
      o.palette.divider = "rgba(0, 0, 0, 0.12)";
    }
    return o;
  }

  function setPaletteColor(options, key, role, value) {
    var o = deepClone(options);
    if (key === "background" || key === "text") {
      o.palette[key] = o.palette[key] || {};
      o.palette[key][role] = value;
      return o;
    }
    if (key === "divider") {
      o.palette.divider = value;
      return o;
    }
    if (role === "main") {
      o.palette[key] = expandColor(value);
    } else {
      o.palette[key] = o.palette[key] || expandColor("#3f51b5");
      o.palette[key][role] = value;
      if (role === "main") o.palette[key].contrastText = contrastText(value);
    }
    return o;
  }

  function setType(options, type) {
    var o = deepClone(options);
    o.palette.type = type === "dark" ? "dark" : "light";
    return applyDarkSurfaces(o);
  }

  function toEditorSource(options) {
    var p = options.palette;
    var t = options.typography || {};
    var shape = options.shape || {};
    var lines = [];
    lines.push("import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';");
    lines.push("");
    lines.push("export const themeOptions: ThemeOptions = {");
    lines.push("  palette: {");
    lines.push("    type: '" + p.type + "',");
    lines.push("    primary: {");
    lines.push("      main: '" + p.primary.main + "',");
    lines.push("      light: '" + p.primary.light + "',");
    lines.push("      dark: '" + p.primary.dark + "',");
    lines.push("      contrastText: '" + p.primary.contrastText + "',");
    lines.push("    },");
    lines.push("    secondary: {");
    lines.push("      main: '" + p.secondary.main + "',");
    lines.push("      light: '" + p.secondary.light + "',");
    lines.push("      dark: '" + p.secondary.dark + "',");
    lines.push("      contrastText: '" + p.secondary.contrastText + "',");
    lines.push("    },");
    lines.push("    error: { main: '" + p.error.main + "' },");
    lines.push("    warning: { main: '" + p.warning.main + "' },");
    lines.push("    info: { main: '" + p.info.main + "' },");
    lines.push("    success: { main: '" + p.success.main + "' },");
    lines.push("    background: {");
    lines.push("      default: '" + p.background.default + "',");
    lines.push("      paper: '" + p.background.paper + "',");
    lines.push("    },");
    lines.push("    text: {");
    lines.push("      primary: '" + p.text.primary + "',");
    lines.push("      secondary: '" + p.text.secondary + "',");
    lines.push("      disabled: '" + p.text.disabled + "',");
    lines.push("      hint: '" + p.text.hint + "',");
    lines.push("    },");
    lines.push("    divider: '" + p.divider + "',");
    lines.push("  },");
    lines.push("  typography: {");
    lines.push(
      "    fontFamily: '" +
        (t.fontFamily || "Roboto, Helvetica, Arial, sans-serif") +
        "',"
    );
    lines.push("    fontSize: " + (t.fontSize || 14) + ",");
    if (t.button && t.button.textTransform) {
      lines.push("    button: { textTransform: '" + t.button.textTransform + "' },");
    }
    lines.push("  },");
    if (options.spacing != null) {
      lines.push("  spacing: " + options.spacing + ",");
    }
    if (shape.borderRadius != null) {
      lines.push("  shape: { borderRadius: " + shape.borderRadius + " },");
    }
    lines.push("};");
    lines.push("");
    return lines.join("\n");
  }

  function parseEditorSource(src) {
    if (!src || typeof src !== "string") throw new Error("empty");
    var typeMatch = src.match(/type:\s*['"](light|dark)['"]/);
    var primary = src.match(/primary:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var secondary = src.match(/secondary:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var error = src.match(/error:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var warning = src.match(/warning:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var info = src.match(/info:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var success = src.match(/success:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
    var bgDefault = src.match(/background:\s*\{[\s\S]*?default:\s*['"]([^'"]+)['"]/);
    var bgPaper = src.match(/background:\s*\{[\s\S]*?paper:\s*['"]([^'"]+)['"]/);
    var fontFamily = src.match(/fontFamily:\s*['"]([^'"]+)['"]/);
    var fontSize = src.match(/fontSize:\s*(\d+)/);
    var buttonTransform = src.match(
      /button:\s*\{[\s\S]*?textTransform:\s*['"]([^'"]+)['"]/
    );
    var spacing = src.match(/\bspacing:\s*(\d+)/);
    var borderRadius = src.match(/shape:\s*\{[\s\S]*?borderRadius:\s*(\d+)/);

    var theme = defaultTheme();
    var o = theme.options;
    if (typeMatch) o = setType(o, typeMatch[1]);
    if (primary) o = setPaletteColor(o, "primary", "main", primary[1]);
    if (secondary) o = setPaletteColor(o, "secondary", "main", secondary[1]);
    if (error) o = setPaletteColor(o, "error", "main", error[1]);
    if (warning) o = setPaletteColor(o, "warning", "main", warning[1]);
    if (info) o = setPaletteColor(o, "info", "main", info[1]);
    if (success) o = setPaletteColor(o, "success", "main", success[1]);
    if (bgDefault) o = setPaletteColor(o, "background", "default", bgDefault[1]);
    if (bgPaper) o = setPaletteColor(o, "background", "paper", bgPaper[1]);
    if (fontFamily) o.typography.fontFamily = fontFamily[1];
    if (fontSize) o.typography.fontSize = Number(fontSize[1]);
    if (buttonTransform) {
      o.typography.button = o.typography.button || {};
      o.typography.button.textTransform = buttonTransform[1];
    }
    if (spacing) o.spacing = Number(spacing[1]);
    if (borderRadius) o.shape = { borderRadius: Number(borderRadius[1]) };
    theme.options = o;
    return theme.options;
  }

  function applyCssVars(options) {
    var root = document.documentElement;
    var p = options.palette;
    var t = options.typography || {};
    var shape = options.shape || {};
    var radius = shape.borderRadius != null ? shape.borderRadius : 4;
    var spacing = options.spacing != null ? options.spacing : 8;
    var btnTransform =
      (t.button && t.button.textTransform) || "uppercase";
    root.style.setProperty("--preview-primary", p.primary.main);
    root.style.setProperty("--preview-primary-light", p.primary.light);
    root.style.setProperty("--preview-primary-dark", p.primary.dark);
    root.style.setProperty("--preview-primary-contrast", p.primary.contrastText);
    root.style.setProperty("--preview-secondary", p.secondary.main);
    root.style.setProperty("--preview-secondary-light", p.secondary.light);
    root.style.setProperty("--preview-secondary-dark", p.secondary.dark);
    root.style.setProperty("--preview-secondary-contrast", p.secondary.contrastText);
    root.style.setProperty("--preview-error", p.error.main);
    root.style.setProperty("--preview-warning", p.warning.main);
    root.style.setProperty("--preview-info", p.info.main);
    root.style.setProperty("--preview-success", p.success.main);
    root.style.setProperty("--preview-bg", p.background.default);
    root.style.setProperty("--preview-paper", p.background.paper);
    root.style.setProperty("--preview-text", p.text.primary);
    root.style.setProperty("--preview-text-secondary", p.text.secondary);
    root.style.setProperty("--preview-text-disabled", p.text.disabled);
    root.style.setProperty("--preview-text-hint", p.text.hint);
    root.style.setProperty("--preview-divider", p.divider);
    root.style.setProperty("--preview-font", t.fontFamily || "Roboto, Helvetica, Arial, sans-serif");
    root.style.setProperty("--preview-font-size", (t.fontSize || 14) + "px");
    root.style.setProperty("--preview-radius", radius + "px");
    root.style.setProperty("--preview-spacing", spacing + "px");
    root.style.setProperty("--preview-button-transform", btnTransform);
  }

  function loadThemes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedThemes();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return seedThemes();
      return parsed;
    } catch (e) {
      return seedThemes();
    }
  }

  function seedThemes() {
    var themes = [
      defaultTheme({ id: "default", name: "Default Theme" }),
      defaultTheme({
        id: "dark-starter",
        name: "Dark Starter",
        options: {
          palette: {
            type: "dark",
            primary: expandColor("#90caf9"),
            secondary: expandColor("#f48fb1"),
          },
        },
      }),
      defaultTheme({
        id: "green",
        name: "Forest",
        options: {
          palette: {
            primary: expandColor("#2e7d32"),
            secondary: expandColor("#ff6f00"),
          },
        },
      }),
    ];
    themes[1].options = applyDarkSurfaces(themes[1].options);
    saveThemes(themes);
    if (!localStorage.getItem(ACTIVE_KEY)) {
      localStorage.setItem(ACTIVE_KEY, "default");
    }
    return themes;
  }

  function saveThemes(themes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  }

  function getActiveId() {
    return localStorage.getItem(ACTIVE_KEY) || "default";
  }

  function setActiveId(id) {
    localStorage.setItem(ACTIVE_KEY, id);
  }

  function templates() {
    return [
      defaultTheme({
        id: "tpl-indigo",
        name: "Indigo / Pink",
        options: {
          palette: {
            primary: expandColor("#3f51b5"),
            secondary: expandColor("#f50057"),
          },
        },
      }),
      defaultTheme({
        id: "tpl-teal",
        name: "Teal / Amber",
        options: {
          palette: {
            primary: expandColor("#00897b"),
            secondary: expandColor("#ffb300"),
          },
        },
      }),
      defaultTheme({
        id: "tpl-purple-dark",
        name: "Purple Dark",
        options: {
          palette: {
            type: "dark",
            primary: expandColor("#ce93d8"),
            secondary: expandColor("#80cbc4"),
          },
        },
      }),
    ].map(function (t) {
      t.options = applyDarkSurfaces(t.options);
      return t;
    });
  }

  var SNIPPETS = [
    {
      id: "dense",
      name: "Dense spacing",
      description: "Reduce default spacing for denser UI.",
      apply: function (options) {
        var o = deepClone(options);
        o.spacing = 4;
        return o;
      },
    },
    {
      id: "rounded",
      name: "Rounded shapes",
      description: "Increase border radius on paper surfaces.",
      apply: function (options) {
        var o = deepClone(options);
        o.shape = { borderRadius: 12 };
        return o;
      },
    },
    {
      id: "no-uppercase",
      name: "Button casing",
      description: "Disable uppercase transform on buttons.",
      apply: function (options) {
        var o = deepClone(options);
        o.typography = o.typography || {};
        o.typography.button = { textTransform: "none" };
        return o;
      },
    },
  ];

  global.ThemeStudio = {
    STORAGE_KEY: STORAGE_KEY,
    defaultTheme: defaultTheme,
    deepClone: deepClone,
    expandColor: expandColor,
    setPaletteColor: setPaletteColor,
    setType: setType,
    applyDarkSurfaces: applyDarkSurfaces,
    toEditorSource: toEditorSource,
    parseEditorSource: parseEditorSource,
    applyCssVars: applyCssVars,
    loadThemes: loadThemes,
    saveThemes: saveThemes,
    getActiveId: getActiveId,
    setActiveId: setActiveId,
    templates: templates,
    SNIPPETS: SNIPPETS,
    mergeOptions: mergeOptions,
  };
})(window);
