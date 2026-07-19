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
  watermarkOpacity: number  // 0–100
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

function drawBrowserFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, barH: number) {
  ctx.fillStyle = '#e2e8f0'
  roundedRect(ctx, x, y, w, barH, 8)
  ctx.fill()

  const dots = ['#ef4444', '#f59e0b', '#22c55e']
  dots.forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(x + 16 + i * 22, y + barH / 2, 6, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })

  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, x + 80, y + 6, w - 100, barH - 12, 6)
  ctx.fill()

  ctx.fillStyle = '#94a3b8'
  ctx.font = `${Math.max(10, barH * 0.38)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('screenshot.png', x + 92, y + barH / 2)
}

function drawPhoneFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const bevel = Math.max(10, w * 0.04)
  const r = Math.min(40, w * 0.07)
  ctx.fillStyle = '#1e293b'
  roundedRect(ctx, x - bevel, y - bevel * 2, w + bevel * 2, h + bevel * 4, r + bevel)
  ctx.fill()

  const notchW = w * 0.35
  const notchH = bevel * 1.2
  ctx.fillStyle = '#1e293b'
  roundedRect(ctx, x + (w - notchW) / 2, y - bevel * 0.5, notchW, notchH, notchH / 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x + w / 2, y + h + bevel * 2, bevel * 0.7, 0, Math.PI * 2)
  ctx.fillStyle = '#334155'
  ctx.fill()
}

export async function renderToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions, scale = 1): Promise<void> {
  return new Promise(resolve => {
    const doRender = (img: HTMLImageElement | null) => {
      const [baseW, baseH] = resolveCanvasDims(opts, img)
      const cw = baseW * scale
      const ch = baseH * scale

      canvas.width = cw
      canvas.height = ch

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

      if (!img) { resolve(); return }

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
      const BROWSER_BAR = opts.frameStyle === 'browser' ? Math.max(28 * scale, imgAreaH * 0.05) : 0
      const PHONE_BEVEL = opts.frameStyle === 'phone' ? Math.max(12 * scale, imgAreaW * 0.04) : 0
      const frameH = BROWSER_BAR + PHONE_BEVEL * 4
      const frameW = PHONE_BEVEL * 2

      // Fit image
      const aspect = img.naturalWidth / img.naturalHeight
      const maxW = (imgAreaW - frameW) * (opts.zoom / 100)
      const maxH = (imgAreaH - frameH) * (opts.zoom / 100)

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
        drawBrowserFrame(ctx, imgX, imgY - BROWSER_BAR, drawW, BROWSER_BAR)
      } else if (opts.frameStyle === 'phone') {
        drawPhoneFrame(ctx, imgX, imgY, drawW, drawH)
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
        const wfs = 13 * scale
        ctx.font = `${wfs}px ui-sans-serif, system-ui, sans-serif`
        const alpha = opts.watermarkOpacity / 100
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        const wm = opts.watermarkText
        const margin = 12 * scale
        const ww = ctx.measureText(wm).width

        let wx = 0, wy = 0
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        if (opts.watermarkCorner === 'tl') { wx = margin; wy = margin }
        else if (opts.watermarkCorner === 'tr') { wx = cw - margin - ww; wy = margin }
        else if (opts.watermarkCorner === 'bl') { wx = margin; wy = ch - margin - wfs; }
        else { wx = cw - margin - ww; wy = ch - margin - wfs; }
        ctx.fillText(wm, wx, wy)
      }

      resolve()
    }

    if (!opts.imageDataUrl) { doRender(null); return }
    const img = new Image()
    img.onload = () => doRender(img)
    img.onerror = () => doRender(null)
    img.src = opts.imageDataUrl
  })
}
