<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../store'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent
} from 'reka-ui'
import { useMediaQuery } from '@vueuse/core'

const store = useAppStore()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const activeTab = ref<'export' | 'import'>('export')
watch(() => store.showExport, (open) => {
  if (open) activeTab.value = store.exportModalTab
})

const motionConfigOverlay = computed(() => {
  if (prefersReducedMotion.value) return undefined;
  return {
    initial: { opacity: 0 },
    enter: { opacity: 1, transition: { duration: 150 } },
    leave: { opacity: 0, transition: { duration: 150 } }
  }
})

const motionConfigContent = computed(() => {
  if (prefersReducedMotion.value) return undefined;
  return {
    initial: { opacity: 0, scale: 0.95, y: '-50%', x: '-50%' },
    enter: { opacity: 1, scale: 1, y: '-50%', x: '-50%', transition: { type: 'spring', stiffness: 300, damping: 25 } },
    leave: { opacity: 0, scale: 0.95, y: '-50%', x: '-50%', transition: { duration: 150 } }
  }
})

const workspaceJson = computed(() => {
  return {
    schemaVersion: 'scribblespace-workspace-v1',
    exportedAt: new Date().toISOString(),
    activeBoardId: store.activeBoardId,
    boards: store.boards
  }
})

const jsonText = computed(() => JSON.stringify(workspaceJson.value, null, 2))

const markdownText = computed(() => {
  let lines: string[] = [`# ScribbleSpace Workspace\n`]
  for (const b of store.boards) {
    lines.push(`## ${b.name}`)
    for (const o of b.objects) {
      if (o.type === 'note') {
        const txt = (o.text || '').replace(/<[^>]*>?/gm, '')
        lines.push(`- **Note**: ${txt || '(empty)'}`)
      } else if (o.type === 'flashcard') {
        const front = (o.front || '').replace(/<[^>]*>?/gm, '')
        const back = (o.back || '').replace(/<[^>]*>?/gm, '')
        lines.push(`- **Flashcard**: Front: ${front || '(empty)'} | Back: ${back || '(empty)'}`)
      } else {
        lines.push(`- **Shape**: ${o.type}`)
      }
    }
    lines.push('')
  }
  return lines.join('\n')
})

const plainText = computed(() => {
  let lines: string[] = []
  for (const b of store.boards) {
    lines.push(`BOARD: ${b.name}`)
    lines.push(`OBJECTS: ${b.objects.length}`)
    b.objects.forEach((o, idx) => {
      if (o.type === 'note') {
        const txt = (o.text || '').replace(/<[^>]*>?/gm, '')
        lines.push(`${idx + 1}. Note: ${txt || '(empty)'}`)
      } else if (o.type === 'flashcard') {
        const front = (o.front || '').replace(/<[^>]*>?/gm, '')
        const back = (o.back || '').replace(/<[^>]*>?/gm, '')
        lines.push(`${idx + 1}. Flashcard (${o.flipped ? 'Back' : 'Front'}): Front: ${front || '(empty)'} | Back: ${back || '(empty)'}`)
      } else {
        lines.push(`${idx + 1}. Shape: ${o.type}`)
      }
    })
    if (b.connectors.length > 0) {
      lines.push('CONNECTORS:')
      b.connectors.forEach(c => {
        lines.push(`- ${c.fromId} -> ${c.toId}`)
      })
    }
    lines.push('')
  }
  return lines.join('\n')
})

// Which format tab is active in the Export panel, and the copy/download
// payload that goes with it. Keeping this centralized means every tab's
// Copy/Download buttons stay correct, not just the JSON tab's.
const exportFormatTab = ref<'json' | 'md' | 'text'>('json')

const exportFormats = computed(() => ({
  json: {
    text: jsonText.value,
    filename: 'workspace.json',
    mime: 'application/json',
    copyLabel: 'Copy JSON',
    downloadLabel: 'Download Workspace JSON',
  },
  md: {
    text: markdownText.value,
    filename: 'workspace.md',
    mime: 'text/markdown',
    copyLabel: 'Copy Markdown',
    downloadLabel: 'Download Markdown',
  },
  text: {
    text: plainText.value,
    filename: 'workspace.txt',
    mime: 'text/plain',
    copyLabel: 'Copy Plain Text',
    downloadLabel: 'Download Plain Text',
  },
}))

