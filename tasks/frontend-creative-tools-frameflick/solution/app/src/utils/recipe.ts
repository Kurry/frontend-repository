// The RenderSettings field contract: the portable style recipe shape shared by
// the Export preview, Download/Copy style JSON, and Import style JSON — the
// would-be render-settings request body a composition API would accept.

import { BACKGROUND_PRESETS } from '../stores/canvas'
import type { RenderSettings, FrameStyle, CanvasSize, WatermarkCorner, ExportScale } from '../stores/canvas'

export interface Recipe {
  backgroundPreset: string | null
  customBackground: string | null
  padding: number
  cornerRadius: number
  shadow: number
  frame: 'None' | 'Browser' | 'Phone'
  canvasSize: CanvasSize
  captionText: string
  captionPosition: 'Above' | 'Below'
  captionSize: number
  captionColor: string
  watermarkEnabled: boolean
  watermarkText: string
  watermarkColor: string
  watermarkOpacity: number
  watermarkCorner: 'TL' | 'TR' | 'BL' | 'BR'
  zoom: number
  positionX: number
  positionY: number
  exportScale: ExportScale
}

export const RECIPE_KEYS: (keyof Recipe)[] = [
  'backgroundPreset', 'customBackground', 'padding', 'cornerRadius', 'shadow',
  'frame', 'canvasSize', 'captionText', 'captionPosition', 'captionSize',
  'captionColor', 'watermarkEnabled', 'watermarkText', 'watermarkColor',
  'watermarkOpacity', 'watermarkCorner', 'zoom', 'positionX', 'positionY',
  'exportScale',
]

const PRESET_LABELS = BACKGROUND_PRESETS.map(p => p.label)
const FRAME_TO_API: Record<FrameStyle, Recipe['frame']> = { none: 'None', browser: 'Browser', phone: 'Phone' }
const FRAME_FROM_API: Record<string, FrameStyle> = { None: 'none', Browser: 'browser', Phone: 'phone' }
const CORNER_TO_API: Record<WatermarkCorner, Recipe['watermarkCorner']> = { tl: 'TL', tr: 'TR', bl: 'BL', br: 'BR' }
const CORNER_FROM_API: Record<string, WatermarkCorner> = { TL: 'tl', TR: 'tr', BL: 'bl', BR: 'br' }
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export const INVALID_COLOR_MSG = 'Invalid color. Enter six hexadecimal digits after #.'

/** Compile the live canvas settings into the recipe payload (every key present). */
export function toRecipe(s: RenderSettings): Recipe {
  const presetLabel = BACKGROUND_PRESETS.find(p => p.id === s.backgroundPreset)?.label ?? 'Sunset'
  return {
    backgroundPreset: s.useCustomBg ? null : presetLabel,
    customBackground: s.useCustomBg ? s.customBgColor : null,
    padding: Math.round(s.padding),
    cornerRadius: Math.round(s.cornerRadius),
    shadow: Math.round(s.shadow),
    frame: FRAME_TO_API[s.frameStyle] ?? 'None',
    canvasSize: s.canvasSize,
    captionText: s.captionText,
    captionPosition: s.captionPosition === 'above' ? 'Above' : 'Below',
    captionSize: Math.round(s.captionFontSize),
    captionColor: s.captionColor,
    watermarkEnabled: s.watermarkEnabled,
    watermarkText: s.watermarkText,
    watermarkColor: s.watermarkColor,
    watermarkOpacity: Math.round(s.watermarkOpacity),
    watermarkCorner: CORNER_TO_API[s.watermarkCorner] ?? 'BR',
    zoom: Math.round(s.zoom),
    positionX: s.posX,
    positionY: s.posY,
    exportScale: s.exportScale,
  }
}

export function recipeJson(s: RenderSettings): string {
  return JSON.stringify(toRecipe(s), null, 2)
}

export type RecipeParseResult =
  | { ok: true; settings: RenderSettings }
  | { ok: false; error: string }

function intInRange(v: unknown, lo: number, hi: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
}

function finiteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/**
 * Parse + validate an imported RenderSettings payload. Malformed JSON yields
 * "Invalid style JSON"; contract violations name the offending field. On any
 * failure nothing is applied by the caller.
 */
