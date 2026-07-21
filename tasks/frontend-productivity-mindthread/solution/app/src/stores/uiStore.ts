import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ViewId = 'home' | 'today' | 'archived'

/**
 * Navigation / browse state shared by the visible nav controls and the WebMCP
 * browse tools. Both the on-screen Home/Today/Archived tabs, the thread cards,
 * the search field, and the tag filter chips mutate this single source of
 * truth through the actions below — so a WebMCP browse tool reaches the exact
 * same visible state a user reaches, never a separate path.
 */
export const useUiStore = defineStore('ui', () => {
  const currentView = ref<ViewId>("home")
  const openThreadId = ref<string | null>(null)
  const searchQuery = ref('')
  const activeTags = ref<string[]>([])

  function setView(view: ViewId) {
    currentView.value = view
  }

  function openThread(threadId: string) {
    currentView.value = 'home'
    setView('home')
    openThreadId.value = threadId
    searchQuery.value = ''
  }

  function closeThread() {
    openThreadId.value = null
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    if (query.trim()) {
      openThreadId.value = null
    }
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  function setActiveTags(tags: string[]) {
    activeTags.value = tags
  }

  function toggleTag(name: string) {
    activeTags.value = activeTags.value.includes(name)
      ? activeTags.value.filter(tag => tag !== name)
      : [...activeTags.value, name]
  }

  function clearFilters() {
    activeTags.value = []
  }

  return {
    currentView,
    openThreadId,
    searchQuery,
    activeTags,
    setView,
    openThread,
    closeThread,
    setSearchQuery,
    clearSearch,
    setActiveTags,
    toggleTag,
    clearFilters,
  }
})
