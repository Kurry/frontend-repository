import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'sidedock-data'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function deriveTitleFromUrl(url) {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/^\//, '').replace(/\/$/, '')
    if (path) return path
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function getDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function hashColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 68%, 30%)`
}

function isValidUrl(str) {
  try {
    const url = new URL(str)
    return ['http:', 'https:'].includes(url.protocol)
      && (url.hostname === 'localhost' || url.hostname.includes('.'))
  } catch {
    return false
  }
}

function loadState() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveState(state) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {}
}

export const useSidedockStore = defineStore('sidedock', () => {
  // State
  const workspaces = ref([])
  const activeWorkspaceId = ref(null)
  const expandedFolders = ref({})
  const compactMode = ref(false)
  const darkMode = ref(false)
  const searchQuery = ref('')
  const searchScope = ref('current') // 'current' | 'all'
  const pinnedBookmarks = ref([])
  const toasts = ref([])
  const selectedItemIds = ref([])
  const focusedItemId = ref(null)

  // Computed
  const activeWorkspace = computed(() => 
    workspaces.value.find(w => w.id === activeWorkspaceId.value) || null
  )

  const allBookmarks = computed(() => {
    const all = []
    const collect = (items, ws) => {
      if (!items) return
      for (const item of items) {
        if (item.type === 'bookmark') {
          all.push({ ...item, workspaceId: ws.id, workspaceName: ws.name })
        } else if (item.type === 'folder') {
          collect(item.children || [], ws)
        }
      }
    }
    for (const ws of workspaces.value) {
      collect(ws.items || [], ws)
    }
    return all
  })

  const searchResults = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    const source = searchScope.value === 'current' && activeWorkspace.value
      ? allBookmarks.value.filter(b => b.workspaceId === activeWorkspaceId.value)
      : allBookmarks.value
    return source.filter(b => 
      (b.title || '').toLowerCase().includes(q) || 
      (b.url || '').toLowerCase().includes(q)
    )
  })

  // Toast helper
  function addToast(message, type = 'info') {
    const id = generateId()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 2500)
  }

  // Collect all bookmark IDs in a folder tree
  function collectBookmarkIds(items) {
    const ids = []
    if (!items) return ids
    for (const item of items) {
      if (item.type === 'bookmark') ids.push(item.id)
      else if (item.type === 'folder') ids.push(...collectBookmarkIds(item.children || []))
    }
    return ids
  }

  // Remove pinned bookmarks by IDs
  function removePins(ids) {
    if (ids.length > 0) {
      pinnedBookmarks.value = pinnedBookmarks.value.filter(p => !ids.includes(p.id))
    }
  }

  // Persistence watcher
  watch(
    [workspaces, activeWorkspaceId, expandedFolders, compactMode, darkMode, pinnedBookmarks],
    () => {
      saveState({
        workspaces: workspaces.value,
        activeWorkspaceId: activeWorkspaceId.value,
        expandedFolders: expandedFolders.value,
        compactMode: compactMode.value,
        darkMode: darkMode.value,
        pinnedBookmarks: pinnedBookmarks.value,
      })
    },
    { deep: true }
  )

  // Load state on init
  const saved = loadState()
  if (saved) {
    workspaces.value = saved.workspaces || []
    activeWorkspaceId.value = saved.activeWorkspaceId || null
    expandedFolders.value = saved.expandedFolders || {}
    compactMode.value = saved.compactMode || false
    darkMode.value = saved.darkMode || false
    pinnedBookmarks.value = saved.pinnedBookmarks || []
  }

  // Workspace operations
  function createWorkspace(name, color) {
    const ws = {
      id: generateId(),
      name: name || 'New workspace',
      color: color || '#E54610',
      items: [],
    }
    workspaces.value.push(ws)
    activeWorkspaceId.value = ws.id
    addToast(`Workspace "${ws.name}" created`, 'success')
    return ws
  }

  function renameWorkspace(id, newName) {
    const ws = workspaces.value.find(w => w.id === id)
    if (ws) {
      ws.name = newName || 'Untitled'
    }
  }

  function deleteWorkspace(id) {
    const idx = workspaces.value.findIndex(w => w.id === id)
    if (idx < 0) return
    const ws = workspaces.value[idx]
    // Remove pinned bookmarks from this workspace
    const wsBookmarkIds = collectBookmarkIds(ws.items || [])
    removePins(wsBookmarkIds)
    selectedItemIds.value = selectedItemIds.value.filter(id => !wsBookmarkIds.includes(id))
    
    workspaces.value.splice(idx, 1)
    if (activeWorkspaceId.value === id) {
      activeWorkspaceId.value = workspaces.value[0]?.id || null
    }
    addToast(`Workspace "${ws.name}" deleted`, 'info')
  }

  function setWorkspaceColor(id, color) {
    const ws = workspaces.value.find(w => w.id === id)
    if (ws && color) ws.color = color
  }

  // Find item and its parent
  function findItemContext(id, items, parent = null, list = null) {
    if (!items) return null
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.id === id) {
        return { item, parent, list: items, index: i }
      }
      if (item.type === 'folder' && item.children) {
        const found = findItemContext(id, item.children, item, item.children)
        if (found) return found
      }
    }
    return null
  }

  function findItemById(id, items) {
    if (!items) return null
    for (const item of items) {
      if (item.id === id) return item
      if (item.type === 'folder' && item.children) {
        const found = findItemById(id, item.children)
        if (found) return found
      }
    }
    return null
  }

  // Folder operations
  function createFolder(parentId = null) {
    if (!activeWorkspace.value) return null
    const folder = {
      id: generateId(),
      type: 'folder',
      name: 'New folder',
      children: [],
    }
    if (parentId) {
      const parent = findItemById(parentId, activeWorkspace.value.items)
      if (parent && parent.type === 'folder') {
        parent.children = parent.children || []
        parent.children.push(folder)
        expandedFolders.value[parentId] = true
      }
    } else {
      activeWorkspace.value.items.push(folder)
    }
    addToast('Folder created', 'success')
    return folder
  }

  function renameItem(id, newName) {
    const item = findItemById(id, activeWorkspace.value?.items)
    if (item) {
      if (item.type === 'folder') item.name = newName || 'Untitled'
      else item.title = newName || 'Untitled'
      const pin = pinnedBookmarks.value.find(p => p.id === id)
      if (pin && item.type === 'bookmark') pin.title = item.title
    }
  }

  function deleteItem(id) {
    if (!activeWorkspace.value) return
    
    // Find item in the workspace tree
    const ctx = findItemContext(id, activeWorkspace.value.items)
    if (!ctx || !ctx.list) return
    
    const item = ctx.item
    // Remove pins for this item and children
    if (item.type === 'folder') {
      const bookmarkIds = collectBookmarkIds(item.children || [])
      bookmarkIds.push(id) // folder id itself won't match but just in case
      removePins(bookmarkIds)
      selectedItemIds.value = selectedItemIds.value.filter(selectedId => !bookmarkIds.includes(selectedId))
    } else {
      removePins([id])
    }
    
    // Remove from list
    if (ctx.index >= 0) {
      ctx.list.splice(ctx.index, 1)
    }
    selectedItemIds.value = selectedItemIds.value.filter(selectedId => selectedId !== id)
    addToast('Item deleted', 'info')
  }

  // Bookmark operations
  function createBookmark(url, title, parentId = null) {
    if (!activeWorkspace.value) return null
    if (!url || !isValidUrl(url)) return null
    
    // Check for duplicate URL in same location
    let items
    if (parentId) {
      const parent = findItemById(parentId, activeWorkspace.value.items)
      items = parent ? (parent.children || []) : null
    } else {
      items = activeWorkspace.value.items
    }
    if (items) {
      const dup = items.find(i => i.type === 'bookmark' && i.url === url)
      if (dup) {
        addToast('Bookmark already exists at this location', 'warning')
        return dup
      }
    }

    const bookmark = {
      id: generateId(),
      type: 'bookmark',
      url: url,
      title: title || deriveTitleFromUrl(url),
      note: '',
      createdAt: Date.now(),
    }
    if (parentId) {
      const parent = findItemById(parentId, activeWorkspace.value.items)
      if (parent && parent.type === 'folder') {
        parent.children = parent.children || []
        parent.children.push(bookmark)
        expandedFolders.value[parentId] = true
      }
    } else {
      activeWorkspace.value.items.push(bookmark)
    }
    addToast('Bookmark added', 'success')
    return bookmark
  }

  function updateBookmarkNote(id, note) {
    const item = findItemById(id, activeWorkspace.value?.items)
    if (item && item.type === 'bookmark') {
      item.note = note
    }
  }

  // Pin operations
  function togglePin(bookmark) {
    const idx = pinnedBookmarks.value.findIndex(p => p.id === bookmark.id)
    if (idx >= 0) {
      pinnedBookmarks.value.splice(idx, 1)
      addToast('Bookmark unpinned', 'info')
    } else if (pinnedBookmarks.value.length < 8) {
      pinnedBookmarks.value.push({
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
      })
      addToast('Bookmark pinned', 'success')
    } else {
      addToast('Maximum 8 pinned bookmarks', 'warning')
    }
  }

  function toggleSelection(id, additive = true) {
    const index = selectedItemIds.value.indexOf(id)
    if (!additive) selectedItemIds.value = []
    if (index >= 0 && additive) {
      selectedItemIds.value.splice(index, 1)
    } else if (!selectedItemIds.value.includes(id)) {
      selectedItemIds.value.push(id)
    }
    focusedItemId.value = id
  }

  function selectItems(ids) {
    selectedItemIds.value = [...new Set(ids)]
    focusedItemId.value = selectedItemIds.value[0] || null
  }

  function clearSelection() {
    selectedItemIds.value = []
  }

  function isPinned(bookmarkId) {
    return pinnedBookmarks.value.some(p => p.id === bookmarkId)
  }

  // Folder expand/collapse
  function toggleFolder(folderId) {
    expandedFolders.value[folderId] = !expandedFolders.value[folderId]
  }

  function isExpanded(folderId) {
    return !!expandedFolders.value[folderId]
  }

  // Compact mode
  function toggleCompactMode() {
    compactMode.value = !compactMode.value
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  // Move item (drag & drop)
  function moveItem(itemId, targetFolderId) {
    if (!activeWorkspace.value) return
    if (itemId === targetFolderId) return // Can't move onto self
    
    const source = findItemContext(itemId, activeWorkspace.value.items)
    if (!source || !source.item) return
    
    const item = source.item

    // Check if target is a descendant of item (prevent circular move)
    if (item.type === 'folder' && targetFolderId) {
      const isDescendant = (items, targetId) => {
        if (!items) return false
        for (const ci of items) {
          if (ci.id === targetId) return true
          if (ci.type === 'folder' && ci.children && isDescendant(ci.children, targetId)) return true
        }
        return false
      }
      if (isDescendant(item.children || [], targetFolderId)) return
    }

    // Remove from source
    if (source.index >= 0) {
      source.list.splice(source.index, 1)
    }

    // Add to target
    if (targetFolderId === null) {
      // Move to root level
      activeWorkspace.value.items.push(item)
    } else {
      const target = findItemById(targetFolderId, activeWorkspace.value.items)
      if (target && target.type === 'folder') {
        target.children = target.children || []
        target.children.push(item)
        expandedFolders.value[targetFolderId] = true
      }
    }
  }

  function moveItemBefore(itemId, targetItemId) {
    if (!activeWorkspace.value || itemId === targetItemId) return
    const source = findItemContext(itemId, activeWorkspace.value.items)
    const target = findItemContext(targetItemId, activeWorkspace.value.items)
    if (!source?.list || !target?.list) return
    const [item] = source.list.splice(source.index, 1)
    const refreshedTarget = findItemContext(targetItemId, activeWorkspace.value.items)
    if (!refreshedTarget?.list) {
      source.list.splice(source.index, 0, item)
      return
    }
    refreshedTarget.list.splice(refreshedTarget.index, 0, item)
  }

  // Reorder within same list
  function reorderItem(itemId, direction) {
    if (!activeWorkspace.value) return
    const ctx = findItemContext(itemId, activeWorkspace.value.items)
    if (!ctx || !ctx.list) return
    const newIdx = ctx.index + direction
    if (newIdx < 0 || newIdx >= ctx.list.length) return
    const [item] = ctx.list.splice(ctx.index, 1)
    ctx.list.splice(newIdx, 0, item)
  }

  // Import Netscape bookmarks
  function importBookmarks(htmlContent) {
    if (!activeWorkspace.value) return 0
    
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      
      const parseList = (dl) => {
        const items = []
        if (!dl) return items
        const children = Array.from(dl.children)
        for (let index = 0; index < children.length; index++) {
          const child = children[index]
          if (child.tagName === 'DT') {
            const a = child.querySelector(':scope > A')
            const h3 = child.querySelector(':scope > H3')
            const nestedList = child.querySelector(':scope > DL')
              || (children[index + 1]?.tagName === 'DL' ? children[index + 1] : null)
            
            if (a) {
              const href = a.getAttribute('href') || ''
              if (isValidUrl(href)) items.push({
                id: generateId(),
                type: 'bookmark',
                url: href,
                title: a.textContent.trim() || deriveTitleFromUrl(href),
                note: '',
                createdAt: Date.now(),
              })
            } else if (h3 || nestedList) {
              items.push({
                id: generateId(),
                type: 'folder',
                name: h3?.textContent.trim() || 'Imported folder',
                children: parseList(nestedList),
              })
            }
          }
        }
        return items
      }
      
      const mainDl = doc.querySelector('DL')
      const imported = parseList(mainDl)
      
      if (imported.length > 0) {
        activeWorkspace.value.items.push(...imported)
        addToast(`Imported ${imported.length} items`, 'success')
        return imported.length
      } else {
        addToast('No bookmarks found in file', 'warning')
        return 0
      }
    } catch (e) {
      addToast('Import failed: ' + e.message, 'error')
      return 0
    }
  }

  // Export Netscape bookmarks
  function exportBookmarks(scope = 'current') {
    const items = scope === 'current' && activeWorkspace.value
      ? activeWorkspace.value.items
      : workspaces.value.map(w => ({
          id: generateId(),
          type: 'folder',
          name: w.name,
          children: w.items || [],
        }))

    const escapeHtml = (str) => {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    const renderItem = (item, indent = 2) => {
      const pad = '  '.repeat(indent)
      if (item.type === 'bookmark') {
        return `${pad}<DT><A HREF="${escapeHtml(item.url)}">${escapeHtml(item.title || 'Untitled')}</A>`
      } else {
        let html = `${pad}<DT><H3>${escapeHtml(item.name || 'Folder')}</H3>\n`
        html += `${pad}<DL><p>\n`
        for (const child of (item.children || [])) {
          html += renderItem(child, indent + 1) + '\n'
        }
        html += `${pad}</DL><p>\n`
        return html
      }
    }

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n`
    for (const item of items) {
      html += renderItem(item) + '\n'
    }
    html += `</DL><p>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sidedock-export-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast('Bookmarks exported', 'success')
  }

  // Load 10,000 items for virtualization testing
  function load10000Items() {
    if (!activeWorkspace.value) return
    const items = []
    const domains = ['google.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'mdn.dev', 'example.com', 'wikipedia.org', 'amazon.com']
    const existingIds = new Set(allBookmarks.value.filter(item => item.workspaceId === activeWorkspaceId.value).map(item => item.id))
    for (let i = 0; i < 10000; i++) {
      const domain = domains[i % domains.length]
      const id = `generated-${i}`
      if (existingIds.has(id)) continue
      items.push({
        id,
        type: 'bookmark',
        url: `https://${domain}/page/${i}`,
        title: `Virtualized Item ${i + 1}`,
        note: i % 10 === 0 ? `This is a sample note for item ${i + 1}` : '',
        createdAt: Date.now() - i * 1000,
      })
    }
    activeWorkspace.value.items.push(...items)
    addToast('Loaded 10,000 virtualized items', 'success')
  }

  return {
    // State
    workspaces,
    activeWorkspaceId,
    expandedFolders,
    compactMode,
    darkMode,
    searchQuery,
    searchScope,
    pinnedBookmarks,
    toasts,
    selectedItemIds,
    focusedItemId,
    // Computed
    activeWorkspace,
    allBookmarks,
    searchResults,
    // Actions
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    setWorkspaceColor,
    createFolder,
    renameItem,
    deleteItem,
    createBookmark,
    updateBookmarkNote,
    togglePin,
    isPinned,
    toggleFolder,
    isExpanded,
    toggleCompactMode,
    toggleDarkMode,
    toggleSelection,
    selectItems,
    clearSelection,
    moveItem,
    moveItemBefore,
    reorderItem,
    importBookmarks,
    exportBookmarks,
    load10000Items,
    addToast,
    findItemById,
    getDomain,
    hashColor,
    deriveTitleFromUrl,
    isValidUrl,
    generateId,
  }
})
