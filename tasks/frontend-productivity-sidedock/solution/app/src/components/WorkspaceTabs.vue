<script setup>
import { ref, nextTick } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()
const editingId = ref(null)
const editValue = ref('')
const editInput = ref(null)
const showColorPicker = ref(null)

const WORKSPACE_COLORS = ['#E54610', '#D97706', '#65A30D', '#059669', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#6B7280']

function startCreate() {
  store.showCreateWorkspaceModal = true
}

function startRename(ws) {
  editingId.value = ws.id
  editValue.value = ws.name
  nextTick(() => editInput.value?.focus())
}

function commitRename() {
  if (editingId.value) {
    store.renameWorkspace(editingId.value, editValue.value.trim())
    editingId.value = null
  }
}

function cancelRename() {
  editingId.value = null
}

function handleDelete(ws) {
  if (confirm(`Delete workspace "${ws.name}" and all its contents?`)) {
    store.deleteWorkspace(ws.id)
  }
}
</script>

<template>
  <div class="flex items-end gap-1 overflow-x-auto pb-0" style="scrollbar-width: thin;">
    <div
      v-for="ws in store.workspaces"
      :key="ws.id"
      class="workspace-tab group relative flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-all whitespace-nowrap border border-b-0"
      :class="store.activeWorkspaceId === ws.id ? 'border-b-transparent' : 'border-b-[var(--color-border)]'"
      :style="store.activeWorkspaceId === ws.id
        ? { background: `color-mix(in srgb, ${ws.color} 14%, var(--color-background))`, color: 'var(--color-text-primary)', borderBottomColor: 'var(--color-background)' }
        : { background: 'var(--color-surface)', color: 'var(--color-text-primary)', opacity: 0.7 }"
      @click="store.activeWorkspaceId = ws.id"
      @keydown.enter="store.activeWorkspaceId = ws.id"
      @keydown.space.prevent="store.activeWorkspaceId = ws.id"
      role="tab"
      :aria-selected="store.activeWorkspaceId === ws.id"
      tabindex="0"
    >
      <!-- Per-workspace accent underline: ties this tab to the workspace's chosen color -->
      <span aria-hidden="true" class="tab-accent-bar" :style="{ background: ws.color }"></span>

      <!-- Color dot -->
      <button
        class="color-trigger w-6 h-6 rounded-full flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
        :style="{ background: ws.color }"
        @click.stop="showColorPicker = showColorPicker === ws.id ? null : ws.id"
        aria-label="Change workspace color"
        :aria-expanded="showColorPicker === ws.id"
      ></button>

      <!-- Color picker popup -->
      <div 
        v-if="showColorPicker === ws.id"
        class="color-picker fixed top-24 left-4 p-3 rounded-lg shadow-lg z-50 border"
        style="background: white; border-color: var(--color-border);"
        @click.stop
        role="group"
        aria-label="Workspace colors"
      >
        <div class="flex gap-1.5 flex-wrap w-32">
          <button
            v-for="c in WORKSPACE_COLORS"
            :key="c"
            class="w-8 h-8 rounded cursor-pointer transition-transform hover:scale-110 border-2"
            :class="ws.color === c ? 'border-gray-800' : 'border-transparent'"
            :style="{ background: c }"
            @click.stop="store.setWorkspaceColor(ws.id, c); showColorPicker = null"
            :aria-label="`Use color ${c}`"
            :aria-pressed="ws.color === c"
          ></button>
        </div>
      </div>

      <!-- Name or edit input -->
      <template v-if="editingId === ws.id">
        <input
          ref="editInput"
          v-model="editValue"
          class="bg-transparent border-none outline-none text-sm w-28 px-0 font-medium"
          style="font-family: 'Cormorant Upright', Georgia, serif; color: var(--color-text-primary);"
          @keydown.enter="commitRename"
          @keydown.escape="cancelRename"
          @blur="commitRename"
          aria-label="Workspace name"
        />
      </template>
      <template v-else>
        <span 
          class="font-medium truncate"
          style="font-family: 'Cormorant Upright', Georgia, serif;"
          @dblclick.stop="startRename(ws)"
        >
          {{ ws.name }}
        </span>
      </template>

      <!-- Actions (visible on hover / active) -->
      <div v-if="store.activeWorkspaceId === ws.id" class="workspace-actions flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          @click.stop="startRename(ws)"
          class="icon-action rounded flex items-center justify-center text-xs hover:bg-gray-200 transition-colors cursor-pointer"
          title="Rename workspace"
          aria-label="Rename workspace"
          style="font-size: 10px;"
        >✎</button>
        <button
          @click.stop="handleDelete(ws)"
          class="icon-action rounded flex items-center justify-center text-xs hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
          title="Delete workspace"
          aria-label="Delete workspace"
          style="font-size: 10px;"
        >✕</button>
      </div>
    </div>

    <!-- New workspace button -->
    <button
      @click="startCreate"
      class="px-3 py-2 rounded-t-md text-sm cursor-pointer transition-all hover:bg-white/50 border border-b-0 border-dashed border-[var(--color-border)] flex items-center gap-1 whitespace-nowrap"
      style="color: var(--color-accent);"
    >
      <span aria-hidden="true" style="font-size: 16px; line-height: 1;">+</span>
      <span style="font-family: 'Cormorant Upright', Georgia, serif;">Add workspace</span>
    </button>
  </div>
</template>

<style scoped>
.workspace-tab { font-family: "Cormorant Upright", Georgia, serif; font-size: 24px; }
.icon-action { width: 48px; height: 48px; min-width: 48px; }
.color-trigger { border: 2px solid var(--control-background); box-shadow: 0 0 0 1px var(--control-border); }
.tab-accent-bar {
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  height: 3px;
  border-radius: 0 0 3px 3px;
}
@media (max-width: 520px) {
  .workspace-tab { font-size: 20px; }
  .workspace-actions { opacity: 1; }
  .icon-action { width: 28px; height: 28px; min-width: 28px; }
}
:global(.compact-view) .workspace-actions { opacity: 1; }
:global(.compact-view) .icon-action { width: 28px; height: 28px; min-width: 28px; }
</style>

.workspace-tab:hover {
  background: color-mix(in srgb, var(--color-accent) 5%, var(--control-background)) !important;
}

.workspace-tab:focus-visible {
  outline: 2px solid var(--color-accent) !important;
  outline-offset: -2px;
}
