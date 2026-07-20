<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore, NOTE_COLORS, SHAPE_COLORS } from '../store'
import type { CanvasObject } from '../types'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  obj: CanvasObject
  isSelected: boolean
  isSearchHighlight: boolean
  isConnectSource: boolean
  zoom: number
}>()

const store = useAppStore()

const isEditing = ref(false)
const dragGhost = ref<{ x: number, y: number } | null>(null)
const dragPos = ref<{ x: number, y: number } | null>(null)
const hovered = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)

const singleSelected = computed(() => props.isSelected && store.selectedIds.length === 1)

// While dragging, the wrapper follows the pointer via dragPos; otherwise it renders at the object's stored position
const wrapperPos = computed(() => dragPos.value ?? { x: props.obj.x, y: props.obj.y })

// Colors
const colors = computed(() => {
  if (props.obj.type === 'note' || props.obj.type === 'flashcard') return NOTE_COLORS
  if (props.obj.type === 'rectangle' || props.obj.type === 'circle' || props.obj.type === 'arrow') return SHAPE_COLORS
  return []
})

// TipTap Editor Setup
const editorText = computed({
  get: () => {
    if (props.obj.type === 'note') return props.obj.text || ''
    if (props.obj.type === 'flashcard') {
      return props.obj.flipped ? (props.obj.back || '') : (props.obj.front || '')
    }
    return ''
  },
  set: (val) => {
    if (props.obj.type === 'note') {
      store.updateObject({ id: props.obj.id, updates: { text: val } })
    } else if (props.obj.type === 'flashcard') {
      if (props.obj.flipped) {
         store.updateObject({ id: props.obj.id, updates: { back: val } })
      } else {
         store.updateObject({ id: props.obj.id, updates: { front: val } })
      }
    }
  }
})

const editor = useEditor({
  content: editorText.value,
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    const txt = editor.getText()
    if (txt.length > 8000) {
       store.announce(`${props.obj.type === 'note' ? 'text' : (props.obj.flipped ? 'back' : 'front')} too long (max 8000 chars)`)
       editor.commands.setContent(editorText.value)
    } else {
       editorText.value = editor.getHTML()
    }
  }
})

const renderEditor = useEditor({
  content: editorText.value,
  editable: false,
  extensions: [StarterKit],
})

watch(editorText, (val) => {
   if (!isEditing.value) {
      renderEditor.value?.commands.setContent(val)
   }
})

watch(() => isEditing.value, (val) => {
  if (val) {
    editor.value?.commands.setContent(editorText.value)
    editor.value?.commands.focus()
  } else {
    renderEditor.value?.commands.setContent(editorText.value)
  }
})

const startEditing = () => {
  if (store.activeTool === 'select' && (props.obj.type === 'note' || props.obj.type === 'flashcard')) {
     if (!store.selectedIds.includes(props.obj.id)) {
        store.selectOnly(props.obj.id)
     }
     isEditing.value = true
  }
}

const finishEditing = () => {
  isEditing.value = false
}

const handleEditorFocusOut = (e: FocusEvent) => {
  const container = e.currentTarget as Node
  const next = e.relatedTarget as Node | null
  if (!next || !container.contains(next)) {
    finishEditing()
  }
}

// Dragging
let isDragging = false
let startDragWorld = { x: 0, y: 0 }
let startObjWorld = { x: 0, y: 0 }

