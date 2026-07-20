<script setup>
import { computed, nextTick, watch } from 'vue'
import { Field, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NButton, NCard, NInput, NModal } from 'naive-ui'
import IconShieldOff from '~icons/lucide/shield-off'
import { useQcStore } from '../store'
const store = useQcStore()
const submission = computed(() => store.activeSubmission)
const schema = z.object({ justification: z.string({ message: 'Justification is required.' }).trim().min(10, 'Justification must be at least 10 characters.') })
const { handleSubmit, meta, isSubmitting, resetForm, validate } = useForm({ validationSchema: toTypedSchema(schema), validateOnMount: true, initialValues: { justification: '' } })
const submit = handleSubmit(async (values) => { if (store.overrideFinding(submission.value.id, store.dialogs.overrideFindingId, values)) await nextTick(() => resetForm()) })
watch(() => store.dialogs.override, async (open) => { if (open) { await nextTick(); await validate() } })
</script>
<template>
  <NModal v-model:show="store.dialogs.override" :mask-closable="true" class="review-modal" transform-origin="center">
    <NCard role="dialog" aria-modal="true" aria-labelledby="override-title" class="modal-card">
      <div class="modal-heading"><span class="modal-icon override-icon"><IconShieldOff /></span><div><p class="eyebrow">Gate exception</p><h2 id="override-title">Override finding</h2><p>The finding remains in the record but stops counting toward the gate.</p></div></div>
      <form class="review-form" novalidate @submit="submit">
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="justification">
          <label class="form-field" :class="{ invalid: errorMessage || !value || value.trim().length < 10 }"><span>Justification <b>Min. 10 characters</b></span><NInput :value="value" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Explain why this exception is appropriate…" aria-describedby="justification-error" @update:value="handleChange" @blur="handleBlur" /></label><p v-if="errorMessage || !value || value.trim().length < 10" id="justification-error" class="field-error">{{ errorMessage || 'Justification must be at least 10 characters.' }}</p>
        </Field>
        <div class="modal-actions"><NButton @click="store.dialogs.override = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="!meta.valid || isSubmitting" :loading="isSubmitting"><IconShieldOff /> Confirm override</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
