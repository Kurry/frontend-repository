<template>
  <div class="h-[100vh] w-[100vw] overflow-hidden flex flex-col md:flex-row relative">

    <!-- Left / Background: Lab Preview -->
    <div class="flex-1 relative h-[100vh]">
      <LabPreview />
      <DialsMeter />

      <!-- Brand Chip -->
      <div class="absolute left-1/2 bottom-[20px] -translate-x-1/2 z-[200] pointer-events-none px-[20px] py-[6px] rounded-[8px] bg-[rgba(239,62,35,0.4)] text-text-light text-[14px] font-[300] tracking-[0.06em] uppercase hidden md:block">
        Camera Exposure Simulator
      </div>

      <!-- Session stopped banner (WebMCP session_stop postcondition) -->
      <div
        v-if="!store.sessionRunning"
        class="absolute top-[70px] left-1/2 z-[1200] bg-black/85 text-white rounded-[10px] px-4 py-2 flex items-center gap-3 shadow-xl"
        style="transform: translateX(-50%)"
        role="status"
      >
        <span class="text-[13px] font-medium tracking-wide">Session stopped</span>
        <button
          class="px-3 py-1 rounded bg-primary hover:bg-red-600 text-white text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="resumeSession"
        >
          Resume
        </button>
      </div>

      <!-- First-run coachmark (in-memory only; non-blocking) -->
      <Transition name="dialog">
        <aside
          v-if="coachmarkVisible"
          class="coachmark-card absolute top-[70px] left-[16px] md:left-[110px] z-[1150] w-[290px] bg-panel rounded-[10px] shadow-2xl p-4 border-l-4 border-primary"
          aria-label="Quick tour"
        >
          <h2 class="m-0 text-[11px] font-semibold tracking-[0.18em] text-black/70 uppercase">Quick tour</h2>
          <p class="m-0 mt-2 text-[13px] leading-[17px] text-black/80">
            The three dials step <strong>Aperture</strong>, <strong>Speed</strong>, and <strong>ISO</strong> in stops.
            The meter on the left shows under / balanced / over exposure, and EV plus the histogram update live with every step.
            Press <strong>?</strong> anytime for the full explainer.
          </p>
          <button
            class="mt-3 px-3 py-1.5 rounded bg-black/80 hover:bg-black text-white text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="coachmarkVisible = false"
          >
            Got it
          </button>
        </aside>
      </Transition>

      <!-- Help Toggle Desktop -->
      <button
        id="help-btn"
        class="hidden md:flex absolute right-[70px] top-[20px] w-11 h-11 rounded-full bg-primary text-text-light opacity-85 overflow-hidden flex-col items-center transition-opacity duration-[180ms] hover:opacity-100 cursor-pointer z-[1100] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="{ 'opacity-100': store.helpOpen }"
        @click="toggleHelp($event)"
        :aria-expanded="store.helpOpen"
        aria-controls="help-panel"
        aria-label="Toggle exposure help"
      >
        <span class="w-11 h-11 flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-44px)' : 'none' }">?</span>
        <span class="w-11 h-11 flex-none flex items-center justify-center text-[26px] font-[300] pointer-events-none transition-transform duration-[350ms]" :style="{ transform: store.helpOpen ? 'translateY(-44px)' : 'none' }">X</span>
      </button>

      <!-- Help Toggle Mobile -->
      <button
        class="flex md:hidden absolute left-1/2 top-[64px] w-[44px] h-[44px] rounded-full bg-[rgba(239,62,35,0.6)] text-text-light overflow-hidden flex-col items-center transition-opacity duration-[180ms] hover:opacity-100 z-[1100] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style="transform: translateX(-50%)"
        @click="toggleHelp($event)"
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
        @touchcancel.prevent="store.beforeHold = false"
        @keydown.space.prevent="store.beforeHold = true"
        @keydown.enter.prevent="store.beforeHold = true"
        @keyup.space="store.beforeHold = false"
        @keyup.enter="store.beforeHold = false"
        @blur="store.beforeHold = false"
      >
        Before
      </button>

      <!-- Help Panel -->
      <aside
        id="help-panel"
        ref="helpPanelRef"
        tabindex="-1"
        class="absolute top-1/2 z-[2800] md:right-0 md:left-auto md:w-[560px] md:h-[440px] w-[340px] left-1/2 pl-[20px] pr-[14px] py-[18px] rounded-l-[20px] md:rounded-none rounded-[10px] bg-panel overflow-y-auto opacity-0 pointer-events-none transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.645,0.045,0.355,1)] focus:outline-none"
        :style="helpPanelStyle"
        :aria-hidden="!store.helpOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Help Panel"
        @keydown="handleHelpPanelKeydown"
      >
        <h2 class="m-0 mb-3 text-[13px] font-semibold tracking-[0.2em] text-black/70 uppercase">Exposure basics</h2>
        <section class="mb-3">
          <h3 class="m-0 text-primary text-[15px] font-semibold">Aperture</h3>
          <p class="m-0 mt-1 text-primary md:text-[14px] text-[13px] leading-[16px] font-[400]">
            <strong class="font-[600]">Aperture</strong> is the opening in the lens through which light enters. A lower f-number means a wider opening: more light, brighter preview, and a shallower depth of field (blurrier background). A higher f-number means less light and more of the scene in focus.
          </p>
        </section>
        <section class="mb-3">
          <h3 class="m-0 text-primary text-[15px] font-semibold">Speed (shutter)</h3>
          <p class="m-0 mt-1 text-primary md:text-[14px] text-[13px] leading-[16px] font-[400]">
            <strong class="font-[600]">Speed</strong> — the shutter speed dial, shown as 1/N — is how long the sensor is exposed to light. Slower speeds (like 1/2) gather more light and blur movement, while fast speeds (like 1/1000) freeze motion and darken the frame. Each stop swaps the motion frame in the preview.
          </p>
        </section>
        <section>
          <h3 class="m-0 text-primary text-[15px] font-semibold">ISO</h3>
          <p class="m-0 mt-1 text-primary md:text-[14px] text-[13px] leading-[16px] font-[400]">
            <strong class="font-[600]">ISO</strong> is the sensor's sensitivity to light. Higher ISO brightens the preview but adds visible noise grain; lower ISO keeps the image clean. Balancing ISO with aperture and speed is the core of exposure control.
          </p>
        </section>
      </aside>
    </div>

    <!-- Right: Drawer / Panel -->
    <div class="w-full md:w-[400px] h-1/2 md:h-[100vh] bg-panel flex flex-col shadow-2xl z-[2500] border-t md:border-l border-white/20 relative">

      <!-- Mode Tabs -->
      <div class="flex p-2 bg-black/10 gap-2 shrink-0" role="tablist" aria-label="Interaction mode">
        <button
          role="tab"
          :aria-selected="store.activeMode === 'Meter/Lab'"
          class="flex-1 py-2 text-sm font-medium rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="store.activeMode === 'Meter/Lab' ? 'bg-white text-black shadow' : 'text-black/60 hover:bg-black/5'"
          @click="store.activeMode = 'Meter/Lab'"
        >
          Meter / Lab
        </button>
        <button
          role="tab"
          :aria-selected="store.activeMode === 'Presets/Compare'"
          class="flex-1 py-2 text-sm font-medium rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="store.activeMode === 'Presets/Compare' ? 'bg-white text-black shadow' : 'text-black/60 hover:bg-black/5'"
          @click="store.activeMode = 'Presets/Compare'"
        >
          Presets / Compare
        </button>
      </div>

      <!-- Readouts -->
      <div class="px-4 py-3 border-b border-black/10 bg-black/5 shrink-0">
        <div class="flex justify-between items-center gap-3 w-full">
          <div class="flex flex-col">
            <span class="text-[10px] tracking-widest text-black/60 font-semibold">EV</span>
            <span class="text-lg font-medium tabular-nums">{{ store.displayEV.toFixed(2) }}</span>
          </div>
          <!-- Live luma histogram -->
          <div class="w-24 h-8 flex items-end gap-[1px] opacity-70" role="img" aria-label="Live luma histogram">
            <div v-for="i in 20" :key="i" class="flex-1 bg-black transition-all duration-200" :style="{ height: getHistogramHeight(i) + '%' }"></div>
          </div>
        </div>
        <!-- Stop-delta strip: interactive bonus aid. Each segment shows that
             dial's stop delta versus the f/16 · 1/60 · ISO 100 baseline and
             resets that dial to its baseline stop when activated. -->
        <div class="mt-2 flex items-center gap-1 text-[10px]" aria-label="Stop delta versus baseline">
          <span class="text-black/50 font-medium tracking-wide whitespace-nowrap">Δ baseline</span>
          <button
            v-for="seg in deltaSegments"
            :key="seg.key"
            class="flex-1 min-w-0 px-1 py-0.5 rounded bg-black/5 hover:bg-black/15 font-medium tabular-nums text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            :class="seg.delta === 0 ? 'text-black/45' : seg.delta > 0 ? 'text-emerald-800' : 'text-red-800'"
            :title="seg.title"
            :aria-label="seg.title"
            @click="resetDialToBaseline(seg.key)"
          >
            {{ seg.label }} {{ seg.text }}
          </button>
        </div>
      </div>

      <!-- Dynamic Content (kept alive so an in-progress create form, filter,
           and selection survive mode switches within the session) -->
      <div class="flex-1 overflow-hidden relative">
        <Transition name="fade-slide" mode="out-in">
          <KeepAlive>
            <component :is="activeView" :key="store.activeMode" />
          </KeepAlive>
        </Transition>
      </div>

      <!-- Export Panel -->
      <div class="shrink-0 p-4 border-t border-black/10 bg-black text-white flex flex-col gap-2 max-h-[220px]">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <h3 class="text-[10px] font-semibold tracking-widest text-white/60 m-0">EXPORT LAB-PACKAGE</h3>
          <div class="flex gap-2">
            <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" @click="copyLabPackage" aria-label="Copy lab package">Copy</button>
            <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" @click="downloadLabPackage" aria-label="Download lab package">Download</button>
            <button class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" @click="openImportDialog" aria-label="Import lab package">Import</button>
          </div>
        </div>
        <p v-if="importStatus" role="status" aria-live="polite" class="m-0 text-[10px] font-medium" :class="importStatusIsError ? 'text-red-400' : 'text-emerald-400'">
          {{ importStatus }}
        </p>
        <pre class="flex-1 overflow-auto text-[10px] text-white/80 font-mono bg-white/5 p-2 rounded m-0">{{ store.labPackageJson }}</pre>
        <button class="mt-2 w-full py-2 bg-primary hover:bg-red-600 rounded text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" @click="handleDownloadPNG">
          Download edited PNG
        </button>
      </div>
    </div>

    <!-- Import lab package dialog: paste JSON or pick a file -->
    <Transition name="dialog">
      <div
        v-if="showImportDialog"
        ref="importDialogRef"
        class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50 p-4"
        tabindex="-1"
        @keydown.esc="closeImportDialog"
        @keydown.tab="trapFocus($event, importDialogRef)"
      >
        <div class="dialog-card bg-panel p-6 rounded-[10px] w-full max-w-md shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title">
          <h2 id="import-dialog-title" class="text-lg font-medium m-0 mb-2">Import lab package</h2>
          <p class="m-0 mb-3 text-[12px] text-black/70">Paste a previously exported lab-package JSON below, or choose a .json file. Dials, sliders, look, presets, and snapshots are restored to the exported state.</p>
          <label for="import-json-text" class="block text-sm font-medium mb-1">Lab-package JSON</label>
          <textarea
            id="import-json-text"
            v-model="importText"
            rows="6"
            spellcheck="false"
            class="w-full px-3 py-2 border rounded font-mono text-[11px] bg-white focus:outline-2 focus:outline-primary"
            :class="importError ? 'border-red-500' : 'border-black/20'"
            placeholder='{"schemaVersion": "exposure-control-lab.package.v1", ...}'
          ></textarea>
          <p v-if="importError" role="alert" class="m-0 mt-2 text-red-600 text-[11px] font-medium">
            {{ importError }}
          </p>
          <div class="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <label class="px-3 py-2 bg-black/10 hover:bg-black/20 rounded text-[12px] font-medium cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
              Choose file…
              <input type="file" accept=".json,application/json" class="sr-only" @change="importFromFile">
            </label>
            <div class="flex gap-2">
              <button class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="closeImportDialog">Cancel</button>
              <button
                class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :disabled="!importText.trim()"
                @click="importPasted"
              >
                Import lab package
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Global Toast for action feedback -->
    <Transition name="toast">
      <div v-if="store.toastMessage" class="toast-card fixed top-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-[3000] text-sm" role="status" aria-live="polite">
        {{ store.toastMessage }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useStore } from './store.js'
