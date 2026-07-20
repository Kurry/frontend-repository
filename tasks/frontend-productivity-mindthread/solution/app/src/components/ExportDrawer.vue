<template>
  <DialogRoot :open="isOpen" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40" />
      <DialogContent
        class="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-surface p-6 shadow-xl"
        :aria-describedby="undefined"
      >
        <DialogTitle class="font-heading text-xl font-bold text-ink mb-4">Export Workspace</DialogTitle>

        <TabsRoot v-model="activeTab" class="flex flex-col h-[calc(100%-80px)]">
          <TabsList class="flex border-b border-linesoft mb-4">
            <TabsTrigger
              value="json"
              class="px-4 py-2 font-medium text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-inksoft"
            >
              Workspace JSON
            </TabsTrigger>
            <TabsTrigger
              value="markdown"
              class="px-4 py-2 font-medium text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-inksoft"
            >
              Today digest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" class="flex-1 flex flex-col min-h-0">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-inksoft">mindthread-workspace-v1</span>
              <div class="flex gap-2">
                <button @click="copy(workspaceJson)" class="btn-secondary">Copy</button>
                <button @click="download(workspaceJson, 'workspace.json')" class="btn-primary-sm">Download</button>
              </div>
            </div>
            <textarea
              readonly
              class="flex-1 w-full font-mono text-sm p-4 bg-appbg border border-linesoft rounded resize-none"
              :value="workspaceJson"
            ></textarea>
          </TabsContent>

          <TabsContent value="markdown" class="flex-1 flex flex-col min-h-0">
            <div class="flex justify-end mb-2">
              <div class="flex gap-2">
                <button @click="copy(todayDigest)" class="btn-secondary">Copy</button>
                <button @click="download(todayDigest, 'digest.md')" class="btn-primary-sm">Download</button>
              </div>
            </div>
            <textarea
              readonly
              class="flex-1 w-full font-mono text-sm p-4 bg-appbg border border-linesoft rounded resize-none"
              :value="todayDigest"
            ></textarea>
          </TabsContent>
        </TabsRoot>

        <DialogClose class="absolute top-4 right-4 text-inksoft hover:text-ink">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose,
  TabsRoot, TabsList, TabsTrigger, TabsContent
} from 'reka-ui'
import { useSparkStore } from '../stores/sparkStore'
import { showToast } from '../utils/toast'
import { formatTimestamp, startOfDay, startOfNextDay, now } from '../utils/time'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'update:open', val: boolean): void }>()

const store = useSparkStore()
const activeTab = ref('json')

const workspaceJson = computed(() => {
  return JSON.stringify({
    schemaVersion: 'mindthread-workspace-v1',
    exportedAt: new Date().toISOString(),
    sparks: store.sparks,
    threads: store.threads,
    reflections: store.reflections
  }, null, 2)
})

const todayDigest = computed(() => {
  const dayStart = startOfDay(now.value)
  const dayEnd = startOfNextDay(now.value)
  const todaySparks = store.sparks
    .filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd)
    .sort((a, b) => a.createdAt - b.createdAt)

  if (todaySparks.length === 0) return 'No sparks captured yet today.'

  let digest = `# Today's Digest\n\n`
  for (const spark of todaySparks) {
    digest += `- ${spark.text}\n`
    if (spark.tags.length > 0) {
      digest += `  Tags: ${spark.tags.map(t => `#${t}`).join(', ')}\n`
    }
    const reflections = store.reflections.filter(r => r.sparkId === spark.id)
    if (reflections.length > 0) {
      for (const r of reflections) {
        digest += `  > ${r.text}\n`
      }
    }
    digest += '\n'
  }
  return digest
})

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard', 'success')
  } catch (err) {
    showToast('Failed to copy', 'error')
  }
}

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>
