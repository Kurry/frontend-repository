<script setup>
import { computed, nextTick, watch } from 'vue'
import { Field, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NButton, NCard, NInput, NModal } from 'naive-ui'
import IconSend from '~icons/lucide/send'
import { useQcStore } from '../store'
const store = useQcStore()
const submission = computed(() => store.activeSubmission)
const schema = z.object({ summary: z.string({ message: 'Summary is required.' }).trim().min(20, 'Summary must be at least 20 characters.') })
const draft = computed(() => {
  if (!submission.value) return { summary: '' }
  return store.draftRevisions[submission.value.id] || { summary: '' }
})

const { handleSubmit, meta, isSubmitting, resetForm, validate, values } = useForm({ validationSchema: toTypedSchema(schema), validateOnMount: true, initialValues: draft.value })

watch(values, (newVals) => {
  if (submission.value) {
    store.draftRevisions[submission.value.id] = JSON.parse(JSON.stringify(newVals))
  }
}, { deep: true })

const submit = handleSubmit(async (values) => { 
  if (store.requestRevision(submission.value.id, values)) {
    delete store.draftRevisions[submission.value.id]
    await nextTick(() => resetForm()) 
  }
})
// The dialog's <Field> input unmounts when the modal closes (display-directive="if"),
// and vee-validate drops its value on unmount — so every open must re-hydrate the
// form from the per-submission draft rather than relying on the one-time initialValues
// this component captured at its own (submission-independent) mount.
watch(() => store.dialogs.revision, async (open) => { if (open) { resetForm({ values: draft.value }); await nextTick(); await validate() } })
</script>
<template>
  <NModal v-if="store.dialogs.revision" :show="true" :mask-closable="true" :close-on-esc="true" display-directive="if" class="review-modal" transform-origin="center" @update:show="(v) => { if (!v) store.dialogs.revision = false }" @esc="store.dialogs.revision = false">
    <NCard role="dialog" aria-modal="true" aria-labelledby="revision-title" class="modal-card" tabindex="-1">
      <div class="modal-heading"><span class="modal-icon revision-icon"><IconSend /></span><div><p class="eyebrow">Contributor handoff</p><h2 id="revision-title">Request revision</h2><p>This summary is added to stage history and the QC package.</p></div></div>
      <form class="review-form" novalidate @submit.prevent="submit">
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="summary">
          <div class="form-field" :class="{ invalid: errorMessage || !value || value.trim().length < 20 }"><label for="summary">Summary <b>Min. 20 characters</b></label><NInput :input-props="{ id: 'summary', name: 'summary', 'aria-label': 'Summary', 'aria-describedby': 'summary-error' }" :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain what the contributor needs to revise…" @update:value="handleChange" @blur="handleBlur" /></div><p v-if="errorMessage || !value || value.trim().length < 20" id="summary-error" class="field-error" role="alert" aria-live="assertive">{{ errorMessage || 'Summary must be at least 20 characters.' }}</p>
        </Field>
        <div class="modal-actions"><NButton @click="store.dialogs.revision = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="!meta.valid || isSubmitting" :loading="isSubmitting"><IconSend /> Request revision</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
