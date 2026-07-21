// Built-in demo screenshots so a first-time user (or any reviewer) can take
// the full dressing workflow for a spin without supplying a file. Each call
// produces a distinct compact PNG data URL, letting the Recent strip fill up.

interface SampleVariant {
  name: string
  sky: [string, string]
  accent: string
  bars: string[]
}

const VARIANTS: SampleVariant[] = [
  {
    name: 'sample-dashboard.png',
    sky: ['#eef2ff', '#dbeafe'],
    accent: '#6366f1',
    bars: ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'],
  },
  {
    name: 'sample-analytics.png',
    sky: ['#ecfdf5', '#d1fae5'],
    accent: '#10b981',
    bars: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'],
  },
  {
    name: 'sample-profile.png',
    sky: ['#fff7ed', '#ffedd5'],
    accent: '#f97316',
    bars: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
  },
  {
    name: 'sample-settings.png',
    sky: ['#fdf4ff', '#fae8ff'],
    accent: '#a855f7',
    bars: ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea'],
  },
  {
    name: 'sample-billing.png',
    sky: ['#fef2f2', '#fee2e2'],
    accent: '#ef4444',
    bars: ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626'],
  },
  {
    name: 'sample-mobile.png',
    sky: ['#f0f9ff', '#e0f2fe'],
    accent: '#0ea5e9',
    bars: ['#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
  },
]

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Paint a plausible product-screenshot mock and return a compact PNG data URL. */
export function makeSampleImage(index: number): { dataUrl: string; name: string } {
  const variant = VARIANTS[index % VARIANTS.length]
  const w = 960
  const h = 640
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Window background
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, variant.sky[0])
  sky.addColorStop(1, variant.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Sidebar
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 200, h)
  ctx.fillStyle = variant.accent
  rounded(ctx, 24, 28, 152, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#e2e8f0'
  for (let i = 0; i < 6; i++) {
    rounded(ctx, 24, 96 + i * 44, 152, 20, 6)
    ctx.fill()
  }

  // Header
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(200, 0, w - 200, 72)
  ctx.fillStyle = '#f1f5f9'
  rounded(ctx, 224, 20, 320, 32, 16)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w - 48, 36, 16, 0, Math.PI * 2)
  ctx.fillStyle = variant.accent
  ctx.fill()

  // Stat cards
  for (let i = 0; i < 3; i++) {
    const x = 224 + i * 240
    ctx.fillStyle = '#ffffff'
    rounded(ctx, x, 96, 216, 104, 12)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    rounded(ctx, x + 20, 116, 100, 14, 7)
    ctx.fill()
    ctx.fillStyle = variant.bars[i + 1]
    rounded(ctx, x + 20, 148, 140, 28, 8)
    ctx.fill()
  }

  // Bar chart card
  ctx.fillStyle = '#ffffff'
  rounded(ctx, 224, 224, 456, 280, 12)
  ctx.fill()
  const baseY = 464
  variant.bars.forEach((color, i) => {
    const bh = 60 + ((i * 53 + index * 31) % 130)
    ctx.fillStyle = color
    rounded(ctx, 260 + i * 80, baseY - bh, 48, bh, 8)
    ctx.fill()
  })

  // Side list card
  ctx.fillStyle = '#ffffff'
  rounded(ctx, 704, 224, 232, 280, 12)
  ctx.fill()
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(736, 268 + i * 48, 14, 0, Math.PI * 2)
    ctx.fillStyle = variant.bars[i]
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    rounded(ctx, 762, 258 + i * 48, 140, 18, 9)
    ctx.fill()
  }

  // Subtle signature stripe so successive samples never byte-match
  ctx.fillStyle = variant.accent
  ctx.globalAlpha = 0.85
  rounded(ctx, 224, 528, 120 + (index % 5) * 40, 24, 12)
  ctx.fill()
  ctx.globalAlpha = 1

  return { dataUrl: canvas.toDataURL('image/png'), name: variant.name }
}
