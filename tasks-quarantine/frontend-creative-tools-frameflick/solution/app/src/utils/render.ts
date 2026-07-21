import { BACKGROUND_PRESETS } from '../stores/canvas'

export interface RenderOptions {
  imageDataUrl: string | null
  backgroundPreset: string
  customBgColor: string
  useCustomBg: boolean
  padding: number        // 0–25 percent
  cornerRadius: number   // px on the screenshot
  shadow: number         // 0–10
  frameStyle: 'none' | 'browser' | 'phone'
  canvasSize: 'square' | 'widescreen' | 'story' | 'original'
  captionText: string
  captionPosition: 'above' | 'below'
  captionFontSize: number
  captionColor: string
  watermarkEnabled: boolean
  watermarkText: string
  watermarkColor: string
  watermarkOpacity: number  // 5–100
  watermarkCorner: 'tl' | 'tr' | 'bl' | 'br'
  zoom: number              // percent
  posX: number              // px offset
  posY: number              // px offset
}

const CANVAS_DIMS: Record<string, [number, number]> = {
  square:     [800, 800],
  widescreen: [1280, 720],
  story:      [720, 1280],
  original:   [0, 0],
}

// Decoded-image cache: slider drags re-render every frame, so decoding the
// data URL once keeps canvas updates effectively synchronous (no dropped
// frames, no lag) while the drag is in flight.
const IMG_CACHE = new Map<string, HTMLImageElement>()
const IMG_CACHE_MAX = 12

function getCachedImage(dataUrl: string): HTMLImageElement | null {
  const hit = IMG_CACHE.get(dataUrl)
  if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null
  const img = new Image()
  img.src = dataUrl
  IMG_CACHE.set(dataUrl, img)
  if (IMG_CACHE.size > IMG_CACHE_MAX) {
    const first = IMG_CACHE.keys().next().value
    if (first) IMG_CACHE.delete(first)
  }
  return null
}

function resolveCanvasDims(opts: RenderOptions, img: HTMLImageElement | null): [number, number] {
  if (opts.canvasSize === 'original' && img) return [img.naturalWidth, img.naturalHeight]
  if (opts.canvasSize === 'original') return [800, 800]
  return CANVAS_DIMS[opts.canvasSize]
}

