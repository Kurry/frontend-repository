import { z } from "zod";
import {
  store, setStore, setUndoStack, setRedoStack,
  APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, LOOK_PACKS, SCENES,
  netEV, fmtEV, fmtAperture, fmtShutter,
} from "../store";

// Live preview canvas (set by <CanvasPreview/>). Export reads true baked pixels.
let _previewCanvas = null;
export const setPreviewCanvas = (c) => { _previewCanvas = c; };
export const getPreviewCanvas = () => _previewCanvas;

const slider = z.number().int().min(-100).max(100);
const snapshotItem = z.object({
  name: z.string().trim().min(1).max(64),
  aperture: z.number().refine((v) => APERTURE_STOPS.includes(v), "aperture must be a supported stop"),
  shutter: z.number().int().refine((v) => SHUTTER_STOPS.includes(v), "shutter must be a supported stop"),
  iso: z.number().int().refine((v) => ISO_STOPS.includes(v), "iso must be a supported stop"),
  contrast: slider, highlights: slider, shadows: slider,
  lookPack: z.enum(LOOK_PACKS).nullable(),
});
export const editStackSchema = z.object({
  schemaVersion: z.literal("camera-exposure.edit-stack.v1"),
  aperture: z.number().refine((v) => APERTURE_STOPS.includes(v), "aperture must be a supported stop"),
  shutter: z.number().int().refine((v) => SHUTTER_STOPS.includes(v), "shutter must be a supported stop"),
  iso: z.number().int().refine((v) => ISO_STOPS.includes(v), "iso must be a supported stop"),
  contrast: slider, highlights: slider, shadows: slider,
  lookPack: z.enum(LOOK_PACKS).nullable(),
  scene: z.enum(SCENES),
  snapshots: z.array(snapshotItem),
});

export const buildEditStack = () => ({
  schemaVersion: "camera-exposure.edit-stack.v1",
  aperture: store.aperture,
  shutter: store.shutter,
  iso: store.iso,
  contrast: store.contrast,
  highlights: store.highlights,
  shadows: store.shadows,
  lookPack: store.lookPack,
  scene: store.scene,
  snapshots: store.snapshots.map((s) => ({
    name: s.name, aperture: s.aperture, shutter: s.shutter, iso: s.iso,
    contrast: s.contrast, highlights: s.highlights, shadows: s.shadows, lookPack: s.lookPack,
  })),
});
export const getEditStackText = () => JSON.stringify(buildEditStack(), null, 2);

const triggerDownload = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const downloadEditStack = () => {
  triggerDownload(new Blob([getEditStackText()], { type: "application/json" }), "edit-stack.json");
};
export const copyEditStack = async () => {
  const text = getEditStackText();
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* noop */ }
    ta.remove();
  }
};

export const importEditStack = (jsonString) => {
  let parsed;
  try { parsed = JSON.parse(jsonString); }
  catch { return { ok: false, error: "invalid edit stack file (not valid JSON)" }; }
  const res = editStackSchema.safeParse(parsed);
  if (!res.success) {
    const detail = res.error.issues
      .map((i) => `${i.path.join(".") || "document"} ${i.message}`)
      .join("; ");
    return { ok: false, error: `invalid edit stack file (${detail})` };
  }
  const d = res.data;
  setStore({
    aperture: d.aperture, shutter: d.shutter, iso: d.iso,
    contrast: d.contrast, highlights: d.highlights, shadows: d.shadows,
    lookPack: d.lookPack, scene: d.scene,
    snapshots: d.snapshots.map((s) => ({ id: `snap-${Math.random().toString(36).slice(2)}`, ...s })),
  });
  setUndoStack([]); setRedoStack([]);
  return { ok: true };
};

// ---- True-pixel image export from the live preview canvas ----
export const downloadImage = (format = "png", quality = 0.92) => {
  const src = _previewCanvas;
  if (!src) return;
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const ctx = out.getContext("2d");
  ctx.drawImage(src, 0, 0);
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  out.toBlob((blob) => {
    if (!blob) return;
    triggerDownload(blob, format === "jpeg" ? "exposure-export.jpg" : "exposure-export.png");
  }, mime, format === "jpeg" ? quality : undefined);
};

// ---- Settings card PNG with readable text pixels ----
export const downloadSettingsCard = () => {
  const W = 760, H = 480;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0b0f17"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e0473a"; ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = "#9aa3b2"; ctx.font = "600 22px 'Oswald', 'Arial Narrow', sans-serif";
  ctx.fillText("CAMERA EXPOSURE SIMULATOR — SETTINGS CARD", 32, 56);
  const ev = netEV();
  const rows = [
    ["APERTURE", fmtAperture(store.aperture)],
    ["SPEED", fmtShutter(store.shutter)],
    ["ISO", String(store.iso)],
    ["EXPOSURE", fmtEV(ev)],
    ["SCENE", store.scene],
    ["LOOK PACK", store.lookPack || "None"],
  ];
  let y = 120;
  for (const [k, v] of rows) {
    ctx.fillStyle = "#7c8696"; ctx.font = "600 20px 'Oswald', 'Arial Narrow', sans-serif";
    ctx.fillText(k, 32, y);
    ctx.fillStyle = "#ffffff"; ctx.font = "700 30px 'Oswald', 'Arial Narrow', sans-serif";
    ctx.fillText(v, 250, y);
    y += 52;
  }
  c.toBlob((blob) => blob && triggerDownload(blob, "exposure-settings-card.png"), "image/png");
};
