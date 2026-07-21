<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { SemverSchema } from '../schemas'
import { nextVersion, requiredVersion, useStudioStore } from '../store'
import { useFocusTrap } from '../focus-trap'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'apply'])
const store = useStudioStore()
useFocusTrap(computed(() => props.open))
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
const suggestionFlash = ref(false)
watch(() => props.open, async (open) => {
  if (!open) return
  resetForm({ values: { version: '' } })
  await nextTick(); await validate()
})
function applySuggestion() {
  version.value = suggestion.value
  suggestionFlash.value = true
  setTimeout(() => { suggestionFlash.value = false }, 700)
}
const submit = handleSubmit(({ version: candidate }) => emit('apply', candidate))
</script>

<template>
  <Dialog :visible="open" modal header="Version gate" class="version-dialog" :style="{ width: 'min(480px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <form class="version-form" novalidate @submit.prevent="submit">
      <div class="bump-callout" :class="`bump-${kind}`">
        <div class="bump-callout-row"><strong>{{ kind }} bump required</strong><span class="bump-chip" :class="`bump-chip-${kind}`">{{ kind === 'major' ? 'MAJOR' : kind === 'minor' ? 'MINOR' : 'PATCH' }}</span></div>
        <span>{{ store.pendingChange?.action === 'delete' ? 'Deleting a criterion changes the document contract.' : kind === 'minor' ? 'Description, type, range, or ID changes alter scoring semantics.' : 'This property change needs a new patch.' }}</span>
      </div>
      <p class="current-version">Current version <strong>{{ store.activeRubric.version }}</strong> · Suggested <button type="button" class="version-suggestion" :title="`Insert ${suggestion}`" @click="applySuggestion">{{ suggestion }}</button></p>
      <label class="field-block">
        <span>New version</span>
        <InputText v-model="version" v-bind="versionAttrs" :class="{ 'suggestion-flash': suggestionFlash }" placeholder="MAJOR.MINOR.PATCH" aria-describedby="version-error" :invalid="!!errors.version || !!violation" autocomplete="off" />
        <small id="version-error" class="field-error">{{ errors.version || violation }}</small>
      </label>
      <div class="save-gate-row">
        <p v-if="!bumpValid" class="save-hint" :class="{ major: kind === 'major' }" role="note">{{ violation || `Save is disabled until you enter a ${kind} bump — try ${suggestion}.` }}</p>
        <div class="dialog-actions">
          <Button type="button" label="Cancel change" severity="secondary" text @click="emit('close')" />
          <Button type="submit" :label="store.pendingChange?.action === 'delete' ? 'Delete and save' : 'Save change'" :disabled="!meta.valid || !bumpValid" />
        </div>
      </div>
    </form>
  </Dialog>
</template>
