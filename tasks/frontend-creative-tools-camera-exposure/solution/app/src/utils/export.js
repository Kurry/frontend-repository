import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import {
  store,
  setStore,
  setUndoStack,
  setRedoStack,
  APERTURE_STOPS,
  SHUTTER_STOPS,
  ISO_STOPS,
  LOOK_PACKS,
  SCENES,
} from '../store';
import { z } from 'zod';

const apertureSchema = z.number().refine(value => APERTURE_STOPS.includes(value), 'aperture must be a supported stop');
const shutterSchema = z.number().int().refine(value => SHUTTER_STOPS.includes(value), 'shutter must be a supported stop');
const isoSchema = z.number().int().refine(value => ISO_STOPS.includes(value), 'iso must be a supported stop');
const sliderSchema = z.number().int().min(-100).max(100);
const lookPackSchema = z.enum(LOOK_PACKS).nullable();

const editStackSchema = z.object({
  schemaVersion: z.literal("camera-exposure.edit-stack.v1"),
  aperture: apertureSchema,
  shutter: shutterSchema,
  iso: isoSchema,
  contrast: sliderSchema,
  highlights: sliderSchema,
  shadows: sliderSchema,
  lookPack: lookPackSchema,
  scene: z.enum(SCENES),
  snapshots: z.array(z.object({
    name: z.string().trim().min(1).max(64),
    aperture: apertureSchema,
    shutter: shutterSchema,
    iso: isoSchema,
    contrast: sliderSchema,
    highlights: sliderSchema,
    shadows: sliderSchema,
    lookPack: lookPackSchema
  }))
});

export const getEditStack = () => {
  return JSON.stringify({
    schemaVersion: "camera-exposure.edit-stack.v1",
    aperture: store.aperture,
    shutter: store.shutter,
    iso: store.iso,
    contrast: store.contrast,
    highlights: store.highlights,
    shadows: store.shadows,
    lookPack: store.lookPack,
    scene: store.scene,
    snapshots: store.snapshots
  }, null, 2);
};

export const downloadEditStack = () => {
  const json = getEditStack();
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  saveAs(blob, "edit-stack.json");
};

export const copyEditStack = async () => {
  const json = getEditStack();
  await navigator.clipboard.writeText(json);
};

export const importEditStack = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    const data = editStackSchema.parse(parsed);

    // Validated, apply to store
    setStore('aperture', data.aperture);
    setStore('shutter', data.shutter);
    setStore('iso', data.iso);
    setStore('contrast', data.contrast);
    setStore('highlights', data.highlights);
    setStore('shadows', data.shadows);
    setStore('lookPack', data.lookPack);
    setStore('scene', data.scene);
    setStore('snapshots', data.snapshots);

    // The imported document replaces the current edit state; stale undo/redo
    // history would otherwise "undo" the import back to pre-import state.
    setUndoStack([]);
    setRedoStack([]);

    return { success: true };
  } catch (err) {
    let detail = err && err.message;
    if (err instanceof z.ZodError) {
      detail = err.issues
        .map((issue) => `${issue.path.join('.') || 'document'}: ${issue.message}`)
        .join('; ');
    }
    return { success: false, error: `invalid edit stack file${detail ? ` (${detail})` : ''}` };
  }
};

export const downloadImage = async (format = 'png') => {
  const container = document.getElementById('export-container');
  if (!container) return;

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: true,
      scale: 1, // Full size for bake
    });

    canvas.toBlob((blob) => {
      const extension = format === 'jpeg' ? 'jpg' : format;
      saveAs(blob, `exposure-export.${extension}`);
    }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`, format === 'jpeg' ? 0.9 : undefined);
  } catch (err) {
    console.error("Export failed:", err);
  }
};
