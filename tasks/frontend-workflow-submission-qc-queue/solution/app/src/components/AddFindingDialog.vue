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
      <form class="review-form" novalidate @submit.prevent="submit">
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="tier">
          <div class="form-field" :class="{ invalid: errorMessage || !value }"><label for="tier">Tier <b>Required</b></label><select :value="value" id="tier" aria-describedby="tier-error" @change="handleChange($event.target.value)" @blur="handleBlur" class="filter-select"><option value="" disabled>Select severity tier</option><option v-for="opt in tierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></div><p v-if="errorMessage || !value" id="tier-error" class="field-error" aria-live="polite">{{ errorMessage || 'Tier is required.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="category">
          <div class="form-field" :class="{ invalid: errorMessage || !value }"><label for="category">Category <b>Required</b></label><select :value="value" id="category" aria-describedby="category-error" @change="handleChange($event.target.value)" @blur="handleBlur" class="filter-select"><option value="" disabled>Select closed category</option><option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></div><p v-if="errorMessage || !value" id="category-error" class="field-error" aria-live="polite">{{ errorMessage || 'Category is required.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur, errorMessage }" name="description">
          <div class="form-field" :class="{ invalid: errorMessage || !value || value.trim().length < 10 }"><label for="description">Description <b>Min. 10 characters</b></label><NInput :input-props="{ id: 'description' }" id="description" :value="value" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Describe the quality issue and its impact…" aria-describedby="description-error" @update:value="handleChange" @blur="handleBlur" /></div><p v-if="errorMessage || !value || value.trim().length < 10" id="description-error" class="field-error" aria-live="polite">{{ errorMessage || 'Description must be at least 10 characters.' }}</p>
        </Field>
        <Field v-slot="{ value, handleChange, handleBlur }" name="evidence">
          <div class="form-field"><label for="evidence">Evidence <i>Optional</i></label><NInput :input-props="{ id: 'evidence' }" id="evidence" :value="value" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Paste an observed example or trial note…" @update:value="handleChange" @blur="handleBlur" /></div>
        </Field>
        <div class="modal-actions"><NButton @click="store.dialogs.add = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="!meta.valid || isSubmitting" :loading="isSubmitting"><IconPlus /> Add finding</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