function parseCssGradient(gradient: string, ctx: CanvasRenderingContext2D, w: number, h: number): CanvasGradient | string {
  const m = gradient.match(/linear-gradient\(135deg,\s*(#[\w]+),\s*(#[\w]+)\)/)
  if (m) {
    const grd = ctx.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, m[1])
    grd.addColorStop(1, m[2])
    return grd
  }
  return gradient
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex.trim())
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 0) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawBrowserFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, barH: number, scale: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(15,23,42,0.18)'
  ctx.shadowBlur = 10 * scale
  ctx.shadowOffsetY = 3 * scale
  ctx.fillStyle = '#e2e8f0'
  roundedRect(ctx, x, y, w, barH, 8 * scale)
  ctx.fill()
  ctx.restore()

  const dotR = Math.max(3, 5 * scale)
  const dots = ['#ef4444', '#f59e0b', '#22c55e']
  dots.forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(x + 14 * scale + i * 20 * scale + dotR, y + barH / 2, dotR, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })

  const addrX = x + 14 * scale + 3 * 20 * scale + 16 * scale
  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, addrX, y + barH * 0.2, Math.max(40 * scale, w - (addrX - x) - 12 * scale), barH * 0.6, 6 * scale)
  ctx.fill()

  ctx.fillStyle = '#64748b'
  ctx.font = `${Math.max(9, Math.round(barH * 0.4))}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('screenshot.png', addrX + 10 * scale, y + barH / 2 + scale)
}

function drawPhoneFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, scale: number) {
  const bevel = Math.max(8 * scale, w * 0.03)
  const r = Math.min(36 * scale, w * 0.09)
  ctx.save()
  ctx.shadowColor = 'rgba(15,23,42,0.25)'
  ctx.shadowBlur = 12 * scale
  ctx.shadowOffsetY = 4 * scale
  ctx.fillStyle = '#0f172a'
  roundedRect(ctx, x - bevel, y - bevel * 1.6, w + bevel * 2, h + bevel * 3.2, r)
  ctx.fill()
  ctx.restore()

  // Speaker slot
  const slotW = w * 0.28
  ctx.fillStyle = '#334155'
  roundedRect(ctx, x + (w - slotW) / 2, y - bevel * 1.1, slotW, bevel * 0.45, bevel * 0.25)
  ctx.fill()

  // Home indicator
  const homeW = w * 0.32
  ctx.fillStyle = '#475569'
  roundedRect(ctx, x + (w - homeW) / 2, y + h + bevel * 0.7, homeW, bevel * 0.35, bevel * 0.2)
  ctx.fill()
}

export async function renderToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions, scale = 1): Promise<void> {
  const draw = (img: HTMLImageElement | null) => {
    const [baseW, baseH] = resolveCanvasDims(opts, img)
    const cw = Math.max(1, Math.round(baseW * scale))
    const ch = Math.max(1, Math.round(baseH * scale))

    if (canvas.width !== cw) canvas.width = cw
    if (canvas.height !== ch) canvas.height = ch

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, cw, ch)

    // Background
    const preset = BACKGROUND_PRESETS.find(p => p.id === opts.backgroundPreset)
    const bgValue = opts.useCustomBg ? opts.customBgColor : (preset?.value ?? '#FDE047')
    const fill = typeof bgValue === 'string' && bgValue.startsWith('linear-gradient')
      ? parseCssGradient(bgValue, ctx, cw, ch)
      : bgValue
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, cw, ch)

    if (!img) return

    // Caption height
    const hasCaption = opts.captionText.trim().length > 0
    const captionH = hasCaption ? opts.captionFontSize * scale * 1.8 : 0

    // Padding
    const padFrac = opts.padding / 100
    const padX = cw * padFrac
    const padY = ch * padFrac

    // Image area (subtract caption from one side)
    const imgAreaW = cw - padX * 2
    const imgAreaH = ch - padY * 2 - captionH

    // Frame overhead
    const BROWSER_BAR = opts.frameStyle === 'browser' ? Math.max(28 * scale, imgAreaH * 0.055) : 0
    const PHONE_BEVEL = opts.frameStyle === 'phone' ? Math.max(10 * scale, imgAreaW * 0.03) : 0
    const frameH = BROWSER_BAR + PHONE_BEVEL * 4.8
    const frameW = PHONE_BEVEL * 2

    // Fit image
    const aspect = img.naturalWidth / img.naturalHeight
    const maxW = Math.max(10, (imgAreaW - frameW) * (opts.zoom / 100))
    const maxH = Math.max(10, (imgAreaH - frameH) * (opts.zoom / 100))

    let drawW: number, drawH: number
    if (maxW / maxH > aspect) {
      drawH = maxH; drawW = drawH * aspect
    } else {
      drawW = maxW; drawH = drawW / aspect
    }

    // Center of the image zone
    const zoneTop = padY + (opts.captionPosition === 'above' ? captionH : 0)
    const zoneCenterX = cw / 2
    const zoneCenterY = zoneTop + imgAreaH / 2

    const imgX = zoneCenterX - drawW / 2 + opts.posX * scale
    const imgY = zoneCenterY - drawH / 2 + opts.posY * scale

    // Shadow pass
    if (opts.shadow > 0) {
      const blur = opts.shadow * 5 * scale
      const offset = opts.shadow * 2 * scale
      const alpha = Math.min(0.7, 0.12 + opts.shadow * 0.055)
      ctx.save()
      ctx.shadowColor = `rgba(0,0,0,${alpha})`
      ctx.shadowBlur = blur
      ctx.shadowOffsetX = offset
      ctx.shadowOffsetY = offset
      roundedRect(ctx, imgX, imgY, drawW, drawH, opts.cornerRadius * scale)
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.24, opts.shadow * 0.024)})`
      ctx.fill()
      ctx.restore()
    }

    // Frame chrome (behind screenshot)
    if (opts.frameStyle === 'browser') {
      drawBrowserFrame(ctx, imgX, imgY - BROWSER_BAR, drawW, BROWSER_BAR, scale)
    } else if (opts.frameStyle === 'phone') {
      drawPhoneFrame(ctx, imgX, imgY, drawW, drawH, scale)
    }

    // Screenshot with rounded corners
    ctx.save()
    roundedRect(ctx, imgX, imgY, drawW, drawH, opts.cornerRadius * scale)
    ctx.clip()
    ctx.drawImage(img, imgX, imgY, drawW, drawH)
    ctx.restore()

    // Caption
    if (hasCaption) {
      const fs = opts.captionFontSize * scale
      ctx.font = `bold ${fs}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = opts.captionColor
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const capY = opts.captionPosition === 'above'
        ? padY + captionH / 2
        : ch - padY - captionH / 2
      ctx.fillText(opts.captionText, cw / 2, capY)
    }

    // Watermark
    if (opts.watermarkEnabled && opts.watermarkText.trim()) {
      const wfs = 14 * scale
      ctx.font = `600 ${wfs}px ui-sans-serif, system-ui, sans-serif`
      const [r, g, b] = hexToRgb(opts.watermarkColor || '#ffffff')
      const alpha = Math.max(0.05, Math.min(1, opts.watermarkOpacity / 100))
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
      const wm = opts.watermarkText
      const margin = 14 * scale
      const ww = ctx.measureText(wm).width

      let wx = 0, wy = 0
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'
      if (opts.watermarkCorner === 'tl') { wx = margin; wy = margin }
      else if (opts.watermarkCorner === 'tr') { wx = cw - margin - ww; wy = margin }
      else if (opts.watermarkCorner === 'bl') { wx = margin; wy = ch - margin - wfs }
      else { wx = cw - margin - ww; wy = ch - margin - wfs }
      ctx.fillText(wm, wx, wy)
    }
  }

  if (!opts.imageDataUrl) { draw(null); return }

  // Fast path: already decoded → synchronous paint (keeps slider drags live).
  const cached = getCachedImage(opts.imageDataUrl)
  if (cached) { draw(cached); return }

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      IMG_CACHE.set(opts.imageDataUrl!, img)
      draw(img)
      resolve()
    }
    img.onerror = () => { draw(null); resolve() }
    img.src = opts.imageDataUrl
  })
}