const handleMouseDown = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.resize-handle') || (e.target as HTMLElement).closest('button') || isEditing.value) {
    return
  }

  if (store.activeTool === 'connect') {
    if (store.connectFromId) {
      store.addConnector({ fromId: store.connectFromId, toId: props.obj.id })
    } else {
      store.setConnectFrom(props.obj.id)
    }
    e.stopPropagation()
    return
  }

  e.stopPropagation()

  if (e.shiftKey) {
    store.toggleSelect(props.obj.id)
    return
  }

  if (!store.selectedIds.includes(props.obj.id)) {
    store.selectOnly(props.obj.id)
  }

  isDragging = true
  // Ghost stays pinned at the drag's origin position; dragPos tracks the pointer
  dragGhost.value = { x: props.obj.x, y: props.obj.y }
  dragPos.value = { x: props.obj.x, y: props.obj.y }
  startObjWorld = { x: props.obj.x, y: props.obj.y }
  startDragWorld = { x: e.clientX, y: e.clientY }

  const cleanupListeners = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.removeEventListener('keydown', onKeyDown, true)
  }

  const onMove = (me: MouseEvent) => {
    if (!isDragging) return
    const dx = (me.clientX - startDragWorld.x) / store.canvasView.zoom
    const dy = (me.clientY - startDragWorld.y) / store.canvasView.zoom
    dragPos.value = { x: startObjWorld.x + dx, y: startObjWorld.y + dy }
  }

  const onUp = (me: MouseEvent) => {
    isDragging = false
    cleanupListeners()

    if (dragPos.value) {
       const dx = dragPos.value.x - props.obj.x
       const dy = dragPos.value.y - props.obj.y

       if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          if (store.selectedIds.length > 1) {
             store._saveHistory()
             store.selectedIds.forEach(id => {
                store.moveObject({ id, dx, dy })
             })
          } else {
             store._saveHistory()
             store.moveObject({ id: props.obj.id, dx, dy })
          }
       }
    }
    dragGhost.value = null
    dragPos.value = null
  }

  // Escape aborts the drag: discard local drag state so the pending mouseup
  // handler (removed here) never commits the move to the store.
  const onKeyDown = (ke: KeyboardEvent) => {
    if (ke.key === 'Escape') {
      isDragging = false
      cleanupListeners()
      dragGhost.value = null
      dragPos.value = null
    }
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.addEventListener('keydown', onKeyDown, true)
}

// Resizing
const handleResizeMouseDown = (e: MouseEvent, corner: 'tl'|'tr'|'bl'|'br') => {
  e.stopPropagation()
  e.preventDefault()

  let startW = props.obj.width
  let startH = props.obj.height
  let startX = props.obj.x
  let startY = props.obj.y
  let startMouseX = e.clientX
  let startMouseY = e.clientY
  let historySaved = false

  const onMove = (me: MouseEvent) => {
    const dx = (me.clientX - startMouseX) / store.canvasView.zoom
    const dy = (me.clientY - startMouseY) / store.canvasView.zoom

    const minW = (props.obj.type === 'note' || props.obj.type === 'flashcard') ? 120 : 48
    const minH = (props.obj.type === 'note' || props.obj.type === 'flashcard') ? 96 : 48

    let newW = startW
    let newH = startH
    let newX = startX
    let newY = startY

    if (corner.includes('r')) newW = Math.max(minW, startW + dx)
    if (corner.includes('l')) {
       newW = Math.max(minW, startW - dx)
       newX = startX + (startW - newW)
    }
    if (corner.includes('b')) newH = Math.max(minH, startH + dy)
    if (corner.includes('t')) {
       newH = Math.max(minH, startH - dy)
       newY = startY + (startH - newH)
    }

    if (!historySaved) {
      // Snapshot the pre-resize geometry before the first live update so undo restores it
      store._saveHistory()
      historySaved = true
    }
    store.updateObject({ id: props.obj.id, updates: { width: newW, height: newH, x: newX, y: newY } })
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (isEditing.value) return
  if (!singleSelected.value) return

  if (e.key === 'Enter') {
     startEditing()
     return
  }

  const step = 24
  let handled = true
  if (e.key === 'ArrowUp') store.moveObject({ id: props.obj.id, dx: 0, dy: -step })
  else if (e.key === 'ArrowDown') store.moveObject({ id: props.obj.id, dx: 0, dy: step })
  else if (e.key === 'ArrowLeft') store.moveObject({ id: props.obj.id, dx: -step, dy: 0 })
  else if (e.key === 'ArrowRight') store.moveObject({ id: props.obj.id, dx: step, dy: 0 })
  else handled = false

  if (handled) {
     e.stopPropagation()
     e.preventDefault()
  }
}

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Vueuse Motion config for entrance
const motionConfig = computed(() => {
  if (prefersReducedMotion.value) return undefined;
  return {
    initial: { opacity: 0, scale: 0.8 },
    enter: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 25 } }
  }
})
</script>