import LabPreview from './components/LabPreview.vue'
import DialsMeter from './components/DialsMeter.vue'
import DevelopPanel from './components/DevelopPanel.vue'
import PresetsView from './components/PresetsView.vue'
import { exportEditedPNG } from './canvas-render.js'

const store = useStore()

const activeView = computed(() => store.activeMode === 'Meter/Lab' ? DevelopPanel : PresetsView)

// ---------------------------------------------------------------------------
// First-run coachmark: in-memory flag only (reloads re-seed everything, per
// the good-app genre), auto-dismisses, never blocks the simulator.
const coachmarkVisible = ref(true)
const coachmarkTimer = setTimeout(() => { coachmarkVisible.value = false }, 16000)
onBeforeUnmount(() => clearTimeout(coachmarkTimer))

// ---------------------------------------------------------------------------
// Help panel dialog

const helpPanelRef = ref(null)
let helpTriggerEl = null

// Inline transform (not a Tailwind translate utility) so the panel's
// transition-[opacity,transform] reliably animates both properties.
const helpPanelStyle = computed(() => {
  if (store.helpOpen) {
    const openX = window.innerWidth >= 768 ? 'translateX(0)' : 'translateX(-50%)'
    return { transform: `translateY(-50%) ${openX}`, opacity: 1, pointerEvents: 'auto' }
  }
  const hiddenX = window.innerWidth >= 768 ? 'translateX(580px)' : 'translateX(-50%) translateX(24px)'
  return { transform: `translateY(-50%) ${hiddenX}`, opacity: 0, pointerEvents: 'none' }
})

