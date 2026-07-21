import {
  store, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, LOOK_PACKS, SCENES,
  setStop, setSlider, setScene, applyLookPack, resetAll,
  createPreset, updatePreset, deletePreset, toggleFavorite, applyPreset,
} from "./store";
import { downloadImage as dlImage, downloadEditStack as dlStack, copyEditStack as cpStack, importEditStack } from "./utils/export";

const TOOLS = [
  ["session_start", "command-session-v1"],
  ["session_stop", "command-session-v1"],
  ["session_restart", "command-session-v1"],
  ["session_advance", "command-session-v1"],
  ["editor_select", "structured-editor-v1"],
  ["editor_update_property", "structured-editor-v1"],
  ["editor_preview", "structured-editor-v1"],
  ["entity_create", "entity-collection-v1"],
  ["entity_select", "entity-collection-v1"],
  ["entity_update", "entity-collection-v1"],
  ["entity_delete", "entity-collection-v1"],
  ["entity_toggle", "entity-collection-v1"],
  ["artifact_export", "artifact-transfer-v1"],
  ["artifact_import", "artifact-transfer-v1"],
  ["artifact_copy", "artifact-transfer-v1"],
];

const ok = (extra = {}) => ({ status: "success", ...extra });
const err = (message) => ({ status: "error", message });
const snapshot = () => ({
  aperture: store.aperture, shutter: store.shutter, iso: store.iso,
  contrast: store.contrast, highlights: store.highlights, shadows: store.shadows,
  lookPack: store.lookPack, scene: store.scene,
});

const STOP_KEYS = { aperture: APERTURE_STOPS, shutter: SHUTTER_STOPS, iso: ISO_STOPS };
const SLIDER_KEYS = ["contrast", "highlights", "shadows"];

const applyStopArg = (value) => {
  if (value && typeof value === "object") {
    const control = value.control || value.stop || value.axis;
    const v = Number(value.value ?? value.stop ?? value);
    if (STOP_KEYS[control] && STOP_KEYS[control].includes(v)) return setStop(control, v);
    return false;
  }
  const n = Number(value);
  for (const k of Object.keys(STOP_KEYS)) if (STOP_KEYS[k].includes(n)) return setStop(k, n);
  return false;
};

