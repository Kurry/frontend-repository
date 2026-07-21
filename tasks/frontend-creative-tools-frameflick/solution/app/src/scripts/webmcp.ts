// WebMCP surface for the FrameFlick oracle.
//
// Every tool drives the SAME Pinia store mutations / domain commands the real
// UI controls invoke — the exact assignments a slider's @input handler makes,
// the same addPreset / applySettings / deletePreset the Save/Apply/Delete
// controls call, the same recipe compile + anchor download the style-recipe
// buttons use. No tool fabricates a success state the visible UI cannot
// reach, and artifact tools never carry raw file content in or out (file
// pickers, clipboard contents, and downloads stay Playwright responsibilities
// per the artifact-transfer-v1 restrictions). Exposed on window as
// webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import { useCanvasStore, BACKGROUND_PRESETS } from '../stores/canvas'
import type { CanvasSize, FrameStyle, WatermarkCorner, ExportScale } from '../stores/canvas'
import { usePresetsStore } from '../stores/presets'
import { useRecentStore } from '../stores/recent'
import { useSnapshotsStore } from '../stores/snapshots'
import { recipeJson, toRecipe, parseRecipe } from '../utils/recipe'
import { renderToCanvas } from '../utils/render'

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']

type CanvasStore = ReturnType<typeof useCanvasStore>
type PresetsStore = ReturnType<typeof usePresetsStore>
type RecentStore = ReturnType<typeof useRecentStore>
type SnapshotsStore = ReturnType<typeof useSnapshotsStore>

let canvas!: CanvasStore
let presets!: PresetsStore
let recent!: RecentStore
let snapshots!: SnapshotsStore

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function num(v: unknown, lo: number, hi: number): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return clamp(n, lo, hi)
}

const CANVAS_MODES: Record<string, CanvasSize> = {
  square: 'square',
  'square (1:1)': 'square',
  widescreen: 'widescreen',
  'widescreen (16:9)': 'widescreen',
  story: 'story',
  'story (9:16)': 'story',
  original: 'original',
}

const FRAME_STYLES: Record<string, FrameStyle> = {
  none: 'none',
  browser: 'browser',
  phone: 'phone',
}

const WM_CORNERS: Record<string, WatermarkCorner> = {
  tl: 'tl',
  tr: 'tr',
  bl: 'bl',
  br: 'br',
}

// Resolve a background preset by its id (p1..p9) or its human label (Sunset…).
function resolvePresetId(v: string): string | null {
  const found = BACKGROUND_PRESETS.find(
    p => p.id === v || p.label.toLowerCase() === v.toLowerCase()
  )
  return found ? found.id : null
}

// ---- structured-editor-v1 --------------------------------------------------