function toggleHelp(event) {
  if (!store.helpOpen) {
    helpTriggerEl = event.currentTarget
  }
  store.helpOpen = !store.helpOpen
}

watch(() => store.helpOpen, async (open) => {
  await nextTick()
  if (open) {
    helpPanelRef.value?.focus()
  } else if (helpTriggerEl) {
    helpTriggerEl.focus()
    helpTriggerEl = null
  }
})

function handleHelpPanelKeydown(e) {
  if (e.key === 'Escape') {
    store.helpOpen = false
    return
  }
  if (e.key !== 'Tab' || !helpPanelRef.value) return
  const focusable = helpPanelRef.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) {
    // No focusable content inside the panel (it's explainer text) --
    // keep focus pinned to the panel container itself so Tab can't
    // escape to controls behind the overlay.
    e.preventDefault()
    helpPanelRef.value.focus()
    return
  }
  moveFocusWithin(e, focusable)
}

// Shared Tab-trap helper for every modal dialog in the lab.
function moveFocusWithin(e, focusable) {
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function trapFocus(e, containerRef) {
  if (!containerRef.value) return
  const focusable = containerRef.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  moveFocusWithin(e, focusable)
}

// ---------------------------------------------------------------------------
// Stop-delta strip (bonus aid): per-dial stop delta versus the seeded
// baseline; activating a segment resets that dial to its baseline stop.

const BASELINE = { aperture: 16, shutter: 60, iso: 100 }

function stopDelta(key) {
  if (key === 'aperture') return 2 * Math.log2(BASELINE.aperture / store.aperture)
  if (key === 'shutter') return Math.log2(BASELINE.shutter / store.shutter)
  return Math.log2(store.iso / BASELINE.iso)
}

function formatDelta(d) {
  const rounded = Math.round(d * 10) / 10
  if (rounded === 0) return '0'
  return (rounded > 0 ? '+' : '−') + Math.abs(rounded).toFixed(1)
}

const deltaSegments = computed(() => [
  { key: 'aperture', label: 'AP', delta: stopDelta('aperture'), text: formatDelta(stopDelta('aperture')), title: `Aperture f/${store.aperture} is ${formatDelta(stopDelta('aperture'))} stops versus baseline f/16. Activate to reset aperture to f/16.` },
  { key: 'shutter', label: 'SP', delta: stopDelta('shutter'), text: formatDelta(stopDelta('shutter')), title: `Speed 1/${store.shutter} is ${formatDelta(stopDelta('shutter'))} stops versus baseline 1/60. Activate to reset speed to 1/60.` },
  { key: 'iso', label: 'ISO', delta: stopDelta('iso'), text: formatDelta(stopDelta('iso')), title: `ISO ${store.iso} is ${formatDelta(stopDelta('iso'))} stops versus baseline 100. Activate to reset ISO to 100.` }
])

function resetDialToBaseline(key) {
  if (store[key] === BASELINE[key]) return
  store.mutate('resetDialToBaseline', () => {
    store[key] = BASELINE[key]
  })
  store.toast(`${key === 'aperture' ? 'Aperture' : key === 'shutter' ? 'Speed' : 'ISO'} reset to baseline`)
}

function resumeSession() {
  store.sessionRunning = true
  store.toast('Session started')
}

// ---------------------------------------------------------------------------
// Histogram (shares the beforeHold-aware displayEV baseline with the EV
// readout, meter, and preview so every surface agrees during a Before hold)

function getHistogramHeight(index) {
  const normalizedExposure = store.displayEV + (store.displayLightExposure * 0.02)
  const center = 10 + (normalizedExposure * 2)
  const dist = Math.abs(index - center)
  let height = Math.max(10, 100 - (dist * dist * 3))
  height = height * (0.8 + Math.sin(index * 1.5) * 0.2)
  return Math.min(100, Math.max(0, height))
}

// ---------------------------------------------------------------------------
// Export / import

const showImportDialog = ref(false)
const importDialogRef = ref(null)
const importText = ref('')
const importError = ref('')
const importStatus = ref('')
const importStatusIsError = ref(false)
let importTriggerEl = null

function openImportDialog(event) {
  importTriggerEl = event.currentTarget
  importError.value = ''
  showImportDialog.value = true
}

function closeImportDialog() {
  showImportDialog.value = false
}

watch(showImportDialog, async (open) => {
  if (open) {
    await nextTick()
    const ta = importDialogRef.value?.querySelector('textarea')
    ta?.focus()
  } else {
    await nextTick()
    importTriggerEl?.focus()
    importTriggerEl = null
  }
})

// Malformed or schema-invalid imports show an error that names the problem
// AND the fix (announced via role="alert"/aria-live), and leave the current
// session state untouched because loadLabPackage validates before applying.
function runImport(rawText) {
  try {
    const pkg = JSON.parse(rawText)
    store.loadLabPackage(pkg)
  } catch (err) {
    const isSyntax = err instanceof SyntaxError
    importError.value = isSyntax
      ? 'Import failed: the text is not valid JSON. Fix the syntax — look for a missing comma, quote, or bracket — and import again.'
      : 'Import failed: ' + err.message + ' Correct the named fields and import again.'
    importStatus.value = importError.value
    importStatusIsError.value = true
    return
  }
  importError.value = ''
  importStatus.value = 'Imported lab package: dials, sliders, presets, and snapshots restored.'
  importStatusIsError.value = false
  store.toast('Imported lab package')
  showImportDialog.value = false
  importText.value = ''
}

function importPasted() {
  if (!importText.value.trim()) return
  runImport(importText.value)
}

function importFromFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => runImport(ev.target.result)
  reader.readAsText(file)
  e.target.value = ''
}

function copyLabPackage() {
  navigator.clipboard.writeText(store.labPackageJson)
    .catch(() => {})
  store.toast('Copied lab package')
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
  store.toast('Downloaded lab package')
}

async function handleDownloadPNG() {
  await exportEditedPNG(store.currentLabState)
  store.toast('Downloaded edited PNG')
}
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Toast is centered with a plain transform so the Vue transition classes
   compose cleanly (no Tailwind translate utility on the same element). */
.toast-card {
  left: 50%;
  transform: translateX(-50%);
}
.toast-card.toast-enter-from,
.toast-card.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
