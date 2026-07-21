<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import {
  PhDownloadSimple as DownloadSimpleIcon,
  PhMoon as MoonIcon,
  PhRows as RowsIcon,
  PhSliders as SlidersIcon,
  PhSun as SunIcon,
  PhWind as WindIcon,
} from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const installEvent = ref(null)

function captureInstallPrompt(event) {
  event.preventDefault()
  installEvent.value = event
}
onMounted(() => window.addEventListener('beforeinstallprompt', captureInstallPrompt))
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', captureInstallPrompt))

async function installApp() {
  const event = installEvent.value
  if (!event) return
  try {
    await event.prompt()
    const choice = await event.userChoice
    if (choice?.outcome === 'accepted') store.toast('Larkspur Releases added to your home screen.')
    else store.toast('Larkspur installation was dismissed.', 'info')
  } catch {
    store.toast('Larkspur installation is unavailable in this browser.', 'info')
  } finally {
    installEvent.value = null
  }
}
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <button class="icon-button" type="button" data-tour="prefs" aria-label="Open preferences" title="Preferences">
        <SlidersIcon :size="18" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="prefs-pop" side="bottom" align="end" :side-offset="9">
        <p class="prefs-title">Session preferences</p>
        <p class="prefs-label" id="prefs-theme-label">Color theme</p>
        <div class="seg-row" role="group" aria-labelledby="prefs-theme-label">
          <button class="seg-btn" type="button" :aria-pressed="store.theme === 'light'" @click="store.setTheme('light')"><SunIcon :size="13" /> Light</button>
          <button class="seg-btn" type="button" :aria-pressed="store.theme === 'dark'" @click="store.setTheme('dark')"><MoonIcon :size="13" /> Dark</button>
        </div>
        <p class="prefs-label" id="prefs-density-label">Table density</p>
        <div class="seg-row" role="group" aria-labelledby="prefs-density-label">
          <button class="seg-btn" type="button" :aria-pressed="store.density === 'comfortable'" @click="store.setDensity('comfortable')">Comfortable</button>
          <button class="seg-btn" type="button" :aria-pressed="store.density === 'compact'" @click="store.setDensity('compact')"><RowsIcon :size="13" /> Compact</button>
        </div>
        <p class="prefs-label" id="prefs-motion-label">Motion</p>
        <label class="prefs-check" for="reduce-motion-check">
          <input id="reduce-motion-check" type="checkbox" :checked="store.reduceMotion" @change="store.setReduceMotion($event.target.checked)" />
          <WindIcon :size="14" /> Reduce motion
        </label>
        <button v-if="installEvent" class="button secondary prefs-install" type="button" @click="installApp">
          <DownloadSimpleIcon :size="15" /> Install Larkspur
        </button>
        <PopoverArrow class="tooltip-arrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
