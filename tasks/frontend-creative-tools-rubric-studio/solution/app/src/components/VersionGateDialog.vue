<script setup>
import { computed, nextTick, watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { SemverSchema } from '../schemas'
import { nextVersion, requiredVersion, useStudioStore } from '../store'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'saved'])
const store = useStudioStore()
const schema = toTypedSchema(z.object({ version: SemverSchema }))
const { defineField, errors, meta, handleSubmit, resetForm, validate } = useForm({ validationSchema: schema, initialValues: { version: '' }, validateOnMount: true })
const [version, versionAttrs] = defineField('version', { validateOnModelUpdate: true })
const kind = computed(() => store.pendingChange?.kind || 'patch')
const suggestion = computed(() => nextVersion(kind.value, store.activeRubric.version))
const bumpValid = computed(() => requiredVersion(kind.value, store.activeRubric.version, version.value))
const violation = computed(() => {
  if (!version.value || errors.value.version) return ''
  return bumpValid.value ? '' : `${kind.value} bump required — use ${suggestion.value} or a higher valid ${kind.value} version`
})
watch(() => props.open, async (open) => {
  if (!open) return
  resetForm({ values: { version: '' } })
  await nextTick(); await validate()
})
const submit = handleSubmit(({ version: candidate }) => {
  const result = store.applyPending(candidate)
  if (result.ok) emit('saved', result.action)
})
</script>

<template>
  <Dialog :visible="open" modal header="Version gate" class="version-dialog" :style="{ width: 'min(480px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <form class="version-form" novalidate @submit.prevent="submit">
      <div class="bump-callout" :class="`bump-${kind}`">
        <strong>{{ kind }} bump required</strong>
        <span>{{ store.pendingChange?.action === 'delete' ? 'Deleting a criterion changes the document contract.' : kind === 'minor' ? 'Description, type, range, or ID changes alter scoring semantics.' : 'This property change needs a new patch.' }}</span>
      </div>
      <p class="current-version">Current version <strong>{{ store.activeRubric.version }}</strong> · Suggested <button type="button" class="version-suggestion" @click="version = suggestion">{{ suggestion }}</button></p>
      <label class="field-block">
        <span>New version</span>
        <InputText v-model="version" v-bind="versionAttrs" placeholder="MAJOR.MINOR.PATCH" aria-describedby="version-error" :invalid="!!errors.version || !!violation" autocomplete="off" />
        <small id="version-error" class="field-error">{{ errors.version || violation }}</small>
      </label>
      <div class="save-gate-row">
        <p v-if="!bumpValid" class="save-hint" role="note">{{ violation || `Save is disabled until you enter a ${kind} bump — try ${suggestion}.` }}</p>
        <div class="dialog-actions">
          <Button type="button" label="Cancel change" severity="secondary" text @click="emit('close')" />
          <Button type="submit" :label="store.pendingChange?.action === 'delete' ? 'Delete and save' : 'Save change'" :disabled="!meta.valid || !bumpValid" />
        </div>
      </div>
    </form>
  </Dialog>
</template>
