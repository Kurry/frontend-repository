<script setup>
import { ref } from 'vue'
import { Form, Field } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent,
  SelectViewport, SelectItem, SelectItemText, SelectItemIndicator,
  CheckboxRoot, CheckboxIndicator,
} from 'reka-ui'
import {
  PhCaretDown, PhCheck, PhCopy, PhTrash, PhSelectionAll, PhInfo,
} from '@phosphor-icons/vue'
import { fieldSchema } from '../schemas'
import { TYPE_LABELS, useWorkspaceStore } from '../store'

const store = useWorkspaceStore()
const batchTarget = ref('')

function handleName(event, handleChange) {
  handleChange(event, true)
  const field = store.selectedField
  if (!field) return
  const candidate = { ...field, name: event.target.value }
  const parsed = fieldSchema.safeParse(candidate)
  if (parsed.success) store.updateField(field.id, 'name', parsed.data.name)
}

function handleSubmitter(value, handleChange) {
  handleChange(value, true)
  if (store.selectedField) store.updateField(store.selectedField.id, 'submitter', value)
}

function handleRequired(value, handleChange) {
  const normalized = value === true
  handleChange(normalized, true)
  if (store.selectedField) store.updateField(store.selectedField.id, 'required', normalized)
}

function applyBatch() {
  if (batchTarget.value) store.batchReassign(batchTarget.value)
}
</script>

<template>
  <aside class="properties-panel" aria-label="Properties panel">
    <div class="properties-scroll">
      <div class="panel-heading-row">
        <div>
          <h2 class="eyebrow">{{ store.selectedField ? 'Field properties' : store.selectedFields.length > 1 ? 'Multiple fields' : 'Template' }}</h2>
          <p class="panel-context">{{ store.activeTemplate.fields.length }} {{ store.activeTemplate.fields.length === 1 ? 'field' : 'fields' }} · {{ store.activeTemplate.pages }} {{ store.activeTemplate.pages === 1 ? 'page' : 'pages' }}</p>
        </div>
        <span v-if="store.selectedField" class="type-badge">{{ TYPE_LABELS[store.selectedField.type] }}</span>
      </div>

      <Form
        v-if="store.selectedField"
        :key="`${store.selectedField.id}-${store.editorEpoch}`"
        :validation-schema="toTypedSchema(fieldSchema)"
        :initial-values="store.selectedField"
        class="field-editor"
      >
        <Field v-slot="{ field, errorMessage, handleChange }" name="name">
          <label class="form-label" for="field-name">Name</label>
          <input
            id="field-name"
            v-bind="field"
            class="form-input"
            :class="{ invalid: errorMessage }"
            maxlength="160"
            autocomplete="off"
            :aria-invalid="!!errorMessage"
            :aria-describedby="errorMessage ? 'field-name-error' : undefined"
            @input="handleName($event, handleChange)"
          />
          <p v-if="errorMessage" id="field-name-error" class="form-error" role="alert">Name: {{ errorMessage }}</p>
        </Field>

        <div class="editor-group">
          <label class="form-label" for="field-submitter">Assigned submitter</label>
          <Field v-slot="{ handleChange }" name="submitter">
            <SelectRoot
              :model-value="store.selectedField.submitter"
              @update:model-value="handleSubmitter($event, handleChange)"
            >
              <SelectTrigger id="field-submitter" class="select-trigger" aria-label="Assigned submitter">
                <span
                  class="submitter-swatch small"
                  :style="{ backgroundColor: store.submitters.find((item) => item.name === store.selectedField.submitter)?.color }"
                />
                <SelectValue />
                <PhCaretDown class="select-caret" :size="14" />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="select-content" position="popper" :side-offset="5">
                  <SelectViewport>
                    <SelectItem
                      v-for="submitter in store.submitters"
                      :key="submitter.id"
                      :value="submitter.name"
                      class="select-item"
                    >
                      <SelectItemIndicator class="select-indicator"><PhCheck :size="14" weight="bold" /></SelectItemIndicator>
                      <span class="submitter-swatch small" :style="{ backgroundColor: submitter.color }" />
                      <SelectItemText>{{ submitter.name }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </Field>
        </div>

        <Field v-slot="{ handleChange }" name="required">
          <label class="checkbox-row">
            <CheckboxRoot
              :model-value="store.selectedField.required"
              class="checkbox-root"
              @update:model-value="handleRequired($event, handleChange)"
            >
              <CheckboxIndicator class="checkbox-indicator"><PhCheck :size="13" weight="bold" /></CheckboxIndicator>
            </CheckboxRoot>
            <span>
              <strong>Required field</strong>
              <small>The submitter must complete this field.</small>
            </span>
          </label>
        </Field>

        <div class="panel-actions">
          <button type="button" class="button button-secondary grow" @click="store.duplicateField()">
            <PhCopy :size="16" /> Duplicate field
          </button>
          <button type="button" class="button button-danger grow" @click="store.deleteFields([store.selectedField.id])">
            <PhTrash :size="16" /> Delete field
          </button>
        </div>
      </Form>

      <section v-else-if="store.selectedFields.length > 1" class="multi-editor">
        <div class="multi-selection-card">
          <PhSelectionAll :size="22" />
          <div>
            <strong>{{ store.selectedFields.length }} fields selected</strong>
            <p>Assign every selected field to the same submitter in one step.</p>
          </div>
        </div>
        <label class="form-label" for="batch-submitter">Batch reassign</label>
        <SelectRoot v-model="batchTarget">
          <SelectTrigger id="batch-submitter" class="select-trigger">
            <SelectValue placeholder="Choose a submitter" />
            <PhCaretDown class="select-caret" :size="14" />
          </SelectTrigger>
          <SelectPortal>
            <SelectContent class="select-content" position="popper" :side-offset="5">
              <SelectViewport>
                <SelectItem v-for="submitter in store.submitters" :key="submitter.id" :value="submitter.name" class="select-item">
                  <SelectItemIndicator class="select-indicator"><PhCheck :size="14" /></SelectItemIndicator>
                  <span class="submitter-swatch small" :style="{ backgroundColor: submitter.color }" />
                  <SelectItemText>{{ submitter.name }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
        <button type="button" class="button button-primary full-width" :disabled="!batchTarget" @click="applyBatch">
          Batch reassign
        </button>
      </section>

      <section v-else class="template-summary">
        <dl>
          <div><dt>Document</dt><dd>{{ store.activeTemplate.name }}</dd></div>
          <div><dt>Fields</dt><dd>{{ store.activeTemplate.fields.length }}</dd></div>
          <div><dt>Pages</dt><dd>{{ store.activeTemplate.pages }}</dd></div>
          <div><dt>Status</dt><dd>{{ store.statusLabel }}</dd></div>
        </dl>
        <div class="selection-hint">
          <PhInfo :size="17" />
          <p>Select a field on the document to edit its name, submitter and required state.</p>
        </div>
      </section>

      <section class="breakdown">
        <h3 class="eyebrow">Fields by Submitter</h3>
        <div v-for="submitter in store.submitters" :key="submitter.id" class="breakdown-row">
          <span><span class="submitter-swatch small" :style="{ backgroundColor: submitter.color }" />{{ submitter.name }}</span>
          <strong>{{ store.fieldCounts[submitter.name] || 0 }}</strong>
        </div>
      </section>
    </div>
  </aside>
</template>
