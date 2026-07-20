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
const { handleSubmit, meta, isSubmitting, resetForm, validate } = useForm({ validationSchema: toTypedSchema(schema), validateOnMount: true, initialValues: { summary: '' } })
const submit = handleSubmit(async (values) => { if (store.requestRevision(submission.value.id, values)) await nextTick(() => resetForm()) })
watch(() => store.dialogs.revision, async (open) => { if (open) { await nextTick(); await validate() } })
</script>
<template>
  <NModal v-model:show="store.dialogs.revision" :mask-closable="true" class="review-modal" transform-origin="center">
    <NCard role="dialog" aria-modal="true" aria-labelledby="revision-title" class="modal-card">
      <div class="modal-heading"><span class="modal-icon revision-icon"><IconSend /></span><div><p class="eyebrow">Contributor handoff</p><h2 id="revision-title">Request revision</h2><p>This summary is added to stage history and the QC package.</p></div></div>
      <form class="review-form" novalidate @submit="submit">
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="summary">
          <label class="form-field" :class="{ invalid: errorMessage || !value || value.trim().length < 20 }"><span>Summary <b>Min. 20 characters</b></span><NInput :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain what the contributor needs to revise…" aria-describedby="summary-error" @update:value="handleChange" @blur="handleBlur" /></label><p v-if="errorMessage || !value || value.trim().length < 20" id="summary-error" class="field-error">{{ errorMessage || 'Summary must be at least 20 characters.' }}</p>
        </Field>
        <div class="modal-actions"><NButton @click="store.dialogs.revision = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="!meta.valid || isSubmitting" :loading="isSubmitting"><IconSend /> Request revision</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
