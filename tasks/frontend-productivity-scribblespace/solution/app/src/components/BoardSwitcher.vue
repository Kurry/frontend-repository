<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription
} from 'reka-ui'

const store = useAppStore()
const renameState = ref<{ id: string; name: string; error?: string } | null>(null)

const boardToDelete = computed(() => store.boards.find(b => b.id === store.boardDeleteId) || null)

const startRename = (board: any) => {
  renameState.value = { id: board.id, name: board.name, error: '' }
}

const confirmRename = () => {
  if (!renameState.value) return
  const { id, name } = renameState.value
  const trimmed = name.trim()

  if (trimmed.length === 0 || trimmed.length > 60) {
    renameState.value.error = 'board-name field must be 1 to 60 characters'
    store.announce('board-name field must be 1 to 60 characters')
    const b = store.boards.find(b => b.id === id)
    if (b) renameState.value.name = b.name
    return
  }

  store.renameBoard(id, trimmed)
  renameState.value = null
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    renameState.value = null
  } else if (e.key === 'Enter') {
    confirmRename()
  }
}
</script>

<template>
  <div class="flex items-center gap-1 overflow-x-auto min-w-0" role="tablist" aria-label="Boards">
    <div
      v-for="board in store.boards"
      :key="board.id"
      role="tab"
      :aria-selected="board.id === store.activeBoardId"
      class="flex items-center min-w-[120px] max-w-[200px] bg-white border border-gray-200 rounded-t-lg overflow-hidden shrink-0"
      :class="{'border-b-0 border-[#6D5BD0] shadow-sm z-10': board.id === store.activeBoardId}"
    >
      <div v-if="renameState?.id === board.id" class="flex flex-col w-full px-2 py-1">
        <input
          v-model="renameState.name"
          type="text"
          aria-label="Board name"
          aria-describedby="board-name-error"
          class="w-full text-sm border-b border-[#6D5BD0] outline-none"
          @keydown="handleKeyDown"
          @blur="confirmRename"
          autofocus
        />
        <span v-if="renameState.error" id="board-name-error" role="alert" class="text-xs text-red-600 mt-1">{{ renameState.error }}</span>
      </div>
      <button
        v-else
        type="button"
        class="flex-1 truncate px-3 py-1.5 text-sm text-left hover:bg-gray-50 outline-none focus:ring-2 focus:ring-inset focus:ring-[#6D5BD0]"
        :class="board.id === store.activeBoardId ? 'font-semibold text-gray-900' : 'text-gray-600'"
        @click="store.setActiveBoard(board.id)"
      >
        {{ board.name }}
      </button>

      <div class="flex items-center shrink-0 pr-1 gap-0.5">
        <button
          v-if="renameState?.id !== board.id"
          type="button"
          class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 outline-none focus:ring-2 focus:ring-[#6D5BD0]"
          aria-label="Rename board"
          @click="startRename(board)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button
          type="button"
          class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Delete board"
          @click="store.requestDeleteBoard(board.id)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="ml-1 p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 shrink-0 outline-none focus:ring-2 focus:ring-[#6D5BD0]"
      aria-label="New Board"
      @click="store.addBoard()"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>

    <DialogRoot :open="!!boardToDelete" @update:open="(open: boolean) => { if (!open) store.requestDeleteBoard(null) }">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/40 z-50" />
        <DialogContent class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[min(400px,calc(100vw-24px))] z-50" :trap-focus="true">
          <DialogTitle class="text-xl font-bold text-gray-900 mb-2">Delete board {{ boardToDelete?.name }}?</DialogTitle>
          <DialogDescription class="text-gray-600 mb-6">
            This deletes the board with everything on it. Another board opens in its place.
          </DialogDescription>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg px-4 py-2 text-sm"
              @click="store.requestDeleteBoard(null)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm"
              @click="store.deleteBoard()"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
