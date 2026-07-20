import { shutterStops } from './domain.js'

export async function exportEditedPNG(state) {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 1000
  const ctx = canvas.getContext('2d')

  const BASE_BRIGHTNESS = 120
  const BRIGHTNESS_MULT = 1.2
  const MAX_BLUR = 20

  const currentEV = state.ev
  const brightness = BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULT, state.ev) + (state.light.exposure * 0.5)
  const blurAmount = Math.max(0.2, MAX_BLUR / Math.pow(state.aperture, 1.1))

  const idx = shutterStops.indexOf(state.shutter)
  const frameIndex = idx >= 0 ? idx : 5

  const img = new Image()
  img.src = `/assets/motion-${(frameIndex + 1).toString().padStart(2, '0')}.jpg`

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const contrastCSS = 100 + state.light.contrast

  ctx.filter = `brightness(${brightness}%) contrast(${contrastCSS}%) blur(${blurAmount}px)`
  ctx.drawImage(img, 0, 0, 1600, 1000)

  ctx.filter = 'none'

  if (state.look === 'Mono') {
     ctx.globalCompositeOperation = 'color'
     ctx.fillStyle = 'black'
     ctx.fillRect(0, 0, 1600, 1000)
     ctx.globalCompositeOperation = 'source-over'
  }

  const dataURL = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataURL
  a.download = 'exposure-lab-edit.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
