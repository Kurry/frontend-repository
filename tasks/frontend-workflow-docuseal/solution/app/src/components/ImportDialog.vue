<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Form, Field } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
  DialogDescription, DialogClose, DialogTrigger,
} from 'reka-ui'
import { PhDownload, PhUploadSimple, PhX, PhFileCode } from '@phosphor-icons/vue'
import { importSchema } from '../schemas'
import { useWorkspaceStore } from '../store'

const store = useWorkspaceStore()
const open = ref(false)
const importError = ref('')

function onSubmit(values) {
  importError.value = ''
  const result = store.importTemplate(values.document)
  if (!result.ok) {
    importError.value = result.error
    return
  }
  open.value = false
}

function onFile(event, setFieldValue) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => setFieldValue('document', String(reader.result || ''), true)
  reader.onerror = () => { importError.value = 'document: The selected file could not be read.' }
  reader.readAsText(file)
}

function handleOpen(value) {
  open.value = value
  if (value) importError.value = ''
}

function handleExternalOpen() {
  handleOpen(true)
}

onMounted(() => window.addEventListener('docuseal:open-import', handleExternalOpen))
onBeforeUnmount(() => window.removeEventListener('docuseal:open-import', handleExternalOpen))
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpen">
    <DialogTrigger as-child>
      <button type="button" class="top-action" aria-label="Import Template JSON">
        <PhDownload :size="17" />
        <span>Import</span>
      </button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content import-dialog">
        <div class="dialog-heading">
          <div>
            <DialogTitle class="dialog-title">Import Template JSON</DialogTitle>
            <DialogDescription class="dialog-description">
              Replace the open template with a validated template package.
            </DialogDescription>
          </div>
          <DialogClose class="icon-button" aria-label="Close import dialog"><PhX :size="18" /></DialogClose>
        </div>

        <Form
          v-slot="{ setFieldValue }"
          :validation-schema="toTypedSchema(importSchema)"
          :initial-values="{ document: '' }"
          class="dialog-form"
          @submit="onSubmit"
        >
          <label class="file-picker">
            <PhFileCode :size="20" />
            <span><strong>Choose a JSON file</strong><small>or paste its contents below</small></span>
            <input type="file" accept="application/json,.json" @change="onFile($event, setFieldValue)" />
          </label>

          <Field v-slot="{ field, errorMessage }" name="document">
            <label class="form-label" for="import-document">Template JSON</label>
            <textarea
              id="import-document"
              v-bind="field"
              class="form-textarea code-textarea"
              :class="{ invalid: errorMessage || importError }"
              rows="13"
              spellcheck="false"
              placeholder="Paste a Template JSON object"
              :aria-invalid="!!(errorMessage || importError)"
              aria-describedby="import-error"
            />
            <p v-if="errorMessage || importError" id="import-error" class="form-error" role="alert">
              {{ importError || `document: ${errorMessage}` }}
            </p>
          </Field>

          <div class="dialog-actions">
            <DialogClose as-child><button type="button" class="button button-secondary">Cancel</button></DialogClose>
            <button type="submit" class="button button-primary"><PhUploadSimple :size="16" />Import template</button>
          </div>
        </Form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
