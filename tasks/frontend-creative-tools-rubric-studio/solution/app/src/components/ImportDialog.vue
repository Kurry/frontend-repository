<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useStudioStore } from '../store'
import { useFocusTrap } from '../focus-trap'
import { useDialogEscape } from '../composables/useDialogEscape'
import { RubricPackageSchema, formatZodError } from '../schemas'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'imported'])
const store = useStudioStore()
useFocusTrap(computed(() => props.open))
useDialogEscape(props, emit)
const packageError = ref('')
const packageSourceSchema = z.string().trim().min(1, 'Package JSON is required; paste an exported package').superRefine((source, ctx) => {
  if (!source) return
  let parsed
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    ctx.addIssue({ code: 'custom', message: `Package JSON parse error: ${error.message}` })
    return
  }
  const result = RubricPackageSchema.safeParse(parsed)
  if (!result.success) ctx.addIssue({ code: 'custom', message: formatZodError(result.error) })
})
const formSchema = toTypedSchema(z.object({ json: packageSourceSchema }))
const { defineField, errors, meta, handleSubmit, resetForm, validate } = useForm({ validationSchema: formSchema, initialValues: { json: '' }, validateOnMount: true })
const [json, jsonAttrs] = defineField('json', { validateOnModelUpdate: true })
watch(() => props.open, async (open) => {
  if (!open) return
  packageError.value = ''
  resetForm({ values: { json: '' } })
  await nextTick(); await validate()
})
watch(json, () => { packageError.value = '' })

function loadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { json.value = String(reader.result || '') }
  reader.onerror = () => { packageError.value = 'Package file could not be read' }
  reader.readAsText(file)
}
const submit = handleSubmit(({ json: source }) => {
  let parsed
  try { parsed = JSON.parse(source) } catch (error) {
    packageError.value = `Package JSON parse error: ${error.message}`
    return
  }
  const result = store.importPackage(parsed)
  if (!result.ok) { packageError.value = result.message; return }
  emit('imported')
})
</script>

<template>
  <Dialog :visible="open" :modal="false" header="Import package" class="import-dialog" :style="{ width: 'min(720px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <form class="import-form" novalidate @submit.prevent="submit">
      <p class="dialog-intro">Paste or choose a <strong>rubric-package-v1</strong> JSON file. A valid package replaces the in-memory library; invalid input changes nothing.</p>
      <label class="file-picker">
        <span>Choose package JSON</span>
        <input type="file" accept="application/json,.json" @change="loadFile" />
      </label>
      <label class="field-block">
        <span>Package JSON</span>
        <Textarea v-model="json" v-bind="jsonAttrs" rows="13" class="code-input" aria-describedby="import-error" :invalid="!!errors.json || !!packageError" placeholder="Paste the exported package JSON here" />
        <small id="import-error" class="field-error">{{ errors.json || packageError }}</small>
      </label>
      <div class="dialog-actions">
        <Button type="button" label="Cancel" severity="secondary" text @click="emit('close')" />
        <Button type="submit" label="Import package" :disabled="!meta.valid" />
      </div>
    </form>
  </Dialog>
</template>