const handlers = {
  session_start: () => ok({ mode: store.mode }),
  session_stop: () => { resetAll(); return ok(snapshot()); },
  session_restart: () => { resetAll(); return ok(snapshot()); },
  session_advance: () => ok(snapshot()),

  editor_select: (args = {}) => {
    const scene = args.scene ?? args.value ?? args.name;
    const look = args.lookPack ?? args.look ?? args.pack;
    const object = args.object ?? args.object_type ?? args.type;
    if (scene != null && SCENES.includes(scene)) { setScene(scene); return ok({ object: object || "exposure", scene: store.scene, ...snapshot() }); }
    if (look != null && (look === null || LOOK_PACKS.includes(look))) { applyLookPack(look); return ok({ object: object || "exposure", lookPack: store.lookPack, ...snapshot() }); }
    if (object === "exposure" || object == null) return ok({ object: "exposure", ...snapshot() });
    return err("Unknown selection target");
  },
  editor_update_property: (args = {}) => {
    const property = args.property ?? args.name ?? args.key;
    const value = args.value ?? args.to;
    if (property === "stop") { if (applyStopArg(value)) return ok({ property, ...snapshot() }); return err("Invalid stop value"); }
    if (property === "brightness") { if (setSlider("highlights", value)) return ok({ property, ...snapshot() }); return err("Invalid brightness value"); }
    if (STOP_KEYS[property]) { if (setStop(property, Number(value))) return ok({ property, ...snapshot() }); return err(`Invalid ${property} stop`); }
    if (SLIDER_KEYS.includes(property)) { if (setSlider(property, value)) return ok({ property, ...snapshot() }); return err(`Invalid ${property} value`); }
    if (property === "scene" && SCENES.includes(value)) { setScene(value); return ok({ property, ...snapshot() }); }
    if (property === "lookPack" && (value === null || LOOK_PACKS.includes(value))) { if (value !== null) applyLookPack(value); return ok({ property, ...snapshot() }); }
    return err("Unknown property");
  },
  editor_preview: () => ok(snapshot()),

  entity_create: (args = {}) => {
    const entity = args.entity ?? args.type;
    if (entity !== "preset") return err("Unknown entity");
    const fields = args.fields ?? args.data ?? args.entity_fields ?? args.payload ?? {};
    if (!fields.name || !APERTURE_STOPS.includes(Number(fields.aperture)) ||
        !SHUTTER_STOPS.includes(Number(fields.shutter)) || !ISO_STOPS.includes(Number(fields.iso)))
      return err("Invalid preset fields");
    const rec = createPreset(fields);
    return ok({ entity: "preset", id: rec.id });
  },
  entity_select: (args = {}) => {
    if ((args.entity ?? args.type) !== "preset") return err("Unknown entity");
    if (!store.presets.some((p) => p.id === args.id)) return err("Preset not found");
    applyPreset(args.id);
    return ok({ entity: "preset", id: args.id, ...snapshot() });
  },
  entity_update: (args = {}) => {
    if ((args.entity ?? args.type) !== "preset") return err("Unknown entity");
    const fields = args.fields ?? args.data ?? args.entity_fields ?? args.payload ?? {};
    if (!updatePreset(args.id, fields)) return err("Preset not found");
    return ok({ entity: "preset", id: args.id });
  },
  entity_delete: (args = {}) => {
    if ((args.entity ?? args.type) !== "preset") return err("Unknown entity");
    if (!args.confirm) return err("Confirm required");
    if (!deletePreset(args.id, true)) return err("Preset not found");
    return ok({ entity: "preset", id: args.id });
  },
  entity_toggle: (args = {}) => {
    if ((args.entity ?? args.type) !== "preset") return err("Unknown entity");
    if ((args.field ?? args.property) !== "favorite") return err("Only favorite can be toggled");
    if (!toggleFavorite(args.id)) return err("Preset not found");
    return ok({ entity: "preset", id: args.id });
  },

  artifact_export: (args = {}) => {
    const format = args.format ?? args.export_formats ?? args.type;
    if (format === "png") { dlImage("png"); return ok({ format: "png" }); }
    if (format === "jpeg") { dlImage("jpeg"); return ok({ format: "jpeg" }); }
    if (format === "edit-stack-json" || format === "edit-stack" || format === "json") { dlStack(); return ok({ format: "edit-stack-json" }); }
    return err("Unknown export format");
  },
  artifact_import: (args = {}) => {
    const mode = args.mode ?? args.import_modes ?? "edit-stack";
    if (mode !== "edit-stack") return err("Unknown import mode");
    const text = args.data ?? args.payload ?? args.json;
    if (typeof text !== "string") return err("Import requires a JSON string payload");
    const r = importEditStack(text);
    return r.ok ? ok({ mode, ...snapshot() }) : err(r.error);
  },
  artifact_copy: (args = {}) => {
    const what = args.target ?? args.what ?? "edit-stack";
    if (what === "edit-stack") { cpStack(); return ok({ target: "edit-stack" }); }
    return err("Unknown copy target");
  },
};

export default function registerWebMCP() {
  if (typeof window === "undefined") return;
  for (const [name] of TOOLS) window[`webmcp_${name}`] = (args) => handlers[name](args || {});
  window.webmcp_session_info = () => ({
    contractVersion: "zto-webmcp-v1",
    app: "Camera Exposure Simulator",
    modules: ["command-session-v1", "structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tools: TOOLS.map(([name]) => name),
  });
  window.webmcp_list_tools = () => TOOLS.map(([name, module]) => ({ name, module }));
  window.webmcp_invoke_tool = (name, args = {}) =>
    handlers[name] ? handlers[name](args || {}) : err(`Unknown tool: ${name}`);
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
