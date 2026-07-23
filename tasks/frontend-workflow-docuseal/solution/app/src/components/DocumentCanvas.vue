<script setup>
import { computed } from 'vue'
import {
  PhTextT, PhSignature, PhTextAlignLeft, PhCalendarBlank, PhHash, PhCheckSquare,
  PhRadioButton, PhCaretDown, PhImageSquare, PhPaperclip, PhPhone, PhGridFour, PhSeal,
} from '@phosphor-icons/vue'
import { useWorkspaceStore } from '../store'

const store = useWorkspaceStore()

const icons = {
  text: PhTextT, signature: PhSignature, initials: PhTextAlignLeft, date: PhCalendarBlank,
  number: PhHash, checkbox: PhCheckSquare, radio: PhRadioButton, select: PhCaretDown,
  image: PhImageSquare, file: PhPaperclip, phone: PhPhone, cells: PhGridFour, stamp: PhSeal,
}

const pages = computed(() => Array.from({ length: store.activeTemplate.pages }, (_, index) => index))

function submitterFor(field) {
  return store.submitters.find((submitter) => submitter.name === field.submitter)
}

function fieldStyle(field) {
  return {
    '--field-color': submitterFor(field)?.color || '#64748b',
    left: `${field.x / 7.2}%`,
    top: `${field.y / 5.6}%`,
    width: `${field.w / 7.2}%`,
    height: `${field.h / 5.6}%`,
  }
}

function handlePointerDown(event, field) {
  if (store.mode !== 'build' || event.button !== 0) return
  const additive = event.shiftKey || event.ctrlKey || event.metaKey
  store.selectField(field.id, additive)
  if (additive) return
  const page = event.currentTarget.closest('.document-page')
  const rect = page.getBoundingClientRect()
  const startX = event.clientX
  const startY = event.clientY
  const originX = field.x
  const originY = field.y
  const scaleX = 720 / rect.width
  const scaleY = 560 / rect.height
  let moved = false

  store.beginFieldMove()
  event.currentTarget.setPointerCapture?.(event.pointerId)

  function move(moveEvent) {
    const dx = (moveEvent.clientX - startX) * scaleX
    const dy = (moveEvent.clientY - startY) * scaleY
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true
    if (moved) store.moveField(field.id, originX + dx, originY + dy)
  }

  function up() {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    store.finishFieldMove()
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up, { once: true })
}

function keySelect(event, field) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    store.selectField(field.id, event.shiftKey || event.ctrlKey || event.metaKey)
  }
}
</script>

<template>
  <main class="canvas-shell" :class="{ previewing: store.mode === 'preview' }" aria-label="Document canvas">
    <div class="canvas-toolbar-mobile">
      <span>{{ store.activeTemplate.name }}</span>
      <span>{{ store.activeTemplate.fields.length }} {{ store.activeTemplate.fields.length === 1 ? 'field' : 'fields' }} · {{ store.activeTemplate.pages }} {{ store.activeTemplate.pages === 1 ? 'page' : 'pages' }}</span>
    </div>

    <div class="pages-stack">
      <section
        v-for="page in pages"
        :key="`${store.activeTemplate.id}-${page}`"
        class="document-page"
        :aria-label="`Page ${page + 1} of ${store.activeTemplate.pages}`"
        @click.self="store.clearSelection()"
      >
        <span class="page-number">Page {{ page + 1 }} / {{ store.activeTemplate.pages }}</span>

        <div class="document-body" aria-hidden="true">
          <template v-if="page === 0">
            <h1>{{ store.activeTemplate.name }}</h1>
            <p>{{ store.activeTemplate.subtitle }}</p>
          </template>
          <template v-else>
            <h2 class="continuation-title">{{ store.activeTemplate.name }}</h2>
            <p>Agreement continuation</p>
          </template>
          <div class="text-lines">
            <span class="line line-68" /><span class="line line-full" /><span class="line line-48" />
            <span class="line line-68" /><span class="line line-full" /><span class="line line-48" />
            <span class="line line-68" />
          </div>
        </div>

        <TransitionGroup name="field">
          <div
            v-for="field in store.activeTemplate.fields.filter((item) => item.page === page)"
            :key="field.id"
            class="field-box"
            :class="{
              selected: store.selectedFieldIds.includes(field.id),
              'multi-selected': store.selectedFieldIds.length > 1 && store.selectedFieldIds.includes(field.id),
            }"
            :style="fieldStyle(field)"
            :role="store.mode === 'build' ? 'button' : undefined"
            :tabindex="store.mode === 'build' ? 0 : -1"
            :aria-label="`${field.name}, ${field.type}, assigned to ${field.submitter}${field.required ? ', required' : ''}`"
            @pointerdown="handlePointerDown($event, field)"
            @keydown="keySelect($event, field)"
            @keydown.delete.stop.prevent="store.deleteFields([field.id])"
          >
            <template v-if="store.mode === 'build'">
              <component :is="icons[field.type]" class="field-icon" :size="15" weight="bold" aria-hidden="true" />
              <span class="field-name">{{ field.name }}</span>
              <span v-if="field.required" class="required-mark" aria-label="required">*</span>
              <span class="field-owner">{{ field.submitter }}</span>
              <span v-if="store.selectedFieldIds.includes(field.id)" class="resize-handle" aria-hidden="true" />
            </template>
            <template v-else>
              <label class="preview-field-label">{{ field.name }}<span v-if="field.required"> *</span></label>
              <input
                v-if="!['checkbox', 'radio'].includes(field.type)"
                class="preview-field-input"
                :type="field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.type === 'signature' ? 'Sign here' : `Enter ${field.name.toLowerCase()}`"
              />
              <input v-else :type="field.type" class="preview-choice" :aria-label="field.name" />
            </template>
          </div>
        </TransitionGroup>
      </section>
    </div>
  </main>
</template>
