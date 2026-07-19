<template>
  <div class="app-shell">
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon" aria-hidden="true">🎞</span>
          <h1 class="logo-text">FrameFlick</h1>
        </div>
        <div class="header-actions">
          <button class="tab-btn" :class="{ active: activeView === 'editor' }" :aria-pressed="activeView === 'editor'" @click="activeView = 'editor'">Editor</button>
          <button class="tab-btn" :class="{ active: activeView === 'collab' }" :aria-pressed="activeView === 'collab'" @click="activeView = 'collab'">Collaboration</button>
        </div>
      </div>
    </header>

    <!-- Editor View -->
    <div v-if="activeView === 'editor'" class="editor-layout">
      <!-- Left Panel -->
      <aside class="left-panel">
        <UploadZone />
        <RecentStrip />
        <PresetsPanel />
      </aside>

      <!-- Canvas -->
      <main class="canvas-area">
        <CanvasPreview ref="canvasPreviewRef" />
        <ExportPanel :canvas-ref="canvasPreviewRef" />
      </main>

      <!-- Right Panel -->
      <aside class="right-panel">
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from './stores/canvas'
import { useRecentStore } from './stores/recent'
import UploadZone from './components/UploadZone.vue'
import RecentStrip from './components/RecentStrip.vue'
import PresetsPanel from './components/PresetsPanel.vue'
import CanvasPreview from './components/CanvasPreview.vue'
import ExportPanel from './components/ExportPanel.vue'
import BackgroundPanel from './components/BackgroundPanel.vue'
import StylePanel from './components/StylePanel.vue'
import FramePanel from './components/FramePanel.vue'
import CanvasSizePanel from './components/CanvasSizePanel.vue'
import CaptionPanel from './components/CaptionPanel.vue'
import WatermarkPanel from './components/WatermarkPanel.vue'
import PositionPanel from './components/PositionPanel.vue'
import CollabPanel from './components/CollabPanel.vue'

const activeView = ref<'editor' | 'collab'>('editor')
const canvasPreviewRef = ref<InstanceType<typeof CanvasPreview> | null>(null)
const canvasStore = useCanvasStore()
const recentStore = useRecentStore()

watch(
  () => canvasStore.getSettings(),
  settings => {
    const active = recentStore.items.find(item => item.dataUrl === canvasStore.imageDataUrl)
    if (active) recentStore.updateSettings(active.id, settings as Record<string, unknown>)
  },
  { deep: true, flush: 'sync' }
)
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
  height: 52px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 22px; }
.logo-text { font-weight: 800; font-size: 16px; letter-spacing: -0.5px; color: #FDE047; }
.header-actions { display: flex; gap: 8px; }
.tab-btn {
  padding: 8px 16px;
  min-height: 48px;
  border-radius: 999px;
  border: 2px solid transparent;
  background: transparent;
  color: rgba(253,224,71,0.7);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { color: #FDE047; border-color: rgba(253,224,71,0.3); }
.tab-btn.active { background: #FDE047; color: #713F12; border-color: #FDE047; }

.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 0;
  flex: 1;
  min-height: calc(100vh - 52px);
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
  align-items: center;
  justify-content: flex-start;
  padding: 24px 16px;
  overflow-y: auto;
  gap: 16px;
  background: #fef3d0;
}
.right-panel {
  background: #fff8ee;
  border-left: 1px solid #f3d89a;
  overflow-y: auto;
}
.panel-scroll {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
}
.collab-view {
  flex: 1;
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* Shared panel card styles */
.panel-card {
  background: #ffffff;
  border-radius: 0;
  border-bottom: 1px solid #f3d89a;
  padding: 16px;
}
.panel-card:last-child { border-bottom: none; }
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
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.15), 0 0 0 2px rgba(253,224,71,0.3);
  transition: all 0.15s;
}
.pill-btn:hover { background: #fcd34d; transform: translateY(-1px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 8px rgba(0,0,0,0.2), 0 0 0 2px rgba(253,224,71,0.4); }
.pill-btn:active { transform: translateY(0); }
.pill-btn.secondary { background: #713F12; color: #FDE047; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.2); }
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
  font-weight: 600;
  color: #92400e;
}
.slider-value {
  font-weight: 700;
  color: #713F12;
  min-width: 36px;
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
  font-size: 13px;
  color: #713F12;
  background: #fff;
  transition: border-color 0.15s;
}
.text-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.28); }
.text-input::placeholder { color: #92400e; }
.error-msg { color: #ef4444; font-size: 11px; margin-top: 4px; }
.success-msg { color: #22c55e; font-size: 11px; margin-top: 4px; }

button,
input,
select,
textarea {
  font-family: inherit;
}

:where(button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.9);
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
  color: #713F12;
  font-size: 12px;
}

@media (max-width: 600px) {
  .app-header {
    height: auto;
    min-height: 52px;
    padding: 8px 12px;
  }
  .header-inner {
    align-items: flex-start;
    gap: 8px;
  }
  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .tab-btn {
    min-height: 44px;
    padding: 8px 12px;
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
  .left-panel {
    order: 1;
  }
  .canvas-area {
    order: 2;
    padding: 16px 12px;
  }
  .right-panel {
    order: 3;
  }
  .collab-view {
    padding: 16px 12px;
    min-width: 0;
  }
}
</style>
