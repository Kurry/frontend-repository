<script setup>
import { computed, nextTick, watch } from 'vue'
import { Field, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NButton, NCard, NInput, NModal, NSelect } from 'naive-ui'
import IconAlert from '~icons/lucide/triangle-alert'
import IconPlus from '~icons/lucide/plus'
import { useQcStore } from '../store'

const store = useQcStore()
const submission = computed(() => store.activeSubmission)
const schema = z.object({
  tier: z.enum(['blocker', 'major', 'minor'], { message: 'Tier is required.' }),
  category: z.enum(['correctness', 'instruction-clarity', 'rubric-alignment', 'environment', 'scoring', 'tooling'], { message: 'Category is required.' }),
  description: z.string({ message: 'Description is required.' }).trim().min(10, 'Description must be at least 10 characters.'),
  evidence: z.string().optional(),
})
const { handleSubmit, meta, isSubmitting, resetForm, validate } = useForm({ validationSchema: toTypedSchema(schema), validateOnMount: true, initialValues: { tier: undefined, category: undefined, description: '', evidence: '' } })
const tierOptions = [{ label: 'Blocker — gate stopping', value: 'blocker' }, { label: 'Major — material issue', value: 'major' }, { label: 'Minor — polish issue', value: 'minor' }]
const categoryOptions = [{ label: 'Correctness', value: 'correctness' }, { label: 'Instruction clarity', value: 'instruction-clarity' }, { label: 'Rubric alignment', value: 'rubric-alignment' }, { label: 'Environment', value: 'environment' }, { label: 'Scoring', value: 'scoring' }, { label: 'Tooling', value: 'tooling' }]
const submit = handleSubmit(async (values) => { if (store.addFinding(submission.value.id, values)) await nextTick(() => resetForm()) })
watch(() => store.dialogs.add, async (open) => { if (open) { await nextTick(); await validate() } })
</script>

<template>
  <NModal v-model:show="store.dialogs.add" :mask-closable="true" class="review-modal" transform-origin="center">
    <NCard role="dialog" aria-modal="true" aria-labelledby="add-finding-title" class="modal-card">
      <div class="modal-heading"><span class="modal-icon blocker-icon"><IconAlert /></span><div><p class="eyebrow">Review record</p><h2 id="add-finding-title">Add finding</h2><p>Capture a precise issue against {{ submission?.title }}.</p></div></div>
      <form class="review-form" novalidate @submit="submit">
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="tier">
          <label class="form-field" :class="{ invalid: errorMessage || !value }"><span>Tier <b>Required</b></span><NSelect :value="value" :options="tierOptions" placeholder="Select severity tier" aria-describedby="tier-error" @update:value="handleChange" @blur="handleBlur" /></label><p v-if="errorMessage || !value" id="tier-error" class="field-error">{{ errorMessage || 'Tier is required.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="category">
          <label class="form-field" :class="{ invalid: errorMessage || !value }"><span>Category <b>Required</b></span><NSelect :value="value" :options="categoryOptions" placeholder="Select closed category" aria-describedby="category-error" @update:value="handleChange" @blur="handleBlur" /></label><p v-if="errorMessage || !value" id="category-error" class="field-error">{{ errorMessage || 'Category is required.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="description">
          <label class="form-field" :class="{ invalid: errorMessage || !value || value.trim().length < 10 }"><span>Description <b>Min. 10 characters</b></span><NInput :value="value" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Describe the quality issue and its impact…" aria-describedby="description-error" @update:value="handleChange" @blur="handleBlur" /></label><p v-if="errorMessage || !value || value.trim().length < 10" id="description-error" class="field-error">{{ errorMessage || 'Description must be at least 10 characters.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur }" name="evidence">
          <label class="form-field"><span>Evidence <i>Optional</i></span><NInput :value="value" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Paste an observed example or trial note…" @update:value="handleChange" @blur="handleBlur" /></label>
        </Field>
        <div class="modal-actions"><NButton @click="store.dialogs.add = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="!meta.valid || isSubmitting" :loading="isSubmitting"><IconPlus /> Add finding</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
