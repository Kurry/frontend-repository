<template>
  <div class="app-shell">
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon" aria-hidden="true">🎞️</span>
          <h1 class="logo-text">FrameFlick</h1>
        </div>
        <nav class="header-actions" aria-label="Workspace views">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeView === 'editor' }"
            :aria-pressed="activeView === 'editor'"
            @click="activeView = 'editor'"
          ><span aria-hidden="true">🖌️</span> Editor</button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeView === 'collab' }"
            :aria-pressed="activeView === 'collab'"
            @click="activeView = 'collab'"
          ><span aria-hidden="true">🤝</span> Collaboration</button>
          <button type="button" class="tab-btn palette-btn" title="Command palette (Ctrl+K)" @click="paletteOpen = true">
            <span aria-hidden="true">⌘</span> Commands
          </button>
        </nav>
      </div>
    </header>

    <!-- Editor View -->
    <div v-if="activeView === 'editor'" class="editor-layout">
      <!-- Left Panel -->
      <aside class="left-panel" aria-label="Images and saved looks">
        <UploadZone />
        <RecentStrip />
        <PresetsPanel />
        <SnapshotsPanel />
      </aside>

      <!-- Canvas -->
      <main class="canvas-area" aria-label="Canvas and export">
        <HistoryBar />
        <CanvasPreview ref="canvasPreviewRef" />
        <ExportBar />
        <StyleRecipePanel />
      </main>

      <!-- Right Panel -->
      <aside class="right-panel" aria-label="Style controls">
        <div class="panel-scroll">
          <BackgroundPanel />
          <StylePanel />
          <FramePanel />
          <CanvasSizePanel />
          <CaptionPanel />
          <WatermarkPanel />
          <PositionPanel />
        </div>
      </aside>
    </div>

    <!-- Collaboration View -->
    <div v-if="activeView === 'collab'" class="collab-view">
      <CollabPanel />
    </div>

    <CommandPalette v-if="paletteOpen" @close="paletteOpen = false" @view="v => { activeView = v; paletteOpen = false }" />
    <Announcer />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCanvasStore } from './stores/canvas'
import { useRecentStore } from './stores/recent'
import UploadZone from './components/UploadZone.vue'
import RecentStrip from './components/RecentStrip.vue'
import PresetsPanel from './components/PresetsPanel.vue'
import SnapshotsPanel from './components/SnapshotsPanel.vue'
import CanvasPreview from './components/CanvasPreview.vue'
import HistoryBar from './components/HistoryBar.vue'
import ExportBar from './components/ExportBar.vue'
import StyleRecipePanel from './components/StyleRecipePanel.vue'
import BackgroundPanel from './components/BackgroundPanel.vue'
import StylePanel from './components/StylePanel.vue'
import FramePanel from './components/FramePanel.vue'
import CanvasSizePanel from './components/CanvasSizePanel.vue'
import CaptionPanel from './components/CaptionPanel.vue'
import WatermarkPanel from './components/WatermarkPanel.vue'
import PositionPanel from './components/PositionPanel.vue'
import CollabPanel from './components/CollabPanel.vue'
import CommandPalette from './components/CommandPalette.vue'
import Announcer from './components/Announcer.vue'

const activeView = ref<'editor' | 'collab'>('editor')
const paletteOpen = ref(false)
const canvasPreviewRef = ref<InstanceType<typeof CanvasPreview> | null>(null)
const canvasStore = useCanvasStore()
const recentStore = useRecentStore()

// Keep the active Recent entry's saved settings in sync with live edits, so
// thumbnail switching always restores each image's own last-used look. Match by
// dataUrl (unique in the Recent list) rather than activeId, so edits still sync
// when activeId is stale or absent (e.g. a pre-ff_recentActive persisted state).
watch(
  () => canvasStore.getSettings(),
  settings => {
    const match = recentStore.items.find(item => item.dataUrl === canvasStore.imageDataUrl)
    if (match) recentStore.updateSettings(match.id, settings)
  },
  { deep: true }
)

function onPaletteShortcut(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (paletteOpen.value) {
      paletteOpen.value = false // Ctrl+K still toggles the palette closed
      return
    }
    // Don't open the palette on top of another modal dialog (import, paste,
    // confirm) — they render role="dialog" + aria-modal="true" while open.
    if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return
    paletteOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onPaletteShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onPaletteShortcut))
