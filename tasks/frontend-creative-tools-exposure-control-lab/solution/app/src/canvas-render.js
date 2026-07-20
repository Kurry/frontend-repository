import { shutterStops, computeToneAdjustments, computeTextureClarityAdjustments } from './domain.js'

const CANVAS_WIDTH = 1600
const CANVAS_HEIGHT = 1000

const BASE_BRIGHTNESS = 120
const BRIGHTNESS_MULT = 1.2
const MAX_BLUR = 20
const NOISE_MULTIPLIER = 0.1
const MAX_NOISE = 0.5

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Pure render function: reproduces the full LabPreview visual pipeline
 * (background depth plate + motion frame through brightness/contrast/blur,
 * Mono grayscale, ISO-noise + grain multiply tiles, and the vignette) onto
 * an off-screen canvas, returning a PNG data URL.
 */
export async function renderEditedPNG(state) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')

  const currentEV = 2 * Math.log2(16 / state.aperture) +
                    Math.log2(60 / state.shutter) +
                    Math.log2(state.iso / 100)
  const { brightnessDelta, contrastDelta: toneContrastDelta } = computeToneAdjustments(state.light)
  const { contrastDelta: textureContrastDelta, saturateMult } = computeTextureClarityAdjustments(state.effects)
  const brightness = BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULT, currentEV) + (state.light.exposure * 0.5) + brightnessDelta
  const blurAmount = Math.max(0.2, MAX_BLUR / Math.pow(state.aperture, 1.1))
  const contrastCSS = 100 + state.light.contrast + toneContrastDelta + textureContrastDelta
  const mono = state.look === 'Mono'

  const idx = shutterStops.indexOf(state.shutter)
  const frameIndex = idx >= 0 ? idx : 5

  const [bgImg, motionImg] = await Promise.all([
    loadImage('/assets/background.jpg'),
    loadImage(`/assets/motion-${(frameIndex + 1).toString().padStart(2, '0')}.jpg`)
  ])

  // LabPreview.vue applies blur to the background depth-plate and motion-frame
  // layers individually (`.depth-plate` / `.motion-stack`, each with their own
  // `filter: blur(...)`), THEN applies the brightness/contrast/saturate(/grayscale)
  // tone filter to the whole composited `.preview-container` on top of that.
  // A single combined filter string applied once (blur baked in with the tone
  // filters) draws in the wrong order and can visually diverge from the
  // on-screen preview. Reproduce it as two passes: blur-only onto an
  // intermediate canvas, then tone filters over the composited result.
  const stackCanvas = document.createElement('canvas')
  stackCanvas.width = canvas.width
  stackCanvas.height = canvas.height
  const stackCtx = stackCanvas.getContext('2d')
  stackCtx.filter = `blur(${blurAmount}px)`
  stackCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
  stackCtx.drawImage(motionImg, 0, 0, canvas.width, canvas.height)
  stackCtx.filter = 'none'

  let toneFilterChain = `brightness(${brightness}%) contrast(${contrastCSS}%) saturate(${saturateMult})`
  if (mono) toneFilterChain += ' grayscale(1)'

  ctx.filter = toneFilterChain
  ctx.drawImage(stackCanvas, 0, 0)
  ctx.filter = 'none'

  // ISO noise: multiply-blended tile, same opacity formula as the preview.
  const noiseOpacity = Math.min(MAX_NOISE, Math.max(0, Math.log2(state.iso / 100) * NOISE_MULTIPLIER))
  if (noiseOpacity > 0) {
    const noiseImg = await loadImage('/assets/iso-noise.jpg')
    drawMultiplyTile(ctx, noiseImg, canvas.width, canvas.height, 200, noiseOpacity)
  }

  // Grain: multiply-blended tile, same opacity formula as the preview.
  const grainOpacity = Math.min(0.6, (state.effects.grain / 100) * 0.6)
  if (grainOpacity > 0) {
    const grainImg = await loadImage('/assets/iso-noise.jpg')
    drawMultiplyTile(ctx, grainImg, canvas.width, canvas.height, 120, grainOpacity)
  }

  // Vignette: same radial-gradient ellipse (55% -> 100%) as the preview.
  const vignetteOpacity = Math.min(1, Math.max(0, state.effects.vignette / 100))
  if (vignetteOpacity > 0) {
    ctx.save()
    ctx.globalAlpha = vignetteOpacity
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    ctx.translate(cx, cy)
    ctx.scale(cx, cy)
    const gradient = ctx.createRadialGradient(0, 0, 0.55, 0, 0, 1)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = gradient
    ctx.fillRect(-1, -1, 2, 2)
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

function drawMultiplyTile(ctx, img, width, height, tileSize, opacity) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'multiply'
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      ctx.drawImage(img, x, y, tileSize, tileSize)
    }
  }
  ctx.restore()
}

export async function exportEditedPNG(state) {
  const dataURL = await renderEditedPNG(state)
  const a = document.createElement('a')
  a.href = dataURL
  a.download = 'exposure-lab-edit.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
