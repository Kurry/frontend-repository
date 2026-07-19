import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type FrameStyle = 'none' | 'browser' | 'phone'
export type CanvasSize = 'square' | 'widescreen' | 'story' | 'original'
export type WatermarkCorner = 'tl' | 'tr' | 'bl' | 'br'

export const BACKGROUND_PRESETS = [
  { id: 'p1', label: 'Sunset', value: 'linear-gradient(135deg,#f97316,#ec4899)' },
  { id: 'p2', label: 'Ocean', value: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { id: 'p3', label: 'Lime', value: 'linear-gradient(135deg,#84cc16,#06b6d4)' },
  { id: 'p4', label: 'Rose', value: 'linear-gradient(135deg,#f43f5e,#a855f7)' },
  { id: 'p5', label: 'Gold', value: 'linear-gradient(135deg,#fde047,#fb923c)' },
  { id: 'p6', label: 'Night', value: 'linear-gradient(135deg,#1e1b4b,#4f46e5)' },
  { id: 'p7', label: 'Mint', value: 'linear-gradient(135deg,#d1fae5,#6ee7b7)' },
  { id: 'p8', label: 'Slate', value: 'linear-gradient(135deg,#334155,#64748b)' },
  { id: 'p9', label: 'Peach', value: 'linear-gradient(135deg,#fde68a,#fca5a5)' },
]

function safeLS() {
  try { return window.localStorage } catch { return null }
}

function load<T>(key: string, fallback: T): T {
  try {
    const s = safeLS()?.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

function save(key: string, val: unknown) {
  try { safeLS()?.setItem(key, JSON.stringify(val)) } catch {}
}

export const useCanvasStore = defineStore('canvas', () => {
  const imageDataUrl = ref<string | null>(load('ff_imageDataUrl', null))
  const imageName = ref<string>(load('ff_imageName', ''))
  const backgroundPreset = ref<string>(load('ff_bgPreset', 'p1'))
  const customBgColor = ref<string>(load('ff_customBg', '#FDE047'))
  const useCustomBg = ref<boolean>(load('ff_useCustomBg', false))
  const padding = ref<number>(load('ff_padding', 8))
  const cornerRadius = ref<number>(load('ff_radius', 16))
  const shadow = ref<number>(load('ff_shadow', 3))
  const frameStyle = ref<FrameStyle>(load('ff_frame', 'none'))
  const canvasSize = ref<CanvasSize>(load('ff_size', 'square'))
  const captionText = ref<string>(load('ff_captionText', ''))
  const captionPosition = ref<'above' | 'below'>(load('ff_captionPos', 'below'))
  const captionFontSize = ref<number>(load('ff_captionFs', 24))
  const captionColor = ref<string>(load('ff_captionColor', '#ffffff'))
  const watermarkEnabled = ref<boolean>(load('ff_wmEnabled', false))
  const watermarkText = ref<string>(load('ff_wmText', 'FrameFlick'))
  const watermarkOpacity = ref<number>(load('ff_wmOpacity', 40))
  const watermarkCorner = ref<WatermarkCorner>(load('ff_wmCorner', 'br'))
  const zoom = ref<number>(load('ff_zoom', 100))
  const posX = ref<number>(load('ff_posX', 0))
  const posY = ref<number>(load('ff_posY', 0))

  const persist = () => {
    save('ff_imageDataUrl', imageDataUrl.value)
    save('ff_imageName', imageName.value)
    save('ff_bgPreset', backgroundPreset.value)
    save('ff_customBg', customBgColor.value)
    save('ff_useCustomBg', useCustomBg.value)
    save('ff_padding', padding.value)
    save('ff_radius', cornerRadius.value)
    save('ff_shadow', shadow.value)
    save('ff_frame', frameStyle.value)
    save('ff_size', canvasSize.value)
    save('ff_captionText', captionText.value)
    save('ff_captionPos', captionPosition.value)
    save('ff_captionFs', captionFontSize.value)
    save('ff_captionColor', captionColor.value)
    save('ff_wmEnabled', watermarkEnabled.value)
    save('ff_wmText', watermarkText.value)
    save('ff_wmOpacity', watermarkOpacity.value)
    save('ff_wmCorner', watermarkCorner.value)
    save('ff_zoom', zoom.value)
    save('ff_posX', posX.value)
    save('ff_posY', posY.value)
  }

  watch([
    imageDataUrl, imageName, backgroundPreset, customBgColor, useCustomBg,
    padding, cornerRadius, shadow, frameStyle, canvasSize,
    captionText, captionPosition, captionFontSize, captionColor,
    watermarkEnabled, watermarkText, watermarkOpacity, watermarkCorner,
    zoom, posX, posY,
  ], persist, { deep: true })

  function getSettings() {
    return {
      backgroundPreset: backgroundPreset.value,
      customBgColor: customBgColor.value,
      useCustomBg: useCustomBg.value,
      padding: padding.value,
      cornerRadius: cornerRadius.value,
      shadow: shadow.value,
      frameStyle: frameStyle.value,
      canvasSize: canvasSize.value,
      captionText: captionText.value,
      captionPosition: captionPosition.value,
      captionFontSize: captionFontSize.value,
      captionColor: captionColor.value,
      watermarkEnabled: watermarkEnabled.value,
      watermarkText: watermarkText.value,
      watermarkOpacity: watermarkOpacity.value,
      watermarkCorner: watermarkCorner.value,
      zoom: zoom.value,
      posX: posX.value,
      posY: posY.value,
    }
  }

  function applySettings(s: ReturnType<typeof getSettings>) {
    backgroundPreset.value = s.backgroundPreset
    customBgColor.value = s.customBgColor
    useCustomBg.value = s.useCustomBg
    padding.value = s.padding
    cornerRadius.value = s.cornerRadius
    shadow.value = s.shadow
    frameStyle.value = s.frameStyle
    canvasSize.value = s.canvasSize
    captionText.value = s.captionText
    captionPosition.value = s.captionPosition
    captionFontSize.value = s.captionFontSize
    captionColor.value = s.captionColor
    watermarkEnabled.value = s.watermarkEnabled
    watermarkText.value = s.watermarkText
    watermarkOpacity.value = s.watermarkOpacity
    watermarkCorner.value = s.watermarkCorner
    zoom.value = s.zoom
    posX.value = s.posX
    posY.value = s.posY
  }

  function resetPosition() {
    posX.value = 0
    posY.value = 0
  }

  return {
    imageDataUrl, imageName,
    backgroundPreset, customBgColor, useCustomBg,
    padding, cornerRadius, shadow, frameStyle, canvasSize,
    captionText, captionPosition, captionFontSize, captionColor,
    watermarkEnabled, watermarkText, watermarkOpacity, watermarkCorner,
    zoom, posX, posY,
    getSettings, applySettings, resetPosition,
  }
})