</script>

<style>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fef9ef;
}
.app-header {
  background: #713F12;
  color: #FDE047;
  padding: 0 24px;
  min-height: 56px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  flex-wrap: wrap;
  padding: 4px 0;
}
.logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 22px; }
.logo-text { font-weight: 800; font-size: 16px; letter-spacing: -0.5px; color: #FDE047; }
.header-actions { display: flex; gap: 8px; }
.tab-btn {
  padding: 8px 16px;
  min-height: 44px;
  border-radius: 999px;
  border: 2px solid transparent;
  background: transparent;
  color: rgba(253, 224, 71, 0.75);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.tab-btn:hover { color: #FDE047; border-color: rgba(253, 224, 71, 0.4); transform: translateY(-1px); }
.tab-btn.active { background: #FDE047; color: #713F12; border-color: #FDE047; }

.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 0;
  flex: 1;
  min-height: calc(100vh - 56px);
  overflow: hidden;
}
.left-panel {
  background: #fff8ee;
  border-right: 1px solid #f3d89a;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.canvas-area {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 16px;
  overflow-y: auto;
  gap: 16px;
  background: #fef3d0;
}
.right-panel {
  background: #fff8ee;
  border-left: 1px solid #f3d89a;
  overflow-y: auto;
  padding: 16px;
}
.panel-scroll {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}
.collab-view {
  flex: 1;
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* Shared panel card styles — 8px radius, 4px spacing scale */
.panel-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f3d89a;
  padding: 16px;
}
.left-panel .panel-card,
.right-panel .panel-card { box-shadow: 0 1px 4px rgba(113, 63, 18, 0.06); }
.panel-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  color: #a16207;
  margin-bottom: 12px;
}
.pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  min-height: 48px;
  border-radius: 999px;
  background: #FDE047;
  color: #713F12;
  font-weight: 700;
  font-size: 13px;
  border: none;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(253, 224, 71, 0.3);
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.pill-btn:hover {
  background: #fcd34d;
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(253, 224, 71, 0.45);
}
.pill-btn:active { transform: translateY(0); }
.pill-btn.secondary { background: #713F12; color: #FDE047; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.2); }
.pill-btn.secondary:hover { background: #92400e; }
.pill-btn.danger { background: #ef4444; color: #fff; box-shadow: none; }
.pill-btn.danger:hover { background: #dc2626; }
.pill-btn.ghost { background: transparent; color: #713F12; border: 2px solid #92400e; box-shadow: none; }
.pill-btn.ghost:hover { background: #fef3d0; }
.pill-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
}
.slider-value {
  font-weight: 800;
  color: #713F12;
  min-width: 40px;
  text-align: right;
}
input[type=range] {
  width: 100%;
  height: 28px;
  border-radius: 8px;
}
.text-input {
  width: 100%;
  border: 2px solid #92400e;
  border-radius: 8px;
  padding: 8px 12px;
  min-height: 44px;
  font-size: 13px;
  color: #713F12;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.text-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
.text-input::placeholder { color: #92400e; }
.error-msg { color: #b91c1c; font-size: 11px; margin-top: 4px; font-weight: 700; }
.success-msg { color: #166534; font-size: 11px; margin-top: 4px; font-weight: 700; }

button,
input,
select,
textarea {
  font-family: inherit;
}

:where(button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: #713F12;
  font-size: 12px;
  font-weight: 700;
}

.field-hint {
  margin-top: 4px;
  color: #92400e;
  font-size: 11px;
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: 240px 1fr 260px;
  }
}

@media (max-width: 600px) {
  .app-header {
    height: auto;
    min-height: 56px;
    padding: 8px 12px;
  }
  .header-inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;
  }
  .tab-btn {
    min-height: 44px;
    padding: 8px 12px;
    flex: 1 1 auto;
    text-align: center;
  }
  .editor-layout {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: visible;
  }
  .left-panel,
  .right-panel,
  .canvas-area {
    width: 100%;
    min-width: 0;
    overflow: visible;
    border: 0;
  }
  .left-panel { order: 1; }
  .canvas-area {
    order: 2;
    padding: 16px 12px;
  }
  .right-panel { order: 3; }
  .collab-view {
    padding: 16px 12px;
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-btn,
  .pill-btn { transition: none; }
  .tab-btn:hover,
  .pill-btn:hover { transform: none; }
}
</style>
