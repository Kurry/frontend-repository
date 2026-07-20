<script setup>
import { ref, computed } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const store = useSidedockStore()
const showAdvanced = ref(false)

const bookmarkSchema = toTypedSchema(z.object({
  url: z.string().min(1, 'Enter a URL to add a bookmark').refine((val) => {
    let fullUrl = val
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = 'https://' + fullUrl
    try {
      const u = new URL(fullUrl)
      return ['http:', 'https:'].includes(u.protocol) && (u.hostname === 'localhost' || u.hostname.includes('.'))
    } catch {
      return false
    }
  }, 'Enter a complete web address, such as https://example.com'),
  title: z.string().max(120, 'Title must be 120 characters or fewer').optional(),
  folder: z.string().nullable().optional()
}))

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: bookmarkSchema,
  initialValues: { url: '', title: '', folder: null }
})

const { value: url } = useField('url')
const { value: title } = useField('title')
const { value: selectedParentFolder } = useField('folder')

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

const onSubmit = handleSubmit((values) => {
  let fullUrl = values.url.trim()
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = 'https://' + fullUrl
  const result = store.createBookmark(fullUrl, values.title?.trim() || '', values.folder || null)
  if (result) {
    resetForm()
    showAdvanced.value = false
  }
})

async function handleImport(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    if (file.name.endsWith('.json')) {
      store.importPackage(text)
    } else {
      store.importBookmarks(text)
    }
  } catch {
    store.addToast('Import failed. Choose a valid file', 'error')
  } finally {
    event.target.value = ''
  }
}

const showExportMenu = ref(false)
const showImportMenu = ref(false)

</script>

<template>
  <div class="p-4 border-b" style="border-color: var(--color-border); background: white;">
    <form @submit="onSubmit" class="flex flex-col gap-2" novalidate>
      <div class="bookmark-fields">
        <label class="field-label url-field">
          <label for="bookmark-url">Bookmark URL</label>
          <input
            id="bookmark-url"
            v-model="url"
            type="url"
            inputmode="url"
            placeholder="https://example.com"
            class="input-styled text-sm"
            :aria-invalid="Boolean(errors.url)"
            aria-describedby="bookmark-url-help bookmark-url-error"
            required
          />
        </label>
        <label class="field-label title-field">
          <label for="bookmark-title">Title <small>(optional)</small></label>
          <input
            id="bookmark-title"
            v-model="title"
            type="text"
            placeholder="Bookmark title"
            class="input-styled text-sm"
            :aria-invalid="Boolean(errors.title)"
            aria-describedby="bookmark-title-error"
          />
        </label>
        <button type="submit" class="btn-primary text-sm flex-shrink-0" style="font-size: 13px;">
          Add bookmark
        </button>
      </div>
      <p id="bookmark-url-help" class="field-help">Include a complete address, such as https://example.com</p>
      <p v-if="errors.url" id="bookmark-url-error" class="field-error" role="alert">{{ errors.url }}</p>
      <p v-if="errors.title" id="bookmark-title-error" class="field-error" role="alert">{{ errors.title }}</p>
      
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
        <button type="button" @click="store.createFolderParentId = selectedParentFolder || null; store.showCreateFolderModal = true" class="btn-secondary text-xs">
          Add folder
        </button>
      </div>
    </form>

    <!-- Import/Export controls -->
    <div class="flex items-center gap-2 mt-2 pt-2 border-t" style="border-color: var(--color-border);">
      <div class="relative">
        <button type="button" @click="showImportMenu = !showImportMenu" class="btn-secondary text-xs inline-flex items-center" style="font-size: 12px; padding: 8px 12px;">
          Import
        </button>
        <div v-if="showImportMenu" class="absolute left-0 top-full mt-1 bg-white border rounded shadow-lg z-10 p-2 flex flex-col gap-2" style="border-color: var(--color-border);">
          <label for="file-import" class="btn-secondary text-xs cursor-pointer inline-flex items-center" style="font-size: 12px; padding: 4px 10px; white-space: nowrap;">
            Import bookmarks file
            <input
              id="file-import"
              type="file"
              accept=".html,.htm,.json"
              class="hidden"
              aria-label="Import bookmarks"
              @change="handleImport"
            />
          </label>
          <button type="button" @click="store.showImportPackageModal = true; showImportMenu = false" class="btn-secondary text-xs inline-flex items-center text-left" style="font-size: 12px; padding: 4px 10px; white-space: nowrap;">
            Import SideDock package
          </button>
        </div>
      </div>
      <div class="relative">
        <button type="button" @click="showExportMenu = !showExportMenu" class="btn-secondary text-xs inline-flex items-center" style="font-size: 12px; padding: 8px 12px;">
          Export
        </button>
        <div v-if="showExportMenu" class="absolute left-0 top-full mt-1 bg-white border rounded shadow-lg z-10 p-2 flex flex-col gap-2" style="border-color: var(--color-border);">
          <button type="button" @click="store.exportBookmarks('current'); showExportMenu = false" class="btn-secondary text-xs inline-flex items-center text-left" style="font-size: 12px; padding: 4px 10px; white-space: nowrap;">
            Export bookmarks
          </button>
          <button type="button" @click="store.exportBookmarks('all'); showExportMenu = false" class="btn-secondary text-xs inline-flex items-center text-left" style="font-size: 12px; padding: 4px 10px; white-space: nowrap;">
            Export all
          </button>
          <button type="button" @click="store.showExportPackageModal = true; showExportMenu = false" class="btn-secondary text-xs inline-flex items-center text-left" style="font-size: 12px; padding: 4px 10px; white-space: nowrap;">
            Export SideDock package
          </button>
        </div>
      </div>
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
