// WebMCP surface for the FrameFlick oracle.
//
// Every tool drives the SAME Pinia store mutations / domain commands the real
// UI controls invoke — the exact assignments a slider's @input handler makes,
// the same addPreset / applySettings / deletePreset the Save/Apply/Delete
// controls call, the same applySettings a Recent thumbnail click performs. No
// tool fabricates a success state the visible UI cannot reach. Exposed on
// window as webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import { useCanvasStore, BACKGROUND_PRESETS } from '../stores/canvas'
import type { CanvasSize, FrameStyle, WatermarkCorner } from '../stores/canvas'
import { usePresetsStore } from '../stores/presets'
import { useRecentStore } from '../stores/recent'

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['structured-editor-v1', 'entity-collection-v1']

type CanvasStore = ReturnType<typeof useCanvasStore>
type PresetsStore = ReturnType<typeof usePresetsStore>
type RecentStore = ReturnType<typeof useRecentStore>

let canvas!: CanvasStore
let presets!: PresetsStore
let recent!: RecentStore

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
  }
}

// ---- entity-collection-v1 (saved presets + recent uploads) -----------------

function entityCreate(args: Record<string, unknown>) {
  const name = String(args.name ?? '').trim()
  if (!name) return { ok: false, error: 'name is required' }
  const result = presets.addPreset(name, canvas.getSettings() as Record<string, unknown>)
  if (!result.ok) return { ok: false, error: result.error }
  const created = presets.presets.find(p => p.name === name)
  return { ok: true, id: created?.id, name, count: presets.presets.length }
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
    const active = recent.items.find(i => i.dataUrl === canvas.imageDataUrl)
    if (active) recent.updateSettings(active.id, canvas.getSettings() as Record<string, unknown>)
    canvas.imageDataUrl = item.dataUrl
    canvas.imageName = item.name
    canvas.applySettings(item.settings as Parameters<typeof canvas.applySettings>[0])
    return { ok: true, kind, name: item.name }
  }
  const preset = findPreset(args)
  if (!preset) return { ok: false, error: 'preset not found' }
  canvas.applySettings(preset.settings as Parameters<typeof canvas.applySettings>[0])
  return { ok: true, kind: 'preset', id: preset.id, name: preset.name }
}

function entityDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' }
  const preset = findPreset(args)
  if (!preset) return { ok: false, error: 'preset not found' }
  presets.deletePreset(preset.id)
  return { ok: true, id: preset.id, name: preset.name, count: presets.presets.length }
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: 'editor-update_property',
    description:
      'Set one canvas property via the same store mutation its control makes. args.property is one of background, custom-background, padding, corner-radius, shadow, frame-style, caption-text, caption-position, caption-size, caption-color, watermark, watermark-text, watermark-opacity, watermark-corner, zoom; args.value is the new value.',
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
    description: 'Read the current composed canvas dimensions and active settings without mutating them.',
    handler: editorPreview,
  },
  {
    name: 'entity-create',
    description: 'Save the current canvas settings as a named preset. args.name is the preset name.',
    handler: entityCreate,
  },
  {
    name: 'entity-select',
    description:
      'Apply a saved preset (args.kind="preset" with args.name or args.id) or reload a recent upload with its last-used settings (args.kind="recent" with args.name).',
    handler: entitySelect,
  },
  {
    name: 'entity-delete',
    description: 'Delete a saved preset by args.name or args.id. Requires args.confirm=true.',
    handler: entityDelete,
  },
]

export function initWebMcp() {
  canvas = useCanvasStore()
  presets = usePresetsStore()
  recent = useRecentStore()

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
      return tool.handler(args || {})
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  }
}
