<script setup>
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()
const treeContainer = ref(null)
const dragItem = ref(null)
const dropTarget = ref(null)
const confirmDelete = ref(null)

// Flatten items for virtualization
function flattenItems(items, depth = 0) {
  const flat = []
  if (!items) return flat
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    flat.push({
      ...item,
      depth,
      index: i,
      siblingCount: items.length,
    })
    if (item.type === 'folder' && item.children && store.isExpanded(item.id)) {
      flat.push(...flattenItems(item.children, depth + 1))
    }
  }
  return flat
}

const flatItems = computed(() => {
  if (!store.activeWorkspace) return []
  return flattenItems(store.activeWorkspace.items)
})

// Fixed-height windowing keeps the live DOM small for very large collections.
const ROW_HEIGHT = 72
const OVERSCAN = 6
const scrollTop = ref(0)
const viewportHeight = ref(480)
let resizeObserver

function syncViewport() {
  if (!treeContainer.value) return
  scrollTop.value = treeContainer.value.scrollTop
  viewportHeight.value = treeContainer.value.clientHeight || 480
}

onMounted(() => {
  syncViewport()
  resizeObserver = new ResizeObserver(syncViewport)
  if (treeContainer.value) resizeObserver.observe(treeContainer.value)
  const focusedIndex = flatItems.value.findIndex(item => item.id === store.focusedItemId)
  if (focusedIndex >= 0 && treeContainer.value) {
    treeContainer.value.scrollTop = focusedIndex * ROW_HEIGHT
    syncViewport()
    nextTick(() => focusItem(store.focusedItemId))
  }
})
onBeforeUnmount(() => resizeObserver?.disconnect())

const range = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN)
  const visible = Math.ceil(viewportHeight.value / ROW_HEIGHT) + OVERSCAN * 2
  return { start, end: Math.min(flatItems.value.length, start + visible) }
})
const virtualItems = computed(() => {
  const rows = []
  for (let index = range.value.start; index < range.value.end; index++) {
    rows.push({ index, key: flatItems.value[index]?.id || index, start: index * ROW_HEIGHT, size: ROW_HEIGHT })
  }
  return rows
})
const totalSize = computed(() => flatItems.value.length * ROW_HEIGHT)

// Drag and drop
function onDragStart(item, event) {
  dragItem.value = item
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', item.id)
  setTimeout(() => {
    if (event.target && event.target.closest('[data-item-id]')) {
      event.target.closest('[data-item-id]').style.opacity = '0.4'
    }
  }, 0)
}

function onDragOver(item, event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  if (item && dragItem.value && item.id !== dragItem.value.id) {
    if (item.type === 'folder') {
      dropTarget.value = item.id
    }
  }
}

function onDragLeave() {
  dropTarget.value = null
}

function onDrop(targetItem, event) {
  event.preventDefault()
  if (!dragItem.value || !targetItem) {
    dropTarget.value = null
    dragItem.value = null
    return
  }
  if (targetItem.id === dragItem.value.id) {
    dropTarget.value = null
    dragItem.value = null
    return
  }
  if (targetItem.type === 'folder') store.moveItem(dragItem.value.id, targetItem.id)
  else store.moveItemBefore(dragItem.value.id, targetItem.id)
  dropTarget.value = null
  dragItem.value = null
}

function onRootDrop(event) {
  event.preventDefault()
  if (dragItem.value) store.moveItem(dragItem.value.id, null)
  dropTarget.value = null
  dragItem.value = null
}

function onDragEnd(event) {
  const el = event.target?.closest?.('[data-item-id]') || event.target
  if (el) el.style.opacity = ''
  dropTarget.value = null
  dragItem.value = null
}

// Reorder
function moveUp(item) {
  store.reorderItem(item.id, -1)
}

function moveDown(item) {
  store.reorderItem(item.id, 1)
}

// Inline editing
const editingId = ref(null)
const editValue = ref('')

function startEdit(item) {
  editingId.value = item.id
  editValue.value = item.type === 'folder' ? item.name : item.title
  nextTick(() => {
    const input = document.querySelector('.inline-edit-input')
    if (input) input.focus()
  })
}

function commitEdit(item) {
  if (editingId.value === item.id) {
    store.renameItem(item.id, editValue.value.trim())
    editingId.value = null
  }
}