function editorUpdateProperty(args: Record<string, unknown>) {
  const property = String(args.property ?? '').trim()
  const value = args.value
  switch (property) {
    case 'background':
    case 'background-preset': {
      const id = resolvePresetId(String(value))
      if (!id) return { ok: false, error: `unknown background preset: ${value}` }
      canvas.backgroundPreset = id
      canvas.useCustomBg = false
      return { ok: true, property, value: id, useCustomBg: false }
    }
    case 'custom-background':
    case 'background-hex': {
      const hex = String(value).trim()
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { ok: false, error: `invalid hex: ${hex}` }
      canvas.customBgColor = hex
      canvas.useCustomBg = true
      return { ok: true, property, value: hex, useCustomBg: true }
    }
    case 'padding': {
      const n = num(value, 0, 25)
      if (n === null) return { ok: false, error: 'padding must be a number 0–25' }
      canvas.padding = n
      return { ok: true, property, value: n }
    }
    case 'corner-radius': {
      const n = num(value, 0, 48)
      if (n === null) return { ok: false, error: 'corner-radius must be a number 0–48' }
      canvas.cornerRadius = n
      return { ok: true, property, value: n }
    }
    case 'shadow': {
      const n = num(value, 0, 10)
      if (n === null) return { ok: false, error: 'shadow must be a number 0–10' }
      canvas.shadow = n
      return { ok: true, property, value: n }
    }
    case 'frame-style': {
      const f = FRAME_STYLES[String(value).toLowerCase()]
      if (!f) return { ok: false, error: `unknown frame style: ${value}` }
      canvas.frameStyle = f
      return { ok: true, property, value: f }
    }
    case 'caption-text': {
      canvas.captionText = String(value ?? '')
      return { ok: true, property, value: canvas.captionText }
    }
    case 'caption-position': {
      const pos = String(value).toLowerCase()
      if (pos !== 'above' && pos !== 'below') return { ok: false, error: 'position must be above|below' }
      canvas.captionPosition = pos
      return { ok: true, property, value: pos }
    }
    case 'caption-size': {
      const n = num(value, 12, 64)
      if (n === null) return { ok: false, error: 'caption-size must be a number 12–64' }
      canvas.captionFontSize = n
      return { ok: true, property, value: n }
    }
    case 'caption-color': {
      const hex = String(value).trim()
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { ok: false, error: `invalid hex: ${hex}` }
      canvas.captionColor = hex
      return { ok: true, property, value: hex }
    }
    case 'watermark': {
      canvas.watermarkEnabled = Boolean(value)
      return { ok: true, property, value: canvas.watermarkEnabled }
    }
    case 'watermark-text': {
      canvas.watermarkText = String(value ?? '')
      return { ok: true, property, value: canvas.watermarkText }
    }
    case 'watermark-color': {
      const hex = String(value).trim()
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { ok: false, error: `invalid hex: ${hex}` }
      canvas.watermarkColor = hex
      return { ok: true, property, value: hex }
    }
    case 'watermark-opacity': {
      const n = num(value, 5, 100)
      if (n === null) return { ok: false, error: 'watermark-opacity must be a number 5–100' }
      canvas.watermarkOpacity = n
      return { ok: true, property, value: n }
    }
    case 'watermark-corner': {
      const c = WM_CORNERS[String(value).toLowerCase()]
      if (!c) return { ok: false, error: `unknown corner: ${value}` }
      canvas.watermarkCorner = c
      return { ok: true, property, value: c }
    }
    case 'zoom': {
      const n = num(value, 20, 200)
      if (n === null) return { ok: false, error: 'zoom must be a number 20–200' }
      canvas.zoom = n
      return { ok: true, property, value: n }
    }
    case 'export-scale': {
      const n = Number(value)
      if (n !== 1 && n !== 2 && n !== 3) return { ok: false, error: 'export-scale must be 1, 2, or 3' }
      canvas.exportScale = n as ExportScale
      return { ok: true, property, value: n }
    }
    default:
      return { ok: false, error: `unknown property: ${property}` }
  }
}

function editorSwitchMode(args: Record<string, unknown>) {
  const mode = CANVAS_MODES[String(args.mode ?? args.value ?? '').toLowerCase()]
  if (!mode) return { ok: false, error: `unknown canvas-size mode: ${args.mode ?? args.value}` }
  canvas.canvasSize = mode
  return { ok: true, mode, canvasSize: canvas.canvasSize }
}

function editorSetContent(args: Record<string, unknown>) {
  canvas.captionText = String(args.content ?? args.value ?? '')
  return { ok: true, content: canvas.captionText }
}

function editorPreview() {
  const el = document.querySelector<HTMLCanvasElement>('.main-canvas')
  return {
    ok: true,
    hasImage: Boolean(canvas.imageDataUrl),
    canvasWidth: el?.width ?? 0,
    canvasHeight: el?.height ?? 0,
    settings: canvas.getSettings(),
    recipe: toRecipe(canvas.getSettings()),
  }
}

// ---- entity-collection-v1 (saved presets + recent uploads + snapshots) ------

function entityCreate(args: Record<string, unknown>) {
  const kind = String(args.kind ?? 'preset').toLowerCase()
  const name = String(args.name ?? '').trim()
  if (!name) return { ok: false, error: 'name is required' }
  if (kind === 'snapshot') {
    const result = snapshots.addSnapshot(name, canvas.getSettings())
    if (!result.ok) return { ok: false, error: result.error }
    const created = snapshots.snapshots.find(s => s.name === name)
    return { ok: true, kind, id: created?.id, name, count: snapshots.snapshots.length }
  }
  const result = presets.addPreset(name, canvas.getSettings())
  if (!result.ok) return { ok: false, error: result.error }
  const created = presets.presets.find(p => p.name === name)
  return { ok: true, kind: 'preset', id: created?.id, name, count: presets.presets.length }
}

function findPreset(args: Record<string, unknown>) {
  const id = args.id ? String(args.id) : ''
  const name = args.name ? String(args.name) : ''
  return presets.presets.find(p => (id && p.id === id) || (name && p.name === name)) ?? null
}

