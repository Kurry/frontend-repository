<script setup>
import { computed, nextTick, watch, onBeforeUnmount } from 'vue'
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
import { useFocusTrap } from '../focus-trap'

const props = defineProps({ open: Boolean, mode: { type: String, default: 'add' }, criterion: { type: Object, default: null } })
const emit = defineEmits(['close', 'submitted'])
const store = useStudioStore()
useFocusTrap(computed(() => props.open))

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

function onEscape(event) {
  if (event.key !== 'Escape' || !props.open) return
  // If a PrimeVue overlay (select dropdown) is open, let it handle Escape first.
  if (document.querySelector('.p-select-overlay, .p-autocomplete-overlay')) return
  event.stopPropagation()
  emit('close')
}
watch(() => props.open, async (open) => {
  if (open) document.addEventListener('keydown', onEscape, true)
  else document.removeEventListener('keydown', onEscape, true)
  if (!open) return
  resetForm({ values: props.criterion ? { ...props.criterion } : blank() })
  await nextTick()
  await validate()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape, true))
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
  <!--
    Deliberately non-modal: the interleaved workflow (fill the form, switch to
    Tune to toggle a case, return and finish submitting) needs the canvas to
    stay clickable while the form is open. Keyboard focus is still trapped by
    useFocusTrap, Escape still closes, and focus returns to the opener.
  -->
  <Dialog :visible="open" :modal="false" :header="mode === 'add' ? 'Add criterion' : 'Edit criterion'" class="form-dialog" :style="{ width: 'min(680px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <form class="criterion-form" novalidate @submit.prevent="submit">
      <div class="field-grid two-col">
        <div class="field-block">
          <label for="criterion-id">ID</label>
          <InputText id="criterion-id" v-model="id" v-bind="idAttrs" aria-describedby="criterion-id-error" :invalid="!!errors.id || duplicateId" autocomplete="off" />
          <small id="criterion-id-error" class="field-error">{{ duplicateId ? 'ID is already in use; choose a unique ID' : errors.id }}</small>
        </div>
        <div class="field-block">
          <label for="criterion-name">Name</label>
          <InputText id="criterion-name" v-model="name" v-bind="nameAttrs" aria-describedby="criterion-name-error" :invalid="!!errors.name" autocomplete="off" />
          <small id="criterion-name-error" class="field-error">{{ errors.name }}</small>
        </div>
      </div>

      <div class="field-block">
        <label for="criterion-description">Description</label>
        <Textarea id="criterion-description" v-model="description" v-bind="descriptionAttrs" rows="5" auto-resize aria-describedby="criterion-description-error" :invalid="!!errors.description" />
        <small id="criterion-description-error" class="field-error">{{ errors.description }}</small>
      </div>

      <div class="field-grid three-col">
        <div class="field-block">
          <label for="criterion-type">Type</label>
          <Select v-model="type" v-bind="typeAttrs" :options="['binary', 'likert']" input-id="criterion-type" aria-label="Type" aria-describedby="criterion-type-error" :invalid="!!errors.type" />
          <small id="criterion-type-error" class="field-error">{{ errors.type }}</small>
        </div>
        <div class="field-block">
          <label for="criterion-weight">Weight</label>
          <InputNumber v-model="weight" v-bind="weightAttrs" :step="0.5" :min-fraction-digits="1" :max-fraction-digits="1" input-id="criterion-weight" aria-label="Weight" aria-describedby="criterion-weight-error" :invalid="!!errors.weight" />
          <small id="criterion-weight-error" class="field-error">{{ errors.weight }}</small>
        </div>
        <div class="field-block">
          <label for="criterion-importance">Importance</label>
          <Select v-model="importance" v-bind="importanceAttrs" :options="['must-have', 'nice-to-have']" input-id="criterion-importance" aria-label="Importance" aria-describedby="criterion-importance-error" :invalid="!!errors.importance" />
          <small id="criterion-importance-error" class="field-error">{{ errors.importance }}</small>
        </div>
      </div>

      <div v-if="type === 'likert'" class="field-grid two-col range-fields">
        <div class="field-block">
          <label for="criterion-min">Likert min</label>
          <InputNumber v-model="likertMin" v-bind="likertMinAttrs" :min="1" :max="10" input-id="criterion-min" aria-label="Likert min" aria-describedby="criterion-min-error" :invalid="!!errors.likertMin" />
          <small id="criterion-min-error" class="field-error">{{ errors.likertMin }}</small>
        </div>
        <div class="field-block">
          <label for="criterion-max">Likert max</label>
          <InputNumber v-model="likertMax" v-bind="likertMaxAttrs" :min="1" :max="10" input-id="criterion-max" aria-label="Likert max" aria-describedby="criterion-max-error" :invalid="!!errors.likertMax" />
          <small id="criterion-max-error" class="field-error">{{ errors.likertMax }}</small>
        </div>
      </div>

      <div class="dialog-actions">
        <Button type="button" label="Cancel" severity="secondary" text @click="emit('close')" />
        <Button type="submit" :label="mode === 'add' ? 'Add criterion' : 'Continue to version'" :disabled="!canSubmit" />
      </div>
    </form>
  </Dialog>
</template>
