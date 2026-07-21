<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconCornerDownLeft from '~icons/lucide/corner-down-left'
import IconFileSearch from '~icons/lucide/file-search'
import IconLayout from '~icons/lucide/layout-dashboard'
import IconPackage from '~icons/lucide/package'
import IconSearch from '~icons/lucide/search'
import IconUser from '~icons/lucide/user-round'
import { contributors, useQcStore } from '../store'

const store = useQcStore()
const searchInput = ref(null)
const paletteEl = ref(null)

function fuzzy(query, text) {
  const q = query.toLowerCase().replace(/\s/g, '')
  const value = text.toLowerCase()
  let pos = 0
  for (const char of q) { pos = value.indexOf(char, pos); if (pos < 0) return false; pos++ }
  return true
}
const allResults = computed(() => [
  { type: 'view', label: 'Submission queue', meta: 'View', value: 'queue', icon: IconLayout },
  { type: 'view', label: 'Export center', meta: 'View', value: 'export', icon: IconPackage },
  ...store.submissions.map((s) => ({ type: 'submission', label: s.title, meta: `${s.id.toUpperCase()} · ${s.contributor_name}`, value: s.id, icon: IconFileSearch })),
  ...contributors.map((c) => ({ type: 'contributor', label: c.name, meta: `Contributor · ${c.role}`, value: c.name, icon: IconUser })),
])
const results = computed(() => {
  const query = store.palette.query.trim()
  return (query ? allResults.value.filter((item) => fuzzy(query, `${item.label} ${item.meta}`)) : allResults.value).slice(0, 10)
})

watch(() => store.palette.open, async (open) => {
  if (open) {
    if (!store.paletteOpener) store.paletteOpener = document.activeElement
    store.palette.query = ''
    store.palette.activeIndex = 0
    await nextTick()
    searchInput.value?.focus()
  } else {
    const opener = store.paletteOpener
    store.paletteOpener = null
    await nextTick()
    if (opener && typeof opener.focus === 'function') opener.focus()
  }
})
watch(() => store.palette.query, () => { store.palette.activeIndex = 0 })

function activate(item) {
  if (!item) return
  if (item.type === 'view') store.openView(item.value)
  if (item.type === 'submission') store.openSubmission(item.value)
  if (item.type === 'contributor') store.openContributor(item.value)
  store.palette.open = false
}
function keydown(event) {
  if (event.key === 'Tab') {
    const focusable = [...paletteEl.value.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled)
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    return
  }
  if (event.key === 'ArrowDown') { event.preventDefault(); store.palette.activeIndex = Math.min(store.palette.activeIndex + 1, results.value.length - 1) }
  if (event.key === 'ArrowUp') { event.preventDefault(); store.palette.activeIndex = Math.max(store.palette.activeIndex - 1, 0) }
  if (event.key === 'Enter') { event.preventDefault(); activate(results.value[store.palette.activeIndex]) }
  if (event.key === 'Escape') { event.preventDefault(); store.palette.open = false }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="palette-pop">
      <div v-if="store.palette.open" class="palette-overlay" @mousedown.self="store.palette.open = false">
    <section ref="paletteEl" class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" @keydown.capture="keydown" tabindex="-1" autofocus>
      <div class="palette-search"><IconSearch /><input ref="searchInput" v-model="store.palette.query" type="search" placeholder="Search submissions, contributors, or views…" aria-label="Search commands" @keydown.esc.prevent="store.palette.open = false" /><kbd>ESC</kbd></div>
      <div class="palette-body">
        <div class="palette-label">{{ store.palette.query ? 'Matching commands' : 'Quick navigation' }} <span>{{ results.length }}</span></div>
        <div v-if="results.length" class="palette-results" role="listbox" :aria-activedescendant="`palette-result-${store.palette.activeIndex}`">
          <button v-for="(item, index) in results" :id="`palette-result-${index}`" :key="`${item.type}-${item.value}`" :class="{ highlighted: index === store.palette.activeIndex }" role="option" :aria-selected="index === store.palette.activeIndex" @mouseenter="store.palette.activeIndex = index" @click="activate(item)">
            <span class="result-icon"><component :is="item.icon" /></span><span class="result-copy"><strong>{{ item.label }}</strong><small>{{ item.meta }}</small></span><IconArrowRight class="result-arrow" />
          </button>
        </div>
        <div v-else class="palette-empty"><IconSearch /><strong>No commands found</strong><span>Try a submission title, contributor, queue, or export.</span></div>
      </div>
      <footer class="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd><IconCornerDownLeft /></kbd> Open</span><span><kbd>ESC</kbd> Close</span></footer>
    </section>
      </div>
    </Transition>
  </Teleport>
</template>
