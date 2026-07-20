<template>
  <div class="h-[100vh] w-[100vw] overflow-hidden flex flex-col md:flex-row relative">

    <!-- Left / Background: Lab Preview -->
    <div class="flex-1 relative h-[100vh]">
      <LabPreview />
      <DialsMeter />

      <!-- Brand Chip -->
      <div class="absolute left-1/2 bottom-[20px] -translate-x-1/2 z-[200] pointer-events-none px-[20px] py-[6px] rounded-[8px] bg-[rgba(239,62,35,0.4)] text-[#cccec3] text-[14px] font-[300] tracking-[0.06em] uppercase hidden md:block">
        Camera Exposure Simulator
      </div>

      <!-- Help Toggle Desktop -->
      <button
        id="help-btn"
        class="hidden md:flex absolute right-[70px] -top-[100px] w-10 h-10 rounded-full bg-primary text-text-light opacity-80 overflow-hidden flex-col items-center transition-opacity hover:opacity-100 cursor-pointer z-[1100] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="{ 'opacity-100': store.helpOpen }"
        :style="{ top: store.helpOpen ? '20px' : '-100px', transform: store.helpOpen ? 'none' : 'translateY(120px)' }"
        @click="store.helpOpen = !store.helpOpen"
        :aria-expanded="store.helpOpen"
        aria-controls="help-panel"
        aria-label="Toggle exposure help"
      >
        <span class="w-10 h-10 flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-40px)' : 'none' }">?</span>
        <span class="w-10 h-10 flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-40px)' : 'none' }">X</span>
      </button>

      <!-- Help Toggle Mobile -->
      <button
        class="flex md:hidden absolute left-1/2 top-[64px] -translate-x-1/2 w-[44px] h-[44px] rounded-full bg-[rgba(239,62,35,0.6)] text-text-light overflow-hidden flex-col items-center transition-opacity z-[1100] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="store.helpOpen = !store.helpOpen"
        :aria-expanded="store.helpOpen"
        aria-controls="help-panel"
        aria-label="Toggle exposure help"
      >
        <span class="w-[44px] h-[44px] flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-44px)' : 'none' }">?</span>
        <span class="w-[44px] h-[44px] flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-44px)' : 'none' }">X</span>
      </button>

      <!-- Before Hold Toggle -->
      <button
        class="absolute left-[20px] top-[20px] z-[200] px-4 py-2 bg-black/50 text-white rounded-full text-sm font-medium hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
        @mousedown="store.beforeHold = true"
        @mouseup="store.beforeHold = false"
        @mouseleave="store.beforeHold = false"
        @touchstart.prevent="store.beforeHold = true"
        @touchend.prevent="store.beforeHold = false"
      >
        Before
      </button>

      <!-- Help Panel -->
      <aside
        id="help-panel"
        class="absolute md:right-0 md:left-auto left-1/2 top-1/2 -translate-y-1/2 z-[1000] md:w-[630px] w-[360px] md:h-[420px] h-[360px] pl-[20px] rounded-l-[20px] md:rounded-none rounded-[10px] bg-panel flex items-center opacity-0 pointer-events-none transition-all duration-[450ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]"
        :class="{ 'opacity-100 pointer-events-auto max-md:-translate-x-1/2 md:translate-x-0': store.helpOpen, 'md:translate-x-[630px] max-md:translate-y-[-20px] max-md:-translate-x-1/2': !store.helpOpen }"
        :aria-hidden="!store.helpOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Help Panel"
      >
        <div class="md:w-[382px] w-[330px] md:h-[360px] h-[280px] flex flex-col justify-between py-[6px]">
          <p class="m-0 text-primary md:text-[14px] text-[13px] md:line-height-[16px] leading-[15px] font-[400] md:text-left text-center">
            <strong class="font-[600]">Aperture</strong> refers to the opening in a lens through which light enters. A lower f-number means a wider opening, more light, and a shallow depth of field (blurry background). A higher f-number means less light and more depth of field (more in focus). Aperture affects both exposure and how much of your image appears sharp.
          </p>
          <p class="m-0 text-primary md:text-[14px] text-[13px] md:line-height-[16px] leading-[15px] font-[400] md:text-left text-center">
            <strong class="font-[600]">Shutter Speed</strong> is how long your camera’s sensor is exposed to light. Fast shutter speeds (like 1/1000s) freeze motion, while slower speeds (like 1/10s or longer) blur movement, useful for light trails or motion effects. It’s key for controlling motion and exposure. Slower speeds need a tripod to avoid camera shake and blurriness in your photos.
          </p>
          <p class="m-0 text-primary md:text-[14px] text-[13px] md:line-height-[16px] leading-[15px] font-[400] md:text-left text-center">
            <strong class="font-[600]">ISO</strong> controls your camera’s sensitivity to light. Lower ISO values (like 100 or 200) produce clean images in bright conditions. Higher ISOs (like 1600 or 3200) help in low light but can add digital noise. Balancing ISO with aperture and shutter speed is essential for well-exposed photos. Try to keep ISO low for the best image quality.
          </p>
        </div>
      </aside>
    </div>

    <!-- Right: Drawer / Panel -->
    <div class="w-full md:w-[400px] h-1/2 md:h-[100vh] bg-panel flex flex-col shadow-2xl z-[2500] border-t md:border-l border-white/20 relative">

      <!-- Mode Tabs -->
      <div class="flex p-2 bg-black/10 gap-2 shrink-0">
        <button
          class="flex-1 py-2 text-sm font-medium rounded transition-colors"
          :class="store.activeMode === 'Meter/Lab' ? 'bg-white text-black shadow' : 'text-black/60 hover:bg-black/5'"
          @click="store.activeMode = 'Meter/Lab'"
        >
          Meter / Lab
        </button>
        <button
          class="flex-1 py-2 text-sm font-medium rounded transition-colors"
          :class="store.activeMode === 'Presets/Compare' ? 'bg-white text-black shadow' : 'text-black/60 hover:bg-black/5'"
          @click="store.activeMode = 'Presets/Compare'"
        >
          Presets / Compare
        </button>
      </div>

      <!-- Readouts -->
      <div class="px-4 py-3 border-b border-black/10 flex justify-between items-center bg-black/5 shrink-0">
        <div class="flex gap-4 items-center w-full justify-between">
          <div class="flex flex-col">
            <span class="text-[10px] tracking-widest text-black/60 font-semibold">EV</span>
            <span class="text-lg font-medium tabular-nums">{{ store.ev.toFixed(2) }}</span>
          </div>
          <!-- Fake Luma Histogram -->
          <div class="w-24 h-8 flex items-end gap-[1px] opacity-70">
            <div v-for="i in 20" :key="i" class="flex-1 bg-black transition-all duration-200" :style="{ height: getHistogramHeight(i) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Dynamic Content -->
      <div class="flex-1 overflow-hidden relative">
        <Transition name="fade-slide" mode="out-in">
          <DevelopPanel v-if="store.activeMode === 'Meter/Lab'" />
          <PresetsView v-else />
        </Transition>
      </div>

      <!-- Export Panel -->
      <div class="shrink-0 p-4 border-t border-black/10 bg-black text-white flex flex-col gap-2 max-h-[200px]">
        <div class="flex justify-between items-center">
          <h3 class="text-[10px] font-semibold tracking-widest text-white/60">EXPORT LAB-PACKAGE</h3>
          <div class="flex gap-2">
            <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors" @click="copyLabPackage" aria-label="Copy lab package">Copy</button>
            <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors" @click="downloadLabPackage" aria-label="Download lab package">Download</button>
            <label class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors cursor-pointer" aria-label="Import lab package">
              Import
              <input type="file" accept=".json" class="hidden" @change="importLabPackage">
            </label>
          </div>
        </div>
        <pre class="flex-1 overflow-auto text-[10px] text-white/80 font-mono bg-white/5 p-2 rounded">{{ store.labPackageJson }}</pre>
        <button class="mt-2 w-full py-2 bg-primary hover:bg-red-600 rounded text-sm font-medium transition-colors" @click="handleDownloadPNG">
          Download edited PNG
        </button>
      </div>
    </div>

    <!-- Global Toast for Copy feedback -->
    <div v-if="toastMsg" class="fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-[3000] text-sm">
      {{ toastMsg }}
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from './store.js'
import LabPreview from './components/LabPreview.vue'
import DialsMeter from './components/DialsMeter.vue'
import DevelopPanel from './components/DevelopPanel.vue'
import PresetsView from './components/PresetsView.vue'
import { exportEditedPNG } from './canvas-render.js'

const store = useStore()
const toastMsg = ref('')

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => toastMsg.value = '', 2000)
}

function getHistogramHeight(index) {
  const normalizedExposure = store.ev + (store.light.exposure * 0.02)
  const center = 10 + (normalizedExposure * 2)
  const dist = Math.abs(index - center)
  let height = Math.max(10, 100 - (dist * dist * 3))
  height = height * (0.8 + Math.sin(index * 1.5) * 0.2)
  return Math.min(100, Math.max(0, height))
}

function copyLabPackage() {
  navigator.clipboard.writeText(store.labPackageJson)
  showToast('Copied lab package')
}

function downloadLabPackage() {
  const blob = new Blob([store.labPackageJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'exposure-lab-package.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importLabPackage(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const pkg = JSON.parse(ev.target.result)
      store.loadLabPackage(pkg)
      showToast('Imported lab package')
    } catch(err) {
      alert('Error importing lab package: ' + err.message)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

async function handleDownloadPNG() {
  await exportEditedPNG(store.currentLabState)
}
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
