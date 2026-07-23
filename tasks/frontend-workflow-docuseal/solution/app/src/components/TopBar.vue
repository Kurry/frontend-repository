<script setup>
import { ref } from 'vue'
import { Form, Field } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import {
  PhSparkle, PhArrowUUpLeft, PhArrowUUpRight, PhPaperPlaneTilt, PhArrowRight,
} from '@phosphor-icons/vue'
import { templateNameSchema } from '../schemas'
import { useWorkspaceStore } from '../store'
import ExportDialog from './ExportDialog.vue'
import ImportDialog from './ImportDialog.vue'

const store = useWorkspaceStore()
const sendError = ref('')
const compact = ref(false)

function handleTemplateName(event, handleChange) {
  handleChange(event, true)
  const result = templateNameSchema.safeParse({ name: event.target.value })
  if (result.success) store.renameTemplate(result.data.name)
}

function send() {
  sendError.value = ''
  const result = store.sendForSigning()
  if (!result.ok) {
    sendError.value = result.error
    store.notify(result.error)
  }
}

function advance() {
  sendError.value = ''
  const result = store.advanceSigning()
  if (!result.ok) sendError.value = result.error
}
</script>

<template>
  <header class="top-bar">
    <div class="brand-group">
      <div class="wordmark"><PhSparkle :size="18" weight="fill" /><span>Docuseal</span></div>
      <span class="breadcrumb">Templates</span>
      <span class="breadcrumb-slash">/</span>
      <Form
        :key="`${store.activeTemplateId}-${store.editorEpoch}`"
        :validation-schema="toTypedSchema(templateNameSchema)"
        :initial-values="{ name: store.activeTemplate.name }"
        class="template-name-form"
      >
        <label class="template-name-label" for="template-name-input">Template name</label>
        <Field v-slot="{ field, errorMessage, handleChange }" name="name">
          <input
            id="template-name-input"
            v-bind="field"
            class="template-name-input"
            :class="{ invalid: errorMessage }"
            maxlength="160"
            autocomplete="off"
            :aria-invalid="!!errorMessage"
            :aria-describedby="errorMessage ? 'template-name-error' : undefined"
            @input="handleTemplateName($event, handleChange)"
          />
          <span v-if="errorMessage" id="template-name-error" class="template-name-error" role="alert">Name: {{ errorMessage }}</span>
        </Field>
      </Form>
    </div>

    <div class="top-controls">
      <div class="history-controls" aria-label="History controls">
        <button type="button" class="top-action compact" :disabled="!store.canUndo" aria-label="Undo" title="Undo (Ctrl+Z)" @click="store.undo()">
          <PhArrowUUpLeft :size="17" /><span>Undo</span>
        </button>
        <button type="button" class="top-action compact" :disabled="!store.canRedo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" @click="store.redo()">
          <PhArrowUUpRight :size="17" /><span>Redo</span>
        </button>
      </div>

      <button type="button" class="top-action compact" :aria-label="compact ? 'Comfortable density' : 'Compact density'" @click="compact = !compact; store.notify(compact ? 'Compact density active' : 'Comfortable density active')">
        <span>{{ compact ? 'Compact' : 'Comfortable' }}</span>
      </button>
      <ExportDialog />
      <ImportDialog />

      <SwitchRoot
        class="mode-switch"
        :model-value="store.mode === 'preview'"
        aria-label="Build or Preview mode"
        @update:model-value="store.setMode($event ? 'preview' : 'build')"
      >
        <span class="mode-label" :class="{ active: store.mode === 'build' }">Build</span>
        <span class="mode-label" :class="{ active: store.mode === 'preview' }">Preview</span>
        <SwitchThumb class="mode-thumb" />
      </SwitchRoot>

      <span class="status-pill" :class="store.activeTemplate.status">{{ store.statusLabel }}</span>

      <div
        v-if="store.activeTemplate.status === 'pending'"
        class="signing-progress"
        aria-label="Signing progress"
      >
        <span
          v-for="(submitter, index) in store.submitters"
          :key="submitter.id"
          class="signing-step"
          :class="{
            done: index < (store.activeTemplate.signingIndex ?? 0),
            current: index === (store.activeTemplate.signingIndex ?? 0),
          }"
        >
          {{ submitter.name }}
        </span>
      </div>

      <button
        v-if="store.activeTemplate.status === 'pending'"
        type="button"
        class="button button-primary signing-button"
        @click="advance"
      >
        Advance <PhArrowRight :size="16" weight="bold" />
      </button>
      <button
        v-else
        type="button"
        class="button button-primary signing-button"
        :disabled="store.activeTemplate.status === 'completed'"
        @click="send"
      >
        <PhPaperPlaneTilt :size="16" /> Send for signing
      </button>
    </div>
    <p v-if="sendError" class="top-error" role="alert">{{ sendError }}</p>
  </header>
</template>
