<script setup>
import { useSidedockStore } from '../stores/sidedock.js'

const props = defineProps({
  type: {
    type: String,
    required: true,
    // 'no-workspaces' | 'empty-workspace'
  }
})

const store = useSidedockStore()
</script>

<template>
  <!-- No workspaces -->
  <div v-if="type === 'no-workspaces'" class="flex-1 flex items-center justify-center p-8">
    <div class="text-center max-w-xs mx-auto">
      <div aria-hidden="true" class="text-6xl mb-4 opacity-60">🔖</div>
      <h2 class="text-xl font-semibold mb-2" style="font-family: 'Cormorant Upright', Georgia, serif;">
        Welcome to SideDock
      </h2>
      <p class="text-sm text-gray-500 mb-6" style="font-family: Inter, sans-serif;">
        Your personal bookmark manager. Create your first workspace to start organizing your links.
      </p>
      <button
        @click="store.createWorkspace('My workspace', '#E54610')"
        class="btn-primary text-sm"
      >
        Create workspace
      </button>
    </div>
  </div>

  <!-- Empty workspace -->
  <div v-else-if="type === 'empty-workspace'" class="flex-1 flex items-center justify-center p-8">
    <div class="text-center max-w-xs mx-auto">
      <div aria-hidden="true" class="text-5xl mb-3 opacity-50">📂</div>
      <h3 class="text-base font-semibold mb-2" style="font-family: 'Cormorant Upright', Georgia, serif;">
        This workspace is empty
      </h3>
      <p class="text-sm secondary-text" style="font-family: Inter, sans-serif;">
        Use Add bookmark to create your first bookmark
      </p>
    </div>
  </div>
</template>