<template>
  <div>
    <!-- Ghost -->
    <div
      v-if="dragGhost"
      aria-hidden="true"
      :style="{
        position: 'absolute',
        left: `${dragGhost.x}px`,
        top: `${dragGhost.y}px`,
        width: `${obj.width}px`,
        height: `${obj.height}px`,
        border: '2px dashed var(--color-text-secondary)',
        borderRadius: obj.type === 'circle' ? '50%' : '8px',
        zIndex: 0,
        pointerEvents: 'none'
      }"
    ></div>

    <!-- Wrapper -->
    <div
      ref="wrapperRef"
      role="group"
      :aria-label="obj.type"
      tabindex="0"
      class="canvas-object-wrapper group transition-[transform] duration-300"
      v-motion="motionConfig"
      :data-canvas-object="true"
      :style="{
        position: 'absolute',
        left: `${wrapperPos.x}px`,
        top: `${wrapperPos.y}px`,
        width: `${obj.width}px`,
        height: `${obj.height}px`,
        zIndex: obj.zIndex,
        boxShadow: isSearchHighlight ? '0 0 0 4px #E0A030' :
                   isConnectSource ? '0 0 0 3px #3F9E6E' :
                   isSelected ? '0 0 0 3px #6D5BD0' : '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: obj.type === 'circle' ? '50%' : '8px',
        backgroundColor: obj.type === 'flashcard' ? '#FFFFFF' : obj.color,
        display: 'flex',
        flexDirection: 'column',
        transform: (!prefersReducedMotion && obj.type === 'flashcard' && obj.flipped) ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }"
      @mousedown="handleMouseDown"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @dblclick.stop="startEditing"
      @keydown="handleKeyDown"
    >

      <!-- Arrow specifics -->
      <template v-if="obj.type === 'arrow'">
        <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true" class="absolute inset-0 z-0">
          <line x1="10" y1="40" x2="88" y2="40" :stroke="obj.color" stroke-width="8" stroke-linecap="round" />
          <polygon points="86,24 114,40 86,56" :fill="obj.color" />
        </svg>
      </template>

      <!-- Note / Flashcard header -->
      <div v-if="obj.type === 'note' || obj.type === 'flashcard'" class="flex items-center justify-between gap-1 p-2 border-b border-gray-200 z-10 shrink-0" :style="{ transform: (!prefersReducedMotion && obj.type === 'flashcard' && obj.flipped) ? 'rotateY(180deg)' : 'none' }">
        <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
           {{ obj.type === 'flashcard' ? (obj.flipped ? 'Back' : 'Front') : 'Note' }}
        </span>
        <button v-if="obj.type === 'flashcard'" @click.stop="store.updateObject({id: obj.id, updates: { flipped: !obj.flipped }})" class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-600 hover:bg-purple-100">
           Flip
        </button>
      </div>

      <!-- Colors Swatch -->
      <div v-if="singleSelected" class="absolute -top-[45px] left-0 bg-white shadow-md p-1 rounded z-20 flex gap-1" :style="{ transform: (!prefersReducedMotion && obj.type === 'flashcard' && obj.flipped) ? 'rotateY(180deg)' : 'none' }">
         <button
            v-for="c in colors"
            :key="c.hex"
            type="button"
            class="w-6 h-6 rounded-full border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
            :style="{ backgroundColor: c.hex }"
            @mousedown.stop
            @click="store.updateObject({ id: obj.id, updates: { color: c.hex } })"
            :title="c.name"
            :aria-label="c.name"
         >
            <div v-if="obj.color === c.hex" class="flex items-center justify-center w-full h-full">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5 L5 9 L10 3" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
         </button>
      </div>

      <!-- Text Area -->
      <div v-if="(obj.type === 'note' || obj.type === 'flashcard') && isEditing" class="flex-1 p-2 relative z-10 bg-white/50 overflow-hidden flex flex-col" :style="{ transform: (!prefersReducedMotion && obj.type === 'flashcard' && obj.flipped) ? 'rotateY(180deg)' : 'none' }" @keydown.escape.stop.prevent="finishEditing" @focusout="handleEditorFocusOut">
         <!-- Format Toolbar -->
         <div class="flex gap-1 mb-1 shrink-0">
            <button type="button" @mousedown.prevent="editor?.chain().focus().toggleBold().run()" class="px-2 py-1 bg-white border rounded text-xs font-bold" :class="{ 'bg-gray-200': editor?.isActive('bold') }">B</button>
            <button type="button" @mousedown.prevent="editor?.chain().focus().toggleItalic().run()" class="px-2 py-1 bg-white border rounded text-xs italic" :class="{ 'bg-gray-200': editor?.isActive('italic') }">I</button>
            <button type="button" @mousedown.prevent="editor?.chain().focus().toggleBulletList().run()" class="px-2 py-1 bg-white border rounded text-xs" :class="{ 'bg-gray-200': editor?.isActive('bulletList') }">•</button>
            <button type="button" @mousedown.prevent="editor?.chain().focus().undo().run()" class="px-2 py-1 bg-white border rounded text-xs ml-auto">Undo</button>
            <button type="button" @mousedown.prevent="editor?.chain().focus().redo().run()" class="px-2 py-1 bg-white border rounded text-xs">Redo</button>
         </div>
         <!-- Editor -->
         <editor-content :editor="editor" class="flex-1 overflow-auto outline-none prose prose-sm focus:ring-2 focus:ring-purple-500 rounded bg-transparent" />
      </div>

      <div v-else-if="(obj.type === 'note' || obj.type === 'flashcard') && !isEditing" class="flex-1 p-2 overflow-hidden break-words z-10" :style="{ transform: (!prefersReducedMotion && obj.type === 'flashcard' && obj.flipped) ? 'rotateY(180deg)' : 'none' }">
        <editor-content :editor="renderEditor" class="w-full h-full outline-none prose prose-sm" />
        <span v-if="!editorText" class="text-gray-500 pointer-events-none absolute top-2 left-2">Double-click to edit...</span>
      </div>

      <!-- Resize Handles -->
      <template v-if="singleSelected">
        <div @mousedown="e => handleResizeMouseDown(e, 'tl')" class="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#6D5BD0] cursor-nwse-resize z-20" :class="{'rounded-full': obj.type === 'circle'}" />
        <div @mousedown="e => handleResizeMouseDown(e, 'tr')" class="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#6D5BD0] cursor-nesw-resize z-20" :class="{'rounded-full': obj.type === 'circle'}" />
        <div @mousedown="e => handleResizeMouseDown(e, 'bl')" class="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#6D5BD0] cursor-nesw-resize z-20" :class="{'rounded-full': obj.type === 'circle'}" />
        <div @mousedown="e => handleResizeMouseDown(e, 'br')" class="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#6D5BD0] cursor-nwse-resize z-20" :class="{'rounded-full': obj.type === 'circle'}" />
      </template>

    </div>
  </div>
</template>

<style scoped>
.canvas-object-wrapper {
  outline: none;
  transform-style: preserve-3d;
}
.resize-handle {
  pointer-events: auto;
}
/* Prose styling for tiptap */
:deep(.ProseMirror) {
  outline: none;
  height: 100%;
}
:deep(.ProseMirror p) {
  margin: 0;
}
:deep(.ProseMirror ul) {
  padding-left: 1.2rem;
  margin: 0;
}
</style>
