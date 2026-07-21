<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[min(100vw,36rem)] flex-col bg-surface p-4 shadow-xl sm:p-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        :aria-describedby="undefined"
      >
        <DialogTitle class="mb-4 font-heading text-xl font-bold text-ink">Export Workspace</DialogTitle>

        <TabsRoot v-model="activeTab" class="flex min-h-0 flex-1 flex-col">
          <TabsList class="mb-4 flex border-b border-linesoft">
            <TabsTrigger
              value="json"
              class="px-4 py-2 text-sm font-medium text-inksoft data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Workspace JSON
            </TabsTrigger>
            <TabsTrigger
              value="markdown"
              class="px-4 py-2 text-sm font-medium text-inksoft data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Today digest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" class="flex min-h-0 flex-1 flex-col">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-inksoft">mindthread-workspace-v1</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn-secondary" @click="wrapLines = !wrapLines">
                  {{ wrapLines ? 'No wrap' : 'Wrap lines' }}
                </button>
                <button type="button" class="btn-secondary" @click="copy(workspaceJson)">Copy</button>
                <button type="button" class="btn-primary-sm" @click="download(workspaceJson, 'workspace.json')">
                  Download
                </button>
              </div>
            </div>
            <textarea
              readonly
              class="min-h-0 flex-1 w-full resize-none rounded border border-linesoft bg-appbg p-4 font-mono text-sm"
              :class="wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'"
              :value="workspaceJson"
            ></textarea>
          </TabsContent>

          <TabsContent value="markdown" class="flex min-h-0 flex-1 flex-col">
            <div class="mb-2 flex flex-wrap justify-end gap-2">
              <button type="button" class="btn-secondary" @click="wrapLines = !wrapLines">
                {{ wrapLines ? 'No wrap' : 'Wrap lines' }}
              </button>
              <button type="button" class="btn-secondary" @click="copy(todayDigest)">Copy</button>
              <button type="button" class="btn-primary-sm" @click="download(todayDigest, 'digest.md')">
                Download
              </button>
            </div>
            <textarea
              readonly
              class="min-h-0 flex-1 w-full resize-none rounded border border-linesoft bg-appbg p-4 font-mono text-sm"
              :class="wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'"
              :value="todayDigest"
            ></textarea>
          </TabsContent>
        </TabsRoot>

        <DialogClose
          class="absolute right-4 top-4 text-inksoft transition-colors hover:text-ink focus-ring"
          aria-label="Close export drawer"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from 'reka-ui'
import { useSparkStore } from '../stores/sparkStore'
import { showToast } from '../utils/toast'
import { now, startOfDay, startOfNextDay } from '../utils/time'

const open = defineModel<boolean>('open', { default: false })

const store = useSparkStore()
const activeTab = ref('json')
const wrapLines = ref(true)

const workspaceJson = computed(() => JSON.stringify(store.buildWorkspaceExport(), null, 2))

const todayDigest = computed(() => {
  const dayStart = startOfDay(now.value)
  const dayEnd = startOfNextDay(now.value)
  const todaySparks = store.sparks
    .filter(spark => spark.createdAt >= dayStart && spark.createdAt < dayEnd)
    .sort((a, b) => a.createdAt - b.createdAt)

  if (todaySparks.length === 0) return 'No sparks captured yet today.'

  const groups = new Map<string, typeof todaySparks>()
  for (const spark of todaySparks) {
    const key = spark.threadId ?? '__unthreaded__'
    const bucket = groups.get(key) ?? []
    bucket.push(spark)
    groups.set(key, bucket)
  }

  let digest = "# Today's Digest\n\n"
  if (groups.has('__unthreaded__')) {
    digest += '## Unthreaded\n\n'
    for (const spark of groups.get('__unthreaded__')!) {
      digest += `- ${spark.text}\n`
    }
    digest += '\n'
  }
  for (const [threadId, threadSparks] of groups.entries()) {
    if (threadId === '__unthreaded__') continue
    const thread = store.getThread(threadId)
    digest += `## ${thread?.title ?? 'Thread'}\n\n`
    for (const spark of threadSparks) {
      digest += `- ${spark.text}\n`
    }
    digest += '\n'
  }
  return digest.trim()
})

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied export to clipboard', 'success')
  } catch {
    showToast('Failed to copy export', 'error')
  }
}

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  showToast(`Downloaded ${filename}`, 'success')
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-in-from-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

:deep([data-state='open'].animate-in) {
  animation-duration: 0.2s;
  animation-fill-mode: both;
}

:deep(.fade-in) {
  animation-name: fade-in;
}

:deep(.slide-in-from-right) {
  animation-name: slide-in-from-right;
}
</style>
