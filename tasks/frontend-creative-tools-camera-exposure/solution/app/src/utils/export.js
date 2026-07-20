import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { store, setStore } from '../store';
import { z } from 'zod';

const editStackSchema = z.object({
  schemaVersion: z.literal("camera-exposure.edit-stack.v1"),
  aperture: z.number(),
  shutter: z.number(),
  iso: z.number(),
  contrast: z.number(),
  highlights: z.number(),
  shadows: z.number(),
  lookPack: z.string().nullable(),
  scene: z.string(),
  snapshots: z.array(z.object({
    name: z.string(),
    aperture: z.number(),
    shutter: z.number(),
    iso: z.number(),
    contrast: z.number(),
    highlights: z.number(),
    shadows: z.number(),
    lookPack: z.string().nullable()
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

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Invalid JSON structure" };
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
      saveAs(blob, `exposure-export.${format}`);
    }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`, format === 'jpeg' ? 0.9 : undefined);
  } catch (err) {
    console.error("Export failed:", err);
  }
};
