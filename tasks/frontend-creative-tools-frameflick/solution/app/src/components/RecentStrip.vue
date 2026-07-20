<template>
  <div v-if="recentStore.items.length > 0" class="recent-section panel-card">
    <h2 class="panel-title">Recent <span class="count-badge">{{ recentStore.items.length }}/6</span></h2>
    <TransitionGroup tag="ul" class="thumbnails" name="thumb">
      <li v-for="item in recentStore.items" :key="item.id">
        <button
          type="button"
          class="thumb"
          :class="{ active: recentStore.activeId === item.id }"
          :title="`${item.name} — reload with its saved settings`"
          :aria-pressed="recentStore.activeId === item.id"
          :aria-label="`Load ${item.name} with its saved settings`"
          @click="loadRecent(item)"
        >
          <img :src="item.dataUrl" :alt="`Recent upload ${item.name}`" />
          <span class="thumb-label">{{ shortName(item.name) }}</span>
        </button>
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useRecentStore } from '../stores/recent'
import type { RecentItem } from '../stores/recent'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'

const recentStore = useRecentStore()
const store = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

function loadRecent(item: RecentItem) {
  if (recentStore.activeId === item.id) return
  history.markDiscrete()
  // Capture the outgoing image's final settings before switching.
  const active = recentStore.items.find(i => i.id === recentStore.activeId)
  if (active) recentStore.updateSettings(active.id, store.getSettings())

  store.imageDataUrl = item.dataUrl
  store.imageName = item.name
  store.applySettings(item.settings)
  store.baseline = JSON.parse(JSON.stringify(item.baseline))
  store.showingBefore = false
  recentStore.setActive(item.id)
  announcer.announce(`Loaded ${item.name} with its saved settings.`)
}

function shortName(name: string) {
  return name.length > 12 ? name.slice(0, 10) + '…' : name
}
</script>

<style scoped>
.count-badge {
  display: inline-block;
  min-width: 24px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #FDE047;
  color: #713F12;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}
.thumbnails {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  list-style: none;
  padding: 0;
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
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.thumb:hover { transform: translateY(-2px); border-color: #FDE047; box-shadow: 0 4px 12px rgba(253, 224, 71, 0.5); }
.thumb.active { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.35); }
.thumb img {
  width: 100%;
  height: 56px;
  object-fit: cover;
  display: block;
}
.thumb-label {
  display: block;
  font-size: 9px;
  text-align: center;
  padding: 4px;
  color: #92400e;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* New thumbnails animate in rather than popping */
.thumb-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.thumb-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.thumb-enter-from { opacity: 0; transform: scale(0.7) translateY(-8px); }
.thumb-leave-to { opacity: 0; transform: scale(0.7); }
.thumb-move { transition: transform 0.25s ease; }

@media (prefers-reduced-motion: reduce) {
  .thumb,
  .thumb-enter-active,
  .thumb-leave-active,
  .thumb-move { transition: none; }
  .thumb-enter-from,
  .thumb-leave-to { opacity: 1; transform: none; }
  .thumb:hover { transform: none; }
}
</style>
