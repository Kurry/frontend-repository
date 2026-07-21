<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSidedockStore } from './stores/sidedock.js'
import WorkspaceTabs from './components/WorkspaceTabs.vue'
import AddBookmarkForm from './components/AddBookmarkForm.vue'
import BookmarkTree from './components/BookmarkTree.vue'
import PinnedBookmarks from './components/PinnedBookmarks.vue'
import SearchBar from './components/SearchBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import EmptyState from './components/EmptyState.vue'
import CreateWorkspaceModal from './components/CreateWorkspaceModal.vue'
import CreateFolderModal from './components/CreateFolderModal.vue'
import ImportPackageModal from './components/ImportPackageModal.vue'
import ExportPackageModal from './components/ExportPackageModal.vue'
import { NConfigProvider } from 'naive-ui'

const store = useSidedockStore()
const showSearchResults = ref(false)

watch(() => store.searchQuery, (q) => {
  showSearchResults.value = q.trim().length > 0
})

function onGlobalKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    document.getElementById('search-input')?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <n-config-provider :theme="store.darkMode ? null : null">
  <div class="app-shell h-screen min-h-0 flex flex-col" :class="{ 'dark-theme': store.darkMode }">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-border); background: var(--color-surface);">
      <h1 class="font-semibold tracking-tight" style="font-family: 'Cormorant Upright', Georgia, serif; font-size: 28px; color: var(--color-accent);">
        SideDock
      </h1>
      <div class="flex items-center gap-2">
        <button
          @click="store.toggleDarkMode()"
          class="btn-secondary text-sm"
          :aria-label="store.darkMode ? 'Use light theme' : 'Use dark theme'"
        >
          {{ store.darkMode ? 'Use light theme' : 'Use dark theme' }}
        </button>
        <button
          @click="store.toggleCompactMode()"
          class="sidebar-toggle px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all border min-h-[44px]"
          :class="store.compactMode ? 'border-transparent' : 'border-[var(--color-border)]'"
          :style="store.compactMode ? { background: 'var(--color-accent)', color: 'white' } : { background: 'white', color: 'var(--color-text-primary)' }"
          :aria-pressed="store.compactMode"
          title="Toggle sidebar view"
        >
          {{ store.compactMode ? 'Show full view' : 'Show sidebar view' }}
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div :class="store.compactMode ? 'compact-view max-w-[375px] w-full border-r overflow-x-hidden' : 'w-full'" class="flex-1 min-h-0 flex flex-col mx-auto transition-all duration-300 ease-in-out" style="border-color: var(--color-border); background: var(--color-background);">
      
      <!-- Empty State: No workspaces -->
      <EmptyState v-if="store.workspaces.length === 0" type="no-workspaces" />
      
      <!-- Workspace Content -->
      <div v-else class="flex flex-col flex-1 min-h-0">
        <!-- Search Bar -->
        <SearchBar />

        <!-- Search Results -->
        <div v-if="showSearchResults && store.searchResults.length > 0" class="px-4 py-3 border-b overflow-auto" style="border-color: var(--color-border); background: white;">
          <p class="secondary-text text-xs font-medium mb-2">
            {{ store.searchResults.length }} result{{ store.searchResults.length !== 1 ? 's' : '' }}
            <span v-if="store.searchScope === 'all'"> (all workspaces)</span>
            <span v-else> (current workspace)</span>
          </p>
          <div v-for="bm in store.searchResults" :key="bm.id" class="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              class="w-6 h-6"
              :checked="store.selectedItemIds.includes(bm.id)"
              :aria-label="`Select ${bm.title}`"
              @change="store.toggleSelection(bm.id)"
            />
            <a 
              :href="bm.url" 
              target="_blank" 
              rel="noopener"
              class="flex-shrink-0"
              :aria-label="`Open ${bm.title}`"
            >
              <div
                role="img"
                :aria-label="`Monogram icon for ${bm.title}`"
                class="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                :style="{ background: store.hashColor(store.getDomain(bm.url)) }"
              >
                {{ store.getDomain(bm.url)[0]?.toUpperCase() || '?' }}
              </div>
            </a>
            <div class="flex-1 min-w-0">
              <a :href="bm.url" target="_blank" rel="noopener" class="text-sm font-medium truncate hover:underline block" style="color: var(--color-accent);">{{ bm.title }}</a>
              <div class="secondary-text text-xs truncate">{{ bm.url }}</div>
            </div>
            <span v-if="store.searchScope === 'all'" class="secondary-text text-xs flex-shrink-0">{{ bm.workspaceName }}</span>
          </div>
        </div>
        <div v-else-if="showSearchResults && store.searchResults.length === 0" class="secondary-text px-4 py-6 text-center text-sm border-b" style="border-color: var(--color-border); background: var(--control-background);">
          No results found for "{{ store.searchQuery }}"
        </div>

        <!-- Workspace Tabs -->
        <div v-if="!showSearchResults" class="px-4 pt-3" style="background: var(--color-surface);">
          <WorkspaceTabs />
        </div>

        <!-- Active Workspace Content -->
        <div v-if="store.activeWorkspace && !showSearchResults" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Workspace Header with accent color -->
          <div class="px-4 py-2 text-xs font-medium flex items-center justify-between" :style="{ background: store.activeWorkspace.color + '20', color: store.activeWorkspace.color }">
            <h2 class="workspace-heading truncate">{{ store.activeWorkspace.name }}</h2>
            <span class="text-xs opacity-60">{{ store.activeWorkspace.items?.length || 0 }} items</span>
          </div>

          <!-- Add Bookmark Form -->
          <AddBookmarkForm />

          <!-- Pinned Bookmarks -->
          <PinnedBookmarks v-if="store.pinnedBookmarks.length > 0" />

          <!-- Bookmark Tree -->
          <BookmarkTree />

          <!-- Empty workspace state -->
          <div v-if="store.activeWorkspace && store.activeWorkspace.items.length === 0" class="flex-1 flex items-center justify-center p-8">
            <div class="text-center max-w-xs mx-auto">
              <div role="img" aria-label="Folder empty state" class="text-5xl mb-3 opacity-50">📂</div>
              <h3 class="text-base font-semibold mb-2" style="font-family: 'Cormorant Upright', Georgia, serif;">
                This workspace is empty
              </h3>
              <p class="secondary-text text-sm" style="font-family: Inter, sans-serif;">
                Use Add bookmark to create your first bookmark
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <ToastContainer />

    <div v-if="store.isBusy" class="loading-banner" role="status" aria-live="polite">Working…</div>

    <CreateWorkspaceModal />
    <CreateFolderModal />
    <ImportPackageModal />
    <ExportPackageModal />
  </div>
  </n-config-provider>