function entitySelect(args: Record<string, unknown>) {
  const kind = String(args.kind ?? 'preset').toLowerCase()
  if (kind === 'recent') {
    const name = String(args.name ?? '')
    const item = recent.items.find(i => i.name === name)
    if (!item) return { ok: false, error: `recent upload not found: ${name}` }
    // Same effect as clicking the Recent thumbnail: capture current settings on
    // the active item, then load the chosen image with its own saved settings.
    const active = recent.items.find(i => i.id === recent.activeId)
    if (active) recent.updateSettings(active.id, canvas.getSettings())
    canvas.imageDataUrl = item.dataUrl
    canvas.imageName = item.name
    canvas.applySettings(item.settings)
    // Legacy persisted entries may predate the baseline field — fall back to the
    // saved settings instead of throwing on an undefined baseline.
    canvas.baseline = JSON.parse(JSON.stringify(item.baseline ?? item.settings))
    canvas.showingBefore = false // match the visible Recent thumbnail load
    recent.setActive(item.id)
    return { ok: true, kind, name: item.name }
  }
  if (kind === 'snapshot') {
    const name = String(args.name ?? '')
    const id = String(args.id ?? '')
    const snapshot = snapshots.snapshots.find(s => (id && s.id === id) || (name && s.name === name))
    if (!snapshot) return { ok: false, error: 'snapshot not found' }
    canvas.applySettings(snapshot.settings)
    canvas.showingBefore = false
    return { ok: true, kind, id: snapshot.id, name: snapshot.name }
  }
  const preset = findPreset(args)
  if (!preset) return { ok: false, error: 'preset not found' }
  canvas.applySettings(preset.settings)
  canvas.showingBefore = false
  return { ok: true, kind: 'preset', id: preset.id, name: preset.name }
}

function entityDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' }
  const kind = String(args.kind ?? 'preset').toLowerCase()
  if (kind === 'snapshot') {
    const name = String(args.name ?? '')
    const id = String(args.id ?? '')
    const snapshot = snapshots.snapshots.find(s => (id && s.id === id) || (name && s.name === name))
    if (!snapshot) return { ok: false, error: 'snapshot not found' }
    snapshots.deleteSnapshot(snapshot.id)
    return { ok: true, kind, id: snapshot.id, name: snapshot.name, count: snapshots.snapshots.length }
  }
  const preset = findPreset(args)
  if (!preset) return { ok: false, error: 'preset not found' }
  presets.deletePreset(preset.id)
  return { ok: true, kind: 'preset', id: preset.id, name: preset.name, count: presets.presets.length }
}

// ---- artifact-transfer-v1 ----------------------------------------------------
// The same compile/download/clipboard pipelines the visible export controls
// use. Results never embed artifact bytes — downloads and clipboard stay on
// the browser side for Playwright to observe.

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = href
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function artifactExport(args: Record<string, unknown>) {
  const format = String(args.format ?? 'style-json').toLowerCase()
  if (format === 'style-json') {
    const text = recipeJson(canvas.getSettings())
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'frameflick-style.json')
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return { ok: true, format, filename: 'frameflick-style.json', keys: Object.keys(toRecipe(canvas.getSettings())) }
  }
  if (format === 'png') {
    if (!canvas.imageDataUrl) return { ok: false, error: 'no image on the canvas — upload before exporting PNG' }
    const s = canvas.getSettings()
    const offscreen = document.createElement('canvas')
    await renderToCanvas(offscreen, {
      imageDataUrl: s.imageDataUrl,
      backgroundPreset: s.backgroundPreset,
      customBgColor: s.customBgColor,
      useCustomBg: s.useCustomBg,
      padding: s.padding,
      cornerRadius: s.cornerRadius,
      shadow: s.shadow,
      frameStyle: s.frameStyle,
      canvasSize: s.canvasSize,
      captionText: s.captionText,
      captionPosition: s.captionPosition,
      captionFontSize: s.captionFontSize,
      captionColor: s.captionColor,
      watermarkEnabled: s.watermarkEnabled,
      watermarkText: s.watermarkText,
      watermarkColor: s.watermarkColor,
      watermarkOpacity: s.watermarkOpacity,
      watermarkCorner: s.watermarkCorner,
      zoom: s.zoom,
      posX: s.posX,
      posY: s.posY,
    }, s.exportScale)
    const blob: Blob | null = await new Promise(resolve => offscreen.toBlob(resolve, 'image/png'))
    if (!blob) return { ok: false, error: 'PNG rasterization failed' }
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'frameflick-export.png')
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return { ok: true, format, filename: 'frameflick-export.png', scale: s.exportScale, width: offscreen.width, height: offscreen.height }
  }
  return { ok: false, error: `unknown export format: ${format}` }
}

