<script setup>
import { computed, nextTick, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { CriterionSchema } from '../schemas'
import { useStudioStore } from '../store'

const props = defineProps({ open: Boolean, mode: { type: String, default: 'add' }, criterion: { type: Object, default: null } })
const emit = defineEmits(['close', 'submitted'])
const store = useStudioStore()

const blank = () => ({ id: '', name: '', description: '', type: 'binary', likertMin: null, likertMax: null, weight: 1, importance: 'nice-to-have' })
const { defineField, errors, meta, handleSubmit, resetForm, validate, setFieldValue } = useForm({
  validationSchema: toTypedSchema(CriterionSchema),
  initialValues: blank(),
  validateOnMount: true,
})
const [id, idAttrs] = defineField('id', { validateOnModelUpdate: true })
const [name, nameAttrs] = defineField('name', { validateOnModelUpdate: true })
const [description, descriptionAttrs] = defineField('description', { validateOnModelUpdate: true })
const [type, typeAttrs] = defineField('type', { validateOnModelUpdate: true })
const [likertMin, likertMinAttrs] = defineField('likertMin', { validateOnModelUpdate: true })
const [likertMax, likertMaxAttrs] = defineField('likertMax', { validateOnModelUpdate: true })
const [weight, weightAttrs] = defineField('weight', { validateOnModelUpdate: true })
const [importance, importanceAttrs] = defineField('importance', { validateOnModelUpdate: true })

const duplicateId = computed(() => {
  const normalized = (id.value || '').trim()
  return store.activeRubric.criteria.some((item) => item.id === normalized && (props.mode === 'add' || item.id !== props.criterion?.id))
})
const canSubmit = computed(() => meta.value.valid && meta.value.dirty && !duplicateId.value)

watch(() => props.open, async (open) => {
  if (!open) return
  resetForm({ values: props.criterion ? { ...props.criterion } : blank() })
  await nextTick()
  await validate()
})
watch(type, (value) => {
  if (value === 'binary') {
    setFieldValue('likertMin', null, true)
    setFieldValue('likertMax', null, true)
  } else if (likertMin.value == null && likertMax.value == null) {
    setFieldValue('likertMin', 1, true)
    setFieldValue('likertMax', 5, true)
  }
})

const submit = handleSubmit((values) => emit('submitted', CriterionSchema.parse(values)))
</script>

<template>
  <Dialog :visible="open" modal :header="mode === 'add' ? 'Add criterion' : 'Edit criterion'" class="form-dialog" :style="{ width: 'min(680px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <form class="criterion-form" novalidate @submit.prevent="submit">
      <div class="field-grid two-col">
        <label class="field-block">
          <span>ID</span>
          <InputText v-model="id" v-bind="idAttrs" aria-describedby="criterion-id-error" :invalid="!!errors.id || duplicateId" autocomplete="off" />
          <small id="criterion-id-error" class="field-error">{{ duplicateId ? 'ID is already in use; choose a unique ID' : errors.id }}</small>
        </label>
        <label class="field-block">
          <span>Name</span>
          <InputText v-model="name" v-bind="nameAttrs" aria-describedby="criterion-name-error" :invalid="!!errors.name" autocomplete="off" />
          <small id="criterion-name-error" class="field-error">{{ errors.name }}</small>
        </label>
      </div>

      <label class="field-block">
        <span>Description</span>
        <Textarea v-model="description" v-bind="descriptionAttrs" rows="5" auto-resize aria-describedby="criterion-description-error" :invalid="!!errors.description" />
        <small id="criterion-description-error" class="field-error">{{ errors.description }}</small>
      </label>

      <div class="field-grid three-col">
        <label class="field-block">
          <span>Type</span>
          <Select v-model="type" v-bind="typeAttrs" :options="['binary', 'likert']" aria-label="Type" aria-describedby="criterion-type-error" :invalid="!!errors.type" />
          <small id="criterion-type-error" class="field-error">{{ errors.type }}</small>
        </label>
        <label class="field-block">
          <span>Weight</span>
          <InputNumber v-model="weight" v-bind="weightAttrs" :min="0.5" :max="5" :step="0.5" :min-fraction-digits="1" :max-fraction-digits="1" input-id="criterion-weight" aria-label="Weight" aria-describedby="criterion-weight-error" :invalid="!!errors.weight" />
          <small id="criterion-weight-error" class="field-error">{{ errors.weight }}</small>
        </label>
        <label class="field-block">
          <span>Importance</span>
          <Select v-model="importance" v-bind="importanceAttrs" :options="['must-have', 'nice-to-have']" aria-label="Importance" aria-describedby="criterion-importance-error" :invalid="!!errors.importance" />
          <small id="criterion-importance-error" class="field-error">{{ errors.importance }}</small>
        </label>
      </div>

      <div v-if="type === 'likert'" class="field-grid two-col range-fields">
        <label class="field-block">
          <span>Likert min</span>
          <InputNumber v-model="likertMin" v-bind="likertMinAttrs" :min="1" :max="10" aria-label="Likert min" aria-describedby="criterion-min-error" :invalid="!!errors.likertMin" />
          <small id="criterion-min-error" class="field-error">{{ errors.likertMin }}</small>
        </label>
        <label class="field-block">
          <span>Likert max</span>
          <InputNumber v-model="likertMax" v-bind="likertMaxAttrs" :min="1" :max="10" aria-label="Likert max" aria-describedby="criterion-max-error" :invalid="!!errors.likertMax" />
          <small id="criterion-max-error" class="field-error">{{ errors.likertMax }}</small>
        </label>
      </div>

      <div class="dialog-actions">
        <Button type="button" label="Cancel" severity="secondary" text @click="emit('close')" />
        <Button type="submit" :label="mode === 'add' ? 'Add criterion' : 'Continue to version'" :disabled="!canSubmit" />
      </div>
    </form>
  </Dialog>
</template>
