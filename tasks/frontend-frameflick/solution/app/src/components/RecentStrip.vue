<template>
  <div v-if="recentStore.items.length > 0" class="recent-section">
    <h2 class="panel-title">Recent</h2>
    <ul class="thumbnails">
      <li
        v-for="item in recentStore.items"
        :key="item.id"
      >
        <button
          type="button"
          class="thumb"
          :class="{ active: store.imageDataUrl === item.dataUrl }"
          @click="loadRecent(item)"
          :title="item.name"
          :aria-pressed="store.imageDataUrl === item.dataUrl"
        >
          <img :src="item.dataUrl" :alt="item.name" />
          <span class="thumb-label">{{ shortName(item.name) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRecentStore } from '../stores/recent'
import { useCanvasStore } from '../stores/canvas'

const recentStore = useRecentStore()
const store = useCanvasStore()

function loadRecent(item: typeof recentStore.items[0]) {
  const active = recentStore.items.find(candidate => candidate.dataUrl === store.imageDataUrl)
  if (active) recentStore.updateSettings(active.id, store.getSettings() as Record<string, unknown>)
  store.imageDataUrl = item.dataUrl
  store.imageName = item.name
  store.applySettings(item.settings as Parameters<typeof store.applySettings>[0])
}

function shortName(name: string) {
  return name.length > 12 ? name.slice(0, 10) + '…' : name
}
</script>

<style scoped>
.recent-section {}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  color: #a16207;
  margin-bottom: 12px;
}
.thumbnails {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  list-style: none;
}
.thumb {
  width: 100%;
  padding: 0;
  min-height: 48px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #92400e;
  cursor: pointer;
  background: #fef3d0;
  transition: all 0.15s;
}
.thumb:hover { border-color: #FDE047; box-shadow: 0 2px 8px rgba(253,224,71,0.4); }
.thumb.active { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.3); }
.thumb img {
  width: 100%;
  height: 56px;
  object-fit: cover;
  display: block;
}
.thumb-label {
  font-size: 9px;
  text-align: center;
  padding: 3px 4px;
  color: #92400e;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
