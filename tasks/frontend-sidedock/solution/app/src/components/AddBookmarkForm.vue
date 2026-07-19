<script setup>
import { ref, computed } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()
const url = ref('')
const title = ref('')
const showAdvanced = ref(false)
const selectedParentFolder = ref(null)
const urlError = ref('')

// Folder selection for nested add
function getFolderOptions(items, depth = 0) {
  const options = []
  if (!items) return options
  for (const item of items) {
    if (item.type === 'folder') {
      options.push({ id: item.id, name: '  '.repeat(depth) + '📁 ' + item.name, depth })
      if (item.children) {
        options.push(...getFolderOptions(item.children, depth + 1))
      }
    }
  }
  return options
}

const folderOptions = computed(() => {
  if (!store.activeWorkspace) return []
  return getFolderOptions(store.activeWorkspace.items)
})

function handleSubmit() {
  urlError.value = ''
  const trimmedUrl = url.value.trim()
  if (!trimmedUrl) {
    urlError.value = 'Enter a URL to add a bookmark'
    store.addToast('URL is required', 'warning')
    return
  }
  let fullUrl = trimmedUrl
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = 'https://' + fullUrl
  }
  if (!store.isValidUrl(fullUrl)) {
    urlError.value = 'Enter a complete web address, such as https://example.com'
    store.addToast('Enter a valid URL', 'warning')
    return
  }
  const parentId = selectedParentFolder.value || null
  const result = store.createBookmark(fullUrl, title.value.trim(), parentId)
  if (result) {
    url.value = ''
    title.value = ''
    selectedParentFolder.value = null
    showAdvanced.value = false
  }
}

async function handleImport(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  try {
    store.importBookmarks(await file.text())
  } catch {
    store.addToast('Import failed. Choose a bookmarks HTML file', 'error')
  } finally {
    event.target.value = ''
  }
}
</script>

<template>
  <div class="p-4 border-b" style="border-color: var(--color-border); background: white;">
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-2" novalidate>
      <div class="bookmark-fields">
        <label class="field-label url-field">
          <span>Bookmark URL</span>
          <input
            v-model="url"
            type="url"
            inputmode="url"
            placeholder="https://example.com"
            class="input-styled text-sm"
            :aria-invalid="Boolean(urlError)"
            aria-describedby="bookmark-url-help bookmark-url-error"
            required
            @input="urlError = ''"
          />
        </label>
        <label class="field-label title-field">
          <span>Title <small>(optional)</small></span>
          <input
            v-model="title"
            type="text"
            placeholder="Bookmark title"
            class="input-styled text-sm"
          />
        </label>
        <button type="submit" class="btn-primary text-sm flex-shrink-0" style="font-size: 13px;">
          Add bookmark
        </button>
      </div>
      <p id="bookmark-url-help" class="field-help">Include a complete address, such as https://example.com</p>
      <p v-if="urlError" id="bookmark-url-error" class="field-error" role="alert">{{ urlError }}</p>
      
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          class="text-xs cursor-pointer hover:underline"
          style="color: var(--color-accent);"
        >
          {{ showAdvanced ? 'Hide options' : 'Choose folder' }}
        </button>
        <span v-if="selectedParentFolder" class="text-xs text-gray-400">
          Adding to selected folder
        </span>
      </div>

      <div v-if="showAdvanced" class="folder-options">
        <label class="field-label">
          <span>Folder location</span>
          <select
            v-model="selectedParentFolder"
            class="input-styled text-sm"
          >
            <option :value="null">Root level</option>
            <option v-for="opt in folderOptions" :key="opt.id" :value="opt.id">
              {{ opt.name }}
            </option>
          </select>
        </label>
        <button type="button" @click="store.createFolder(selectedParentFolder)" class="btn-secondary text-xs">
          Add folder
        </button>
      </div>
    </form>

    <!-- Import/Export controls -->
    <div class="flex items-center gap-2 mt-2 pt-2 border-t" style="border-color: var(--color-border);">
      <label class="btn-secondary text-xs cursor-pointer inline-flex items-center" style="font-size: 12px; padding: 8px 12px;">
        Import bookmarks
        <input
          type="file"
          accept=".html,.htm"
          class="hidden"
          aria-label="Import bookmarks HTML"
          @change="handleImport"
        />
      </label>
      <button type="button" @click="store.exportBookmarks('current')" class="btn-secondary text-xs inline-flex items-center" style="font-size: 12px; padding: 4px 10px;">
        Export bookmarks
      </button>
      <button type="button" @click="store.exportBookmarks('all')" class="btn-secondary text-xs inline-flex items-center" style="font-size: 12px; padding: 4px 10px;">
        Export all
      </button>
      <div class="flex-1"></div>
      <button type="button" @click="store.load10000Items()" class="btn-secondary text-xs inline-flex items-center" style="font-size: 11px; padding: 4px 8px; color: var(--color-accent);">
        Load 10,000 items
      </button>
    </div>
  </div>
</template>

<style scoped>
.bookmark-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(130px, 180px) auto;
  align-items: end;
  gap: 8px;
}
.field-label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 600;
}
.field-label small { color: var(--secondary-text); font-weight: 400; }
.field-label input, .field-label select { width: 100%; min-width: 0; }
.field-help { margin: 0; color: var(--secondary-text); font-size: 12px; }
.field-error { margin: 0; color: #B42318; font-size: 13px; font-weight: 600; }
.folder-options { display: flex; align-items: end; gap: 8px; }
.folder-options .field-label { flex: 1; }
@media (max-width: 520px) {
  .bookmark-fields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .bookmark-fields button { grid-column: 1 / -1; width: 100%; min-height: 44px; }
  .folder-options { align-items: stretch; flex-direction: column; }
  .border-t { flex-wrap: wrap; }
}
:global(.compact-view) .bookmark-fields {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
:global(.compact-view) .bookmark-fields button {
  grid-column: 1 / -1;
  width: 100%;
  min-height: 44px;
}
:global(.compact-view) .border-t { flex-wrap: wrap; }
:global(.compact-view) .folder-options { align-items: stretch; flex-direction: column; }
@media (max-width: 340px) {
  .bookmark-fields { grid-template-columns: 1fr; }
  .bookmark-fields button { grid-column: auto; }
}
</style>