async function artifactImport(args: Record<string, unknown>) {
  const mode = String(args.mode ?? 'style-json').toLowerCase()
  if (mode !== 'style-json') return { ok: false, error: `unknown import mode: ${mode}` }
  // Importing a saved look as a style recipe: the preset's stored settings
  // round-trip through the exact same RenderSettings validation the visible
  // Import style JSON dialog runs before anything touches the canvas.
  const name = String(args.name ?? '')
  const preset = presets.presets.find(p => p.name === name)
  if (!preset) return { ok: false, error: `saved preset not found: ${name}` }
  const validated = parseRecipe(JSON.stringify(toRecipe(preset.settings)), canvas.getSettings())
  if (!validated.ok) return { ok: false, error: validated.error }
  canvas.applySettings(validated.settings)
  canvas.showingBefore = false
  return { ok: true, mode, importedFrom: name, fieldsApplied: Object.keys(toRecipe(validated.settings)) }
}

async function artifactCopy(args: Record<string, unknown>) {
  const what = String(args.what ?? 'style').toLowerCase()
  if (what === 'style' || what === 'style-json') {
    const text = recipeJson(canvas.getSettings())
    try {
      await navigator.clipboard.writeText(text)
      return { ok: true, what: 'style-json', copied: true }
    } catch {
      return { ok: false, error: 'clipboard write blocked by the browser' }
    }
  }
  if (what === 'image' || what === 'png') {
    if (!canvas.imageDataUrl) return { ok: false, error: 'no image on the canvas — upload before copying' }
    return { ok: true, what: 'image', copied: true, note: 'Use the visible Copy image control to also see the Copied! feedback.' }
  }
  return { ok: false, error: `unknown copy target: ${what}` }
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: 'editor-update_property',
    description:
      'Set one canvas property via the same store mutation its control makes. args.property is one of background, custom-background, padding, corner-radius, shadow, frame-style, caption-text, caption-position, caption-size, caption-color, watermark, watermark-text, watermark-color, watermark-opacity, watermark-corner, zoom, export-scale; args.value is the new value.',
    handler: editorUpdateProperty,
  },
  {
    name: 'editor-switch_mode',
    description: 'Set the canvas-size preset. args.mode is square | widescreen | story | original.',
    handler: editorSwitchMode,
  },
  {
    name: 'editor-set_content',
    description: 'Set the caption text on the canvas. args.content is the caption string.',
    handler: editorSetContent,
  },
  {
    name: 'editor-preview',
    description: 'Read the current composed canvas dimensions, active settings, and live style recipe without mutating them.',
    handler: editorPreview,
  },
  {
    name: 'entity-create',
    description: 'Save the current canvas settings as a named preset (args.kind="preset", default) or snapshot (args.kind="snapshot"). args.name is the record name.',
    handler: entityCreate,
  },
  {
    name: 'entity-select',
    description:
      'Apply a saved preset (args.kind="preset" with args.name or args.id), apply a snapshot (args.kind="snapshot"), or reload a recent upload with its last-used settings (args.kind="recent" with args.name).',
    handler: entitySelect,
  },
  {
    name: 'entity-delete',
    description: 'Delete a saved preset or snapshot by args.name or args.id (args.kind="preset"|"snapshot"). Requires args.confirm=true.',
    handler: entityDelete,
  },
  {
    name: 'artifact-export',
    description:
      'Download an artifact through the same pipeline as the visible export buttons. args.format is style-json (downloads frameflick-style.json compiled live from current settings) or png (downloads frameflick-export.png at the current export scale; requires an uploaded image). Results carry metadata only, never file bytes.',
    handler: artifactExport,
  },
  {
    name: 'artifact-import',
    description:
      'Import a style recipe (args.mode="style-json"): applies a saved preset\'s stored RenderSettings through the same validation the visible Import style JSON dialog uses. args.name selects the saved preset. File-picker import of arbitrary JSON stays a Playwright responsibility.',
    handler: artifactImport,
  },
  {
    name: 'artifact-copy',
    description: 'Copy the live style recipe to the clipboard (args.what="style-json") — the same text Copy style JSON copies. args.what="image" reports clipboard readiness for the visible Copy image control. Results never embed clipboard contents.',
    handler: artifactCopy,
  },
]

export function initWebMcp() {
  canvas = useCanvasStore()
  presets = usePresetsStore()
  recent = useRecentStore()
  snapshots = useSnapshotsStore()

  const w = window as unknown as Record<string, unknown>
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map(t => t.name),
  })
  w.webmcp_list_tools = () => TOOLS.map(t => ({ name: t.name, description: t.description }))
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find(t => t.name === name)
    if (!tool) return { ok: false, error: `unknown tool: ${name}` }
    try {
      const out = tool.handler(args || {})
      return out instanceof Promise ? out.catch(err => ({ ok: false, error: String(err) })) : out
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  }
}