const activeExportFormat = computed(() => exportFormats.value[exportFormatTab.value])

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    store.announce('Copied to clipboard')
  }).catch(() => {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    store.announce('Copied to clipboard (fallback)')
  })
}

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  store.announce(`Downloaded ${filename}`)
}

const handleCancel = () => {
  store.setShowExport(false)
}

const importText = ref('')
const importError = ref('')

const NOTE_COLOR_SET = new Set(['#FFF9C4', '#FFE0B2', '#FFCDD2', '#C8E6C9', '#BBDEFB', '#E1BEE7'])
const SHAPE_COLOR_SET = new Set(['#6D5BD0', '#E0A030', '#3F9E6E', '#D95563', '#3E7CB1', '#5A5F73'])
const VALID_TYPES = new Set(['note', 'flashcard', 'rectangle', 'circle', 'arrow'])

const validateWorkspace = (data: any): string | null => {
  if (!data || typeof data !== 'object') return 'Invalid JSON format'
  if (data.schemaVersion !== 'scribblespace-workspace-v1') return 'schemaVersion field must be scribblespace-workspace-v1'
  if (!Array.isArray(data.boards)) return 'boards field is required'
  if (!data.activeBoardId || typeof data.activeBoardId !== 'string') return 'activeBoardId field is required'
  if (!data.boards.some((b: any) => b.id === data.activeBoardId)) return 'activeBoardId must reference a board in boards'
  for (const board of data.boards) {
    if (!board.id || typeof board.id !== 'string') return 'board id field is required'
    const name = String(board.name ?? '').trim()
    if (!name || name.length > 60) return 'board-name field must be 1 to 60 characters'
    if (!Array.isArray(board.objects)) return 'objects field is required on each board'
    if (!Array.isArray(board.connectors)) return 'connectors field is required on each board'
    const ids = new Set(board.objects.map((o: any) => o.id))
    for (const obj of board.objects) {
      if (!VALID_TYPES.has(obj.type)) return 'type field must be note, flashcard, rectangle, circle, or arrow'
      if (obj.type === 'note' || obj.type === 'flashcard') {
        if (!NOTE_COLOR_SET.has(String(obj.color || '').toUpperCase())) return 'color field must be a valid note/flashcard swatch'
        if (obj.width < 120 || obj.height < 96) return 'width/height fields must meet note/flashcard minima (120 x 96)'
        const textField = obj.type === 'note' ? obj.text : (obj.front ?? obj.back)
        if (String(textField ?? '').length > 8000) return `${obj.type === 'note' ? 'text' : 'front/back'} field exceeds 8000 characters`
      } else {
        if (!SHAPE_COLOR_SET.has(String(obj.color || '').toUpperCase())) return 'color field must be a valid shape swatch'
        if (obj.width < 48 || obj.height < 48) return 'width/height fields must meet shape minima (48 x 48)'
      }
    }
    for (const conn of board.connectors) {
      if (!conn.fromId || !conn.toId) return 'connector fromId/toId fields are required'
      if (conn.fromId === conn.toId) return 'connector fromId and toId must be distinct'
      if (!ids.has(conn.fromId) || !ids.has(conn.toId)) return 'connector endpoints must resolve to objects on the same board'
    }
  }
  return null
}

const doImport = () => {
  try {
    const data = JSON.parse(importText.value)
    const err = validateWorkspace(data)
    if (err) {
      importError.value = err
      return
    }
    store.setFullState(data)
    store.setShowExport(false)
    importError.value = ''
    importText.value = ''
  } catch {
    importError.value = 'Invalid JSON format'
  }
}
</script>