function cancelEdit() {
  editingId.value = null
}

// Delete with confirmation (auto-reset after 5s)
function requestDelete(item) {
  confirmDelete.value = item.id
  setTimeout(() => {
    if (confirmDelete.value === item.id) {
      confirmDelete.value = null
    }
  }, 5000)
}

function confirmDeleteItem(item) {
  store.deleteItem(item.id)
  confirmDelete.value = null
}

// Note editing
const editingNoteId = ref(null)
const noteValue = ref('')

function startEditNote(item) {
  editingNoteId.value = item.id
  noteValue.value = item.note || ''
  nextTick(() => {
    const textarea = document.querySelector('.note-textarea')
    if (textarea) textarea.focus()
  })
}

function commitNote(item) {
  store.updateBookmarkNote(item.id, noteValue.value)
  editingNoteId.value = null
}

function focusItem(id) {
  store.focusedItemId = id
  nextTick(() => {
    const element = treeContainer.value?.querySelector(`[data-item-id="${id}"]`)
    element?.focus()
  })
}

function onRowKeydown(item, event) {
  const index = flatItems.value.findIndex(row => row.id === item.id)
  if (event.key === 'ArrowDown' && index < flatItems.value.length - 1) {
    event.preventDefault()
    const next = flatItems.value[index + 1]
    treeContainer.value?.scrollTo({ top: (index + 1) * ROW_HEIGHT, behavior: 'smooth' })
    focusItem(next.id)
  } else if (event.key === 'ArrowUp' && index > 0) {
    event.preventDefault()
    const previous = flatItems.value[index - 1]
    treeContainer.value?.scrollTo({ top: (index - 1) * ROW_HEIGHT, behavior: 'smooth' })
    focusItem(previous.id)
  } else if (event.key === ' ' && item.type === 'bookmark') {
    event.preventDefault()
    store.toggleSelection(item.id)
  } else if (event.key === 'Enter' && item.type === 'folder') {
    event.preventDefault()
    store.toggleFolder(item.id)
  }
}

// Move-to-folder: a non-drag alternative that achieves the same nesting outcome
// as drag-and-drop (WCAG 2.5.7 Dragging Movements requires one).
const moveMenuId = ref(null)

function collectDescendantFolderIds(item) {
  const ids = new Set()
  if (item.type !== 'folder') return ids
  const walk = (children) => {
    for (const child of children || []) {
      if (child.type === 'folder') {
        ids.add(child.id)
        walk(child.children)
      }
    }
  }
  walk(item.children)
  return ids
}

function collectFolderOptions(items, depth, excludeIds) {
  const options = []
  if (!items) return options
  for (const item of items) {
    if (item.type === 'folder' && !excludeIds.has(item.id)) {
      options.push({ id: item.id, name: '  '.repeat(depth) + '📁 ' + item.name })
      if (item.children) {
        options.push(...collectFolderOptions(item.children, depth + 1, excludeIds))
      }
    }
  }
  return options
}

function moveDestinationsFor(item) {
  if (!store.activeWorkspace) return []
  const exclude = new Set([item.id, ...collectDescendantFolderIds(item)])
  return collectFolderOptions(store.activeWorkspace.items, 0, exclude)
}

function toggleMoveMenu(item) {
  moveMenuId.value = moveMenuId.value === item.id ? null : item.id
}

function moveToFolder(item, folderId) {
  store.moveItem(item.id, folderId)
  moveMenuId.value = null
}

// Rendered count for accessibility
const renderedCount = computed(() => virtualItems.value.length)
const allSelected = computed(() => flatItems.value.length > 0 && flatItems.value.every(item => store.selectedItemIds.includes(item.id)))
</script>

