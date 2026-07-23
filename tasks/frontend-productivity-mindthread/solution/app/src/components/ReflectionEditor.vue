<template>
  <form class="mt-1 space-y-2" @submit.prevent="save">
    <label :for="editorId" class="field-label">Reflection</label>
    <div class="rounded-md border border-line bg-surface">
      <div class="flex flex-wrap items-center gap-1 border-b border-linesoft px-2 py-1">
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[0.8rem] font-medium transition-colors hover:bg-hoverwash focus-ring"
          :class="editor?.isActive('bold') ? 'bg-primary/10 text-primary' : 'text-inksoft'"
          aria-label="Bold"
          @click="editor?.chain().focus().toggleBold().run()"
        >
          Bold
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[0.8rem] font-medium transition-colors hover:bg-hoverwash focus-ring"
          :class="editor?.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'text-inksoft'"
          aria-label="Bulleted list"
          @click="editor?.chain().focus().toggleBulletList().run()"
        >
          List
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[0.8rem] font-medium transition-colors hover:bg-hoverwash focus-ring text-inksoft"
          aria-label="Undo"
          :disabled="!editor?.can().undo()"
          @click="editor?.chain().focus().undo().run()"
        >
          Undo
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[0.8rem] font-medium transition-colors hover:bg-hoverwash focus-ring text-inksoft"
          aria-label="Redo"
          :disabled="!editor?.can().redo()"
          @click="editor?.chain().focus().redo().run()"
        >
          Redo
        </button>
      </div>
      <EditorContent
        :id="editorId"
        :editor="editor"
        class="reflection-editor min-h-24 px-3 py-2 text-[0.95rem] text-ink focus:outline-none"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${editorId}-error` : undefined"
        @keydown.escape="$emit('cancel')"
      />
    </div>
    <p v-if="error" :id="`${editorId}-error`" class="text-[0.8rem] text-error">
      Enter some text to save the reflection
    </p>
    <div class="flex gap-2">
      <button type="submit" class="btn-primary-sm">Save</button>
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  editorId: string
}>()

const emit = defineEmits<{
  (event: 'save', html: string, plainText: string): void
  (event: 'cancel'): void
}>()

const error = ref('')

const editor = useEditor({
  extensions: [StarterKit],
  content: '',
  editorProps: {
    attributes: {
      class: 'outline-none min-h-20',
      'aria-label': 'Reflection',
    },
  },
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function save() {
  const plainText = editor.value?.getText().trim() ?? ''
  if (!plainText) {
    error.value = 'Enter some text to save the reflection'
    return
  }
  error.value = ''
  emit('save', editor.value?.getHTML() ?? '', plainText)
}
</script>

<style scoped>
:deep(.reflection-editor .ProseMirror) {
  outline: none;
  min-height: 5rem;
}

:deep(.reflection-editor .ProseMirror ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

:deep(.reflection-editor .ProseMirror strong) {
  font-weight: 700;
}
</style>
