<script setup>
import { ref } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
  DialogDescription, DialogClose, DialogTrigger,
} from 'reka-ui'
import { PhX, PhPlus } from '@phosphor-icons/vue'
import { submitterSchema } from '../schemas'
import { COLORS, useWorkspaceStore } from '../store'

const store = useWorkspaceStore()
const open = ref(false)
const formError = ref('')

function onSubmit(values) {
  formError.value = ''
  const result = store.addSubmitter(values)
  if (!result.ok) {
    formError.value = result.error
    return
  }
  open.value = false
}

function handleOpen(value) {
  open.value = value
  if (value) formError.value = ''
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpen">
    <DialogTrigger as-child>
      <button class="button button-small button-subtle" type="button">
        <PhPlus :size="13" weight="bold" />
        Add submitter
      </button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content dialog-small">
        <div class="dialog-heading">
          <div>
            <DialogTitle class="dialog-title">Add submitter</DialogTitle>
            <DialogDescription class="dialog-description">
              Add another party and assign it a distinct document colour.
            </DialogDescription>
          </div>
          <DialogClose class="icon-button" aria-label="Close add submitter dialog">
            <PhX :size="18" />
          </DialogClose>
        </div>

        <Form
          :key="store.submitters.length"
          :validation-schema="toTypedSchema(submitterSchema)"
          :initial-values="{ name: '', color: COLORS[store.submitters.length % COLORS.length] }"
          class="dialog-form"
          @submit="onSubmit"
        >
          <Field v-slot="{ field, errorMessage }" name="name" :validate-on-input="true">
            <label class="form-label" for="submitter-name">Name</label>
            <input
              id="submitter-name"
              v-bind="field"
              class="form-input"
              :class="{ invalid: errorMessage }"
              placeholder="Third Party"
              autocomplete="off"
              :aria-invalid="!!errorMessage"
              :aria-describedby="errorMessage ? 'submitter-name-error' : undefined"
            />
            <p v-if="errorMessage" id="submitter-name-error" class="form-error" role="alert">
              Name: {{ errorMessage }}
            </p>
          </Field>

          <label class="form-label" for="submitter-color">Colour</label>
          <div class="color-input-wrap">
            <Field id="submitter-color" name="color" class="color-input" type="color" :validate-on-input="true" />
            <Field name="color" class="form-input" aria-label="Colour hex value" :validate-on-input="true" />
          </div>
          <ErrorMessage name="color" class="form-error" />
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

          <div class="dialog-actions">
            <DialogClose as-child>
              <button type="button" class="button button-secondary">Cancel</button>
            </DialogClose>
            <button type="submit" class="button button-primary">Add submitter</button>
          </div>
        </Form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