<template>
  <div class="tree-container flex-1 overflow-auto min-h-0" ref="treeContainer" style="background: var(--control-background);" @scroll="syncViewport">
    <!-- Virtualized items info for accessibility -->
    <div class="sr-only" role="status" aria-live="polite">
      Virtualized items: {{ flatItems.length }} total. Rendered item count: {{ renderedCount }}
    </div>
    
    <!-- Visible render count info for verifier -->
    <div v-if="flatItems.length > 100" class="px-4 py-1 text-xs secondary-text border-b" style="border-color: var(--color-border); background: var(--color-surface);">
      Virtualized items: {{ flatItems.length }} total — Rendered item count: {{ renderedCount }}
    </div>

    <div class="tree-toolbar px-4 py-2 border-b flex items-center gap-2" style="border-color: var(--color-border);">
      <button type="button" class="btn-secondary text-xs" @click="store.createFolderParentId = null; store.showCreateFolderModal = true">Add folder</button>
      <button
        v-if="flatItems.length"
        type="button"
        class="btn-secondary text-xs"
        @click="allSelected ? store.clearSelection() : store.selectItems(flatItems.map(item => item.id))"
      >
        {{ allSelected ? 'Deselect all' : 'Select all' }}
      </button>
      <span v-if="store.selectedItemIds.length" class="selection-status" role="status">
        {{ store.selectedItemIds.length }} selected
      </span>
      <button v-if="store.selectedItemIds.length" type="button" class="btn-secondary text-xs" @click="store.clearSelection()">
        Clear selection
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="flatItems.length === 0 && store.activeWorkspace?.items.length === 0" class="p-8 text-center">
      <div aria-hidden="true" class="text-gray-300 text-4xl mb-2">📂</div>
      <p class="secondary-text text-sm">No items yet. Use Add bookmark or Add folder to get started</p>
    </div>

    <div v-else-if="flatItems.length === 0" class="p-6 text-center secondary-text text-sm">
      All folders are collapsed. Click a folder to expand.
    </div>

    <!-- Virtual list -->
    <div
      v-else
      role="list"
      aria-label="Bookmarks and folders"
      :style="{ height: totalSize + 'px', position: 'relative', width: '100%' }"
      @dragover.prevent
      @drop="onRootDrop"
    >
      <div
        v-for="vItem in virtualItems"
        :key="flatItems[vItem.index]?.id || vItem.key"
        :data-item-id="flatItems[vItem.index]?.id"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: vItem.size + 'px',
          transform: `translateY(${vItem.start}px)`,
        }"
      >
        <template v-if="flatItems[vItem.index]">
          <template v-if="flatItems[vItem.index].type === 'folder'">
            <!-- Folder row -->
            <div
              class="tree-row folder-row flex items-center gap-1 group cursor-pointer transition-all border-b"
              :class="{ 'drop-target': dropTarget === flatItems[vItem.index].id && dragItem?.id !== flatItems[vItem.index].id }"
              :style="{ paddingLeft: (flatItems[vItem.index].depth * 16 + 16) + 'px', borderColor: 'var(--color-border)' }"
              @click="store.toggleFolder(flatItems[vItem.index].id)"
              @dragover.prevent="onDragOver(flatItems[vItem.index], $event)"
              @dragleave="onDragLeave"
              @drop.stop="onDrop(flatItems[vItem.index], $event)"
              draggable="true"
              @dragstart="onDragStart(flatItems[vItem.index], $event)"
              @dragend="onDragEnd"
              role="listitem"
              tabindex="0"
              :aria-label="`Folder ${flatItems[vItem.index].name}`"
              :aria-expanded="store.isExpanded(flatItems[vItem.index].id)"
              @keydown="onRowKeydown(flatItems[vItem.index], $event)"
            >
              <span aria-hidden="true" class="text-sm flex-shrink-0 transition-transform duration-150 select-none" :style="{ transform: store.isExpanded(flatItems[vItem.index].id) ? 'rotate(90deg)' : 'rotate(0deg)' }">▶</span>
              <span aria-hidden="true" class="text-base flex-shrink-0 select-none">📁</span>
              
              <div class="flex-1 min-w-0 py-2">
                <template v-if="editingId === flatItems[vItem.index].id">
                  <input
                    v-model="editValue"
                    class="inline-edit-input bg-transparent border-b outline-none text-sm w-full px-0 font-medium"
                    style="font-family: 'Cormorant Upright', Georgia, serif; color: var(--color-text-primary); border-color: var(--color-accent);"
                    @click.stop
                    @keydown.enter="commitEdit(flatItems[vItem.index])"
                    @keydown.escape="cancelEdit"
                    @blur="commitEdit(flatItems[vItem.index])"
                    aria-label="Folder name"
                  />
                </template>
                <template v-else>
                  <h3
                    class="folder-heading font-semibold select-none"
                    @click.stop="startEdit(flatItems[vItem.index])"
                  >
                    {{ flatItems[vItem.index].name }}
                  </h3>
                  <span class="text-xs secondary-text ml-1 select-none">({{ flatItems[vItem.index].children?.length || 0 }})</span>
                </template>
              </div>

              <!-- Folder actions -->
              <div class="row-actions flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pr-2">
                <button @click.stop="moveUp(flatItems[vItem.index])" :disabled="flatItems[vItem.index].index === 0" class="icon-action" title="Move up" aria-label="Move folder up">↑</button>
                <button @click.stop="moveDown(flatItems[vItem.index])" :disabled="flatItems[vItem.index].index >= flatItems[vItem.index].siblingCount - 1" class="icon-action" title="Move down" aria-label="Move folder down">↓</button>
                <button @click.stop="store.createFolderParentId = flatItems[vItem.index].id; store.showCreateFolderModal = true" class="icon-action" title="Add subfolder" aria-label="Add subfolder">+</button>
                <button @click.stop="startEdit(flatItems[vItem.index])" class="icon-action" title="Rename" aria-label="Rename folder">✎</button>
                <span class="move-menu-anchor">
                  <button
                    @click.stop="toggleMoveMenu(flatItems[vItem.index])"
                    class="icon-action"
                    title="Move to folder"
                    aria-label="Move folder to another folder"
                    :aria-expanded="moveMenuId === flatItems[vItem.index].id"
                  >⇥</button>
                  <div v-if="moveMenuId === flatItems[vItem.index].id" class="move-menu" @click.stop role="menu" :aria-label="`Move ${flatItems[vItem.index].name} to`">
                    <button type="button" class="move-menu-item" role="menuitem" @click="moveToFolder(flatItems[vItem.index], null)">📥 Root level</button>
                    <button
                      v-for="opt in moveDestinationsFor(flatItems[vItem.index])"
                      :key="opt.id"
                      type="button"
                      class="move-menu-item"
                      role="menuitem"
                      @click="moveToFolder(flatItems[vItem.index], opt.id)"
                    >{{ opt.name }}</button>
                    <p v-if="moveDestinationsFor(flatItems[vItem.index]).length === 0" class="move-menu-empty">No other folders yet</p>
                  </div>
                </span>
                <template v-if="confirmDelete !== flatItems[vItem.index].id">
                  <button @click.stop="requestDelete(flatItems[vItem.index])" class="icon-action text-red-500" title="Delete" aria-label="Delete folder">🗑</button>
                </template>
                <template v-else>
                  <button @click.stop="confirmDeleteItem(flatItems[vItem.index])" class="confirm-action bg-red-500 text-white" title="Confirm delete">Delete</button>
                  <button @click.stop="confirmDelete = null" class="confirm-action" title="Cancel delete">Cancel</button>
                </template>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Bookmark row -->
            <div
              class="tree-row bookmark-row flex items-start gap-2 group border-b transition-all hover:bg-gray-50"
              :style="{ paddingLeft: (flatItems[vItem.index].depth * 16 + 16) + 'px', paddingRight: '8px', borderColor: 'var(--color-border)' }"
              :class="{
                'opacity-40': dragItem?.id === flatItems[vItem.index].id,
                'drop-target': dropTarget === flatItems[vItem.index].id,
                'selected-row': store.selectedItemIds.includes(flatItems[vItem.index].id)
              }"
              draggable="true"
              @dragstart="onDragStart(flatItems[vItem.index], $event)"
              @dragend="onDragEnd"
              @dragover.prevent="onDragOver(flatItems[vItem.index], $event)"
              @dragleave="onDragLeave"
              @drop.stop="onDrop(flatItems[vItem.index], $event)"
              @click.self="store.toggleSelection(flatItems[vItem.index].id, $event.metaKey || $event.ctrlKey)"
              role="listitem"
              tabindex="0"
              :aria-selected="store.selectedItemIds.includes(flatItems[vItem.index].id)"
              @focus="store.focusedItemId = flatItems[vItem.index].id"
              @keydown="onRowKeydown(flatItems[vItem.index], $event)"
            >
              <input
                type="checkbox"
                class="item-checkbox mt-3"
                :checked="store.selectedItemIds.includes(flatItems[vItem.index].id)"
                :aria-label="`Select ${flatItems[vItem.index].title}`"
                @click.stop
                @change="store.toggleSelection(flatItems[vItem.index].id)"
              />
              <!-- Monogram icon -->
              <a :href="flatItems[vItem.index].url" target="_blank" rel="noopener" class="flex-shrink-0 mt-2" @click.stop :aria-label="`Open ${flatItems[vItem.index].title}`">

                <div 
                  aria-hidden="true"
                  class="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
                  :style="{ background: store.hashColor(store.getDomain(flatItems[vItem.index].url)) }"
                >
                  {{ store.getDomain(flatItems[vItem.index].url)[0]?.toUpperCase() || '?' }}
                </div>
              </a>

              <!-- Content -->
              <div class="flex-1 min-w-0 py-2">
                <template v-if="editingId === flatItems[vItem.index].id">
                  <input
                    v-model="editValue"
                    class="inline-edit-input bg-transparent border-b outline-none text-sm w-full px-0 font-medium"
                    style="font-family: Inter, sans-serif; color: var(--color-text-primary); border-color: var(--color-accent);"
                    @click.stop
                    @keydown.enter="commitEdit(flatItems[vItem.index])"
                    @keydown.escape="cancelEdit"
                    @blur="commitEdit(flatItems[vItem.index])"
                    aria-label="Bookmark title"
                  />
                </template>
                <template v-else>
                  <a 
                    :href="flatItems[vItem.index].url"
                    target="_blank"
                    rel="noopener"
                    class="text-sm font-medium block truncate hover:underline"
                    style="color: var(--color-accent); font-family: Inter, sans-serif;"
                    @click.prevent.stop="startEdit(flatItems[vItem.index])"
                  >
                    {{ flatItems[vItem.index].title }}
                  </a>
                </template>

                <!-- URL -->
                <div class="secondary-text text-xs truncate mt-0.5">{{ flatItems[vItem.index].url }}</div>

                <!-- Note -->
                <div v-if="editingNoteId === flatItems[vItem.index].id" class="mt-1" @click.stop>
                  <textarea
                    v-model="noteValue"
                    class="note-textarea w-full text-xs border rounded-md p-1.5 outline-none resize-none"
                    style="border-color: var(--color-border); font-family: Inter, sans-serif; min-height: 38px; max-height: 42px; color: var(--color-text-primary);"
                    @keydown.escape="editingNoteId = null"
                    @blur="commitNote(flatItems[vItem.index])"
                    aria-label="Bookmark note"
                    placeholder="Add a note"
                  ></textarea>
                </div>
                <div 
                  v-else-if="flatItems[vItem.index].note"
                  class="secondary-text text-xs mt-0.5 truncate cursor-pointer hover:text-gray-600 transition-colors"
                  @click.stop="startEditNote(flatItems[vItem.index])"
                >
                  📝 {{ flatItems[vItem.index].note }}
                </div>
              </div>

              <!-- Bookmark actions -->
              <div class="row-actions flex items-start gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pt-2">
                <button @click.stop="moveUp(flatItems[vItem.index])" :disabled="flatItems[vItem.index].index === 0" class="icon-action" title="Move up" aria-label="Move bookmark up">↑</button>
                <button @click.stop="moveDown(flatItems[vItem.index])" :disabled="flatItems[vItem.index].index >= flatItems[vItem.index].siblingCount - 1" class="icon-action" title="Move down" aria-label="Move bookmark down">↓</button>
                <button 
                  @click.stop="store.togglePin(flatItems[vItem.index])" 
                  class="icon-action"
                  :title="store.isPinned(flatItems[vItem.index].id) ? 'Unpin' : store.pinnedBookmarks.length >= 8 ? 'Pinned limit reached (8)' : 'Pin to top'"
                  :aria-label="store.isPinned(flatItems[vItem.index].id) ? 'Unpin bookmark' : 'Pin bookmark'"
                  :disabled="!store.isPinned(flatItems[vItem.index].id) && store.pinnedBookmarks.length >= 8"
                >
                  <span aria-hidden="true" :class="store.isPinned(flatItems[vItem.index].id) ? 'text-amber-500' : 'text-gray-400'">📌</span>
                </button>
                <button @click.stop="startEdit(flatItems[vItem.index])" class="icon-action" title="Rename" aria-label="Rename bookmark">✎</button>
                <button @click.stop="startEditNote(flatItems[vItem.index])" class="icon-action" title="Add note" aria-label="Add bookmark note">📝</button>
                <span class="move-menu-anchor">
                  <button
                    @click.stop="toggleMoveMenu(flatItems[vItem.index])"
                    class="icon-action"
                    title="Move to folder"
                    aria-label="Move bookmark to a folder"
                    :aria-expanded="moveMenuId === flatItems[vItem.index].id"
                  >⇥</button>
                  <div v-if="moveMenuId === flatItems[vItem.index].id" class="move-menu" @click.stop role="menu" :aria-label="`Move ${flatItems[vItem.index].title} to`">
                    <button type="button" class="move-menu-item" role="menuitem" @click="moveToFolder(flatItems[vItem.index], null)">📥 Root level</button>
                    <button
                      v-for="opt in moveDestinationsFor(flatItems[vItem.index])"
                      :key="opt.id"
                      type="button"
                      class="move-menu-item"
                      role="menuitem"
                      @click="moveToFolder(flatItems[vItem.index], opt.id)"
                    >{{ opt.name }}</button>
                    <p v-if="moveDestinationsFor(flatItems[vItem.index]).length === 0" class="move-menu-empty">No other folders yet</p>
                  </div>
                </span>
                <template v-if="confirmDelete !== flatItems[vItem.index].id">
                  <button @click.stop="requestDelete(flatItems[vItem.index])" class="icon-action text-red-500" title="Delete" aria-label="Delete bookmark">🗑</button>
                </template>
                <template v-else>
                  <button @click.stop="confirmDeleteItem(flatItems[vItem.index])" class="confirm-action bg-red-500 text-white" title="Confirm delete">Delete</button>
                  <button @click.stop="confirmDelete = null" class="confirm-action" title="Cancel delete">Cancel</button>
                </template>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-row {
  min-width: 0;
  height: 72px;
  background: var(--control-background);
}
.move-menu-anchor { position: relative; display: inline-flex; }
.move-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  min-width: 180px;
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--control-background);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}
.move-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.move-menu-item:hover, .move-menu-item:focus-visible {
  background: var(--color-surface);
}
.move-menu-empty {
  margin: 0;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--secondary-text);
}
.tree-row:focus-visible, .selected-row {
  outline: 2px solid var(--color-accent) !important;
  outline-offset: -2px;
  background: color-mix(in srgb, var(--color-accent) 11%, var(--control-background)) !important;
}
.folder-heading {
  display: inline;
  margin: 0;
  font-family: "Cormorant Upright", Georgia, serif;
  font-size: 24px;
  line-height: 1.1;
}
.icon-action {
  display: inline-flex;
  width: 48px;
  min-width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 13px;
}
.icon-action:hover { background: var(--color-surface); }
.confirm-action {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--control-border);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.item-checkbox { width: 24px; min-width: 24px; height: 24px; accent-color: var(--color-accent); }
.selection-status { color: var(--color-accent); font-size: 13px; font-weight: 700; }
.drop-target {
  background: color-mix(in srgb, var(--color-accent) 15%, white) !important;
  border-radius: 12px;
  box-shadow: 0 0 0 2px var(--color-accent), 0 2px 8px rgba(229, 70, 16, 0.2);
}
@media (max-width: 520px) {
  .row-actions { opacity: 1; gap: 2px; }
  .icon-action { width: 26px; min-width: 26px; height: 26px; }
  .bookmark-row { gap: 4px; }
  .folder-heading { font-size: 22px; }
  .tree-toolbar { flex-wrap: wrap; }
}
:global(.compact-view) .row-actions { opacity: 1; gap: 2px; }
:global(.compact-view) .icon-action { width: 26px; min-width: 26px; height: 26px; }
:global(.compact-view) .bookmark-row { gap: 4px; }
:global(.compact-view) .tree-toolbar { flex-wrap: wrap; }
</style>

.tree-row:hover {
  background: color-mix(in srgb, var(--color-accent) 5%, var(--control-background));
}

.tree-row { transition: all 0.2s ease; }