<template>
  <DialogRoot :open="store.showExport" @update:open="store.setShowExport($event)">
    <DialogPortal>
      <DialogOverlay v-motion="motionConfigOverlay" class="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300" />
      <DialogContent
        v-motion="motionConfigContent"
        class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[min(800px,calc(100vw-24px))] h-[min(600px,calc(100vh-48px))] flex flex-col z-50"
        :trap-focus="true"
      >
        <div class="flex items-center justify-between mb-4 shrink-0">
           <DialogTitle class="text-xl font-bold text-gray-900 m-0">Workspace Options</DialogTitle>
           <DialogClose as-child>
             <button type="button" aria-label="Close" class="text-gray-400 hover:text-gray-700 outline-none focus:ring-2 focus:ring-[#6D5BD0] rounded p-1" @click="handleCancel">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
           </DialogClose>
        </div>

        <TabsRoot v-model="activeTab" class="flex flex-col h-full min-h-0">
           <TabsList class="flex gap-4 border-b border-gray-200 shrink-0">
             <TabsTrigger value="export" class="px-2 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900 data-[state=active]:border-[#6D5BD0] data-[state=active]:text-[#6D5BD0] outline-none">Export</TabsTrigger>
             <TabsTrigger value="import" class="px-2 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900 data-[state=active]:border-[#6D5BD0] data-[state=active]:text-[#6D5BD0] outline-none">Import</TabsTrigger>
           </TabsList>

           <TabsContent value="export" class="flex-1 flex flex-col pt-4 min-h-0 outline-none">
              <TabsRoot v-model="exportFormatTab" class="flex flex-col h-full min-h-0">
                 <TabsList class="flex gap-2 shrink-0 mb-2">
                    <TabsTrigger value="json" class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-100 data-[state=active]:bg-[#F3F0FF] data-[state=active]:text-[#6D5BD0]">Workspace JSON</TabsTrigger>
                    <TabsTrigger value="md" class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-100 data-[state=active]:bg-[#F3F0FF] data-[state=active]:text-[#6D5BD0]">Markdown</TabsTrigger>
                    <TabsTrigger value="text" class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-100 data-[state=active]:bg-[#F3F0FF] data-[state=active]:text-[#6D5BD0]">Plain Text</TabsTrigger>
                 </TabsList>

                 <div class="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex">
                    <TabsContent value="json" class="flex-1 w-full h-full outline-none">
                       <textarea readonly class="w-full h-full p-4 font-mono text-sm resize-none bg-transparent outline-none text-gray-800" :value="jsonText"></textarea>
                    </TabsContent>
                    <TabsContent value="md" class="flex-1 w-full h-full outline-none">
                       <textarea readonly class="w-full h-full p-4 font-mono text-sm resize-none bg-transparent outline-none text-gray-800" :value="markdownText"></textarea>
                    </TabsContent>
                    <TabsContent value="text" class="flex-1 w-full h-full outline-none">
                       <textarea readonly class="w-full h-full p-4 font-mono text-sm resize-none bg-transparent outline-none text-gray-800" :value="plainText"></textarea>
                    </TabsContent>
                 </div>

                 <div class="flex justify-end gap-3 mt-4 shrink-0">
                    <button type="button" class="btn-cancel" @click="copyToClipboard(activeExportFormat.text)">{{ activeExportFormat.copyLabel }}</button>
                    <button type="button" class="btn-primary" @click="downloadFile(activeExportFormat.text, activeExportFormat.filename, activeExportFormat.mime)">{{ activeExportFormat.downloadLabel }}</button>
                 </div>
              </TabsRoot>
           </TabsContent>

           <TabsContent value="import" class="flex-1 flex flex-col pt-4 min-h-0 outline-none">
              <p class="text-sm text-gray-600 mb-2">Paste a valid Workspace JSON package below to restore a previous session.</p>
              <label for="import-workspace-json" class="sr-only">Workspace JSON</label>
              <textarea id="import-workspace-json" v-model="importText" aria-label="Import Workspace JSON" aria-describedby="import-error" class="flex-1 w-full p-4 font-mono text-sm resize-none border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6D5BD0] text-gray-800" placeholder='{"schemaVersion": "scribblespace-workspace-v1", ...}'></textarea>
              <div v-if="importError" id="import-error" role="alert" aria-live="polite" class="text-red-600 text-sm mt-2 font-medium">{{ importError }}</div>

              <div class="flex justify-end gap-3 mt-4 shrink-0">
                 <button type="button" class="btn-primary" @click="doImport" :disabled="!importText.trim()">Import workspace</button>
              </div>
           </TabsContent>
        </TabsRoot>

      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
@reference "../index.css";
.btn-cancel {
  @apply bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg px-4 py-2 text-sm;
}
.btn-primary {
  @apply bg-[#6D5BD0] hover:bg-[#5A4AB8] text-white font-medium rounded-lg px-4 py-2 text-sm disabled:opacity-50;
}
</style>
