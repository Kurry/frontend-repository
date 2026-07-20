import type { Palette, Period } from '../store/types';

export const PERIODS: Period[] = [
  'Abstract + Geometric',
  'Americana',
  'Baroque to Neoclassical',
  'Expressionism',
  'Fauvism',
  'Impressionism',
  'Medieval',
  'Modern',
  'Old Masters',
  'Post-Impressionism',
  'Primitive + Folk',
  'Realism',
  'Romanticism',
  'Symbolism',
  'Tonalism',
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Mirrors detail-editor.tsx's own per-field validation so the WebMCP
// entity_create / entity_update / artifact_import tools can't write invalid
// palettes that the UI form would have blocked.
//
// `requireId` is opt-in: entity_create fields never carry an id (one is
// generated), but a full archive record being imported must already have one
// per the archive/export contract, so artifact_import passes requireId: true.
export function validatePalette(fields: Partial<Palette>, opts?: { requireId?: boolean }): string | null {
  if (opts?.requireId && (typeof fields.id !== 'string' || fields.id.trim() === '')) {
    return 'A non-empty id is required.';
  }

  if (!fields.name || fields.name.trim() === '') return 'Name is required.';
  if (fields.name.length > 80) return 'Name must be at most 80 characters.';

  if (!fields.artist || fields.artist.trim() === '') return 'Artist is required.';
  if (fields.artist.length > 80) return 'Artist must be at most 80 characters.';

  if (!fields.period || !PERIODS.includes(fields.period as Period)) {
    return 'Period is required — choose one from the list.';
  }

  if (!Array.isArray(fields.swatches) || fields.swatches.length < 3 || fields.swatches.length > 12) {
    return 'Swatches must number between 3 and 12.';
  }
  if (fields.swatches.some((h) => typeof h !== 'string' || !HEX_REGEX.test(h))) {
    return 'Every swatch must be a six-digit hex value with a leading # (e.g. #a1b2c3).';
  }

  if (fields.favorite !== undefined && typeof fields.favorite !== 'boolean') {
    return 'Favorite must be a boolean.';
  }
  if (fields.archived !== undefined && typeof fields.archived !== 'boolean') {
    return 'Archived must be a boolean.';
  }

  if (fields.tags !== undefined) {
    if (!Array.isArray(fields.tags) || fields.tags.length > 6) {
      return 'Tags must be an array of at most 6 tags.';
    }
    const seen = new Set<string>();
    for (const tag of fields.tags) {
      if (typeof tag !== 'string' || tag !== tag.trim() || tag !== tag.toLowerCase() || tag.length < 1 || tag.length > 24) {
        return 'Each tag must be lowercase, trimmed, and 1 to 24 characters.';
      }
      if (seen.has(tag)) return 'Duplicate tags are not allowed.';
      seen.add(tag);
    }
  }

  if (fields.notes !== undefined) {
    if (typeof fields.notes !== 'string' || fields.notes.length > 2000) {
      return 'Notes must be at most 2000 characters.';
    }
  }

  return null;
}