</template>

<style>
:root {
  --color-background: #FAF4F2;
  --color-surface: #EDE0DA;
  --color-text-primary: #1C1412;
  --color-accent: #E54610;
  --color-border: #E4DEDC;
  --control-border: #786B68;
  --control-background: #FFFFFF;
  --secondary-text: #574B48;
}

* { box-sizing: border-box; }
html, body, #app { margin: 0; padding: 0; min-width: 0; min-height: 100%; font-size: 15px; }
body, button, input, select, textarea {
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
}
p, span, div, label, a, li {
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
}
.app-shell {
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
}
.btn-primary, .btn-secondary {
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 15px;
}
.input-styled {
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 15px;
}
.compact-view {
  max-width: 375px;
  width: 100%;
  overflow-x: hidden;
}
.loading-banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  padding: 8px 16px;
  border-radius: 12px;
  background: var(--color-text-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
}
.dark-theme {
  --color-background: #181311;
  --color-surface: #2A211E;
  --color-text-primary: #FFF8F5;
  --color-accent: #FF784A;
  --color-border: #70615C;
  --control-border: #9B8983;
  --control-background: #241D1A;
  --secondary-text: #D8CBC7;
}
.secondary-text, .text-gray-400, .text-gray-500 { color: var(--secondary-text) !important; }
.workspace-heading {
  margin: 0;
  font-family: "Cormorant Upright", Georgia, serif;
  font-size: 24px;
  line-height: 1.1;
}
.dark-theme [style*="background: white"], .dark-theme .bg-white { background: var(--control-background) !important; }
.dark-theme input, .dark-theme select, .dark-theme textarea { color: var(--color-text-primary); background: var(--control-background); }
input, select, textarea { border-color: var(--control-border) !important; }
button:active, [role="button"]:active { transform: translateY(1px) scale(.98); filter: brightness(.9); }
button:disabled { opacity: .48; cursor: not-allowed !important; filter: grayscale(.25); }

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #ccc; }

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

/* Drag styles */
.dragging { opacity: 0.5; }

@media (max-width: 520px) {
  header { flex-wrap: wrap; gap: 8px; }
  header > div { flex-wrap: wrap; justify-content: flex-end; }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