export function parseRecipe(text: string, base: RenderSettings): RecipeParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid style JSON.' }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Invalid style JSON.' }
  }
  const r = data as Record<string, unknown>

  // Cross-field background rule: exactly one of the two is set.
  const bp = r.backgroundPreset
  const cb = r.customBackground
  if ('backgroundPreset' in r || 'customBackground' in r) {
    const bpValid = bp === null || (typeof bp === 'string' && PRESET_LABELS.includes(bp))
    const cbValid = cb === null || (typeof cb === 'string' && HEX_RE.test(cb))
    if (!bpValid && bp !== undefined) {
      return { ok: false, error: `backgroundPreset must be one of ${PRESET_LABELS.join(', ')}, or null.` }
    }
    if (!cbValid && cb !== undefined) {
      return { ok: false, error: `customBackground: ${INVALID_COLOR_MSG}` }
    }
    const exactlyOne = (bp !== null && bp !== undefined && (cb === null || cb === undefined))
      || (cb !== null && cb !== undefined && (bp === null || bp === undefined))
    if (!exactlyOne) {
      return { ok: false, error: 'Exactly one of backgroundPreset or customBackground must be set (the other stays null).' }
    }
  }

  if ('padding' in r && !intInRange(r.padding, 0, 25)) {
    return { ok: false, error: 'padding must be an integer between 0 and 25.' }
  }
  if ('cornerRadius' in r && !intInRange(r.cornerRadius, 0, 48)) {
    return { ok: false, error: 'cornerRadius must be an integer between 0 and 48.' }
  }
  if ('shadow' in r && !intInRange(r.shadow, 0, 10)) {
    return { ok: false, error: 'shadow must be an integer between 0 and 10.' }
  }
  if ('frame' in r && !(typeof r.frame === 'string' && r.frame in FRAME_FROM_API)) {
    return { ok: false, error: 'frame must be one of None, Browser, Phone.' }
  }
  if ('canvasSize' in r && !(r.canvasSize === 'square' || r.canvasSize === 'widescreen' || r.canvasSize === 'story' || r.canvasSize === 'original')) {
    return { ok: false, error: 'canvasSize must be one of square, widescreen, story, original.' }
  }
  if ('captionText' in r && typeof r.captionText !== 'string') {
    return { ok: false, error: 'captionText must be a string.' }
  }
  if ('captionPosition' in r && !(r.captionPosition === 'Above' || r.captionPosition === 'Below')) {
    return { ok: false, error: 'captionPosition must be one of Above, Below.' }
  }
  if ('captionSize' in r && !intInRange(r.captionSize, 12, 64)) {
    return { ok: false, error: 'captionSize must be an integer between 12 and 64.' }
  }
  if ('captionColor' in r && !(typeof r.captionColor === 'string' && HEX_RE.test(r.captionColor))) {
    return { ok: false, error: `captionColor: ${INVALID_COLOR_MSG}` }
  }
  if ('watermarkEnabled' in r && typeof r.watermarkEnabled !== 'boolean') {
    return { ok: false, error: 'watermarkEnabled must be a boolean.' }
  }
  if ('watermarkText' in r && typeof r.watermarkText !== 'string') {
    return { ok: false, error: 'watermarkText must be a string.' }
  }
  if ('watermarkColor' in r && !(typeof r.watermarkColor === 'string' && HEX_RE.test(r.watermarkColor))) {
    return { ok: false, error: `watermarkColor: ${INVALID_COLOR_MSG}` }
  }
  if ('watermarkOpacity' in r && !intInRange(r.watermarkOpacity, 5, 100)) {
    return { ok: false, error: 'watermarkOpacity must be an integer between 5 and 100.' }
  }
  if ('watermarkCorner' in r && !(typeof r.watermarkCorner === 'string' && r.watermarkCorner in CORNER_FROM_API)) {
    return { ok: false, error: 'watermarkCorner must be one of TL, TR, BL, BR.' }
  }
  if ('zoom' in r && !intInRange(r.zoom, 20, 200)) {
    return { ok: false, error: 'zoom must be an integer between 20 and 200.' }
  }
  if ('positionX' in r && !finiteNum(r.positionX)) {
    return { ok: false, error: 'positionX must be a finite number.' }
  }
  if ('positionY' in r && !finiteNum(r.positionY)) {
    return { ok: false, error: 'positionY must be a finite number.' }
  }
  if ('exportScale' in r && !(r.exportScale === 1 || r.exportScale === 2 || r.exportScale === 3)) {
    return { ok: false, error: 'exportScale must be one of 1, 2, 3.' }
  }

  // Build the settings: start from the current canvas and overlay every
  // included field, so partial-but-valid recipes still apply cleanly.
  const s: RenderSettings = JSON.parse(JSON.stringify(base))
  if (bp !== null && bp !== undefined && typeof bp === 'string') {
    const preset = BACKGROUND_PRESETS.find(p => p.label === bp)
    if (preset) { s.backgroundPreset = preset.id; s.useCustomBg = false }
  } else if (cb !== null && cb !== undefined && typeof cb === 'string') {
    s.customBgColor = cb
    s.useCustomBg = true
  }
  if ('padding' in r) s.padding = r.padding as number
  if ('cornerRadius' in r) s.cornerRadius = r.cornerRadius as number
  if ('shadow' in r) s.shadow = r.shadow as number
  if ('frame' in r) s.frameStyle = FRAME_FROM_API[r.frame as string]
  if ('canvasSize' in r) s.canvasSize = r.canvasSize as CanvasSize
  if ('captionText' in r) s.captionText = r.captionText as string
  if ('captionPosition' in r) s.captionPosition = (r.captionPosition as string) === 'Above' ? 'above' : 'below'
  if ('captionSize' in r) s.captionFontSize = r.captionSize as number
  if ('captionColor' in r) s.captionColor = r.captionColor as string
  if ('watermarkEnabled' in r) s.watermarkEnabled = r.watermarkEnabled as boolean
  if ('watermarkText' in r) s.watermarkText = r.watermarkText as string
  if ('watermarkColor' in r) s.watermarkColor = r.watermarkColor as string
  if ('watermarkOpacity' in r) s.watermarkOpacity = r.watermarkOpacity as number
  if ('watermarkCorner' in r) s.watermarkCorner = CORNER_FROM_API[r.watermarkCorner as string]
  if ('zoom' in r) s.zoom = r.zoom as number
  if ('positionX' in r) s.posX = r.positionX as number
  if ('positionY' in r) s.posY = r.positionY as number
  if ('exportScale' in r) s.exportScale = r.exportScale as ExportScale

  return { ok: true, settings: s }
}

/** Inline validation for the preset name field. Returns null when valid. */
export function validatePresetName(raw: string, existingNames: string[]): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Give the preset a name in the name field.'
  // The 40-char cap applies to the trimmed name (which is what gets persisted),
  // so leading/trailing whitespace can't block an otherwise-valid name.
  if (trimmed.length > 40) return 'Preset name must be 40 characters or fewer.'
  if (existingNames.includes(trimmed)) return `Preset "${trimmed}" already exists.`
  return null
}
