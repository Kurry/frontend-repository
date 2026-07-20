<script setup>
import { computed, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { PhArrowClockwise as ArrowClockwiseIcon, PhCheck as CheckIcon, PhCircleNotch as CircleNotchIcon, PhLockKey as LockKeyIcon, PhX as XIcon, PhXCircle as XCircleIcon } from '@phosphor-icons/vue'
import { cutReleaseSchema } from '../lib/contracts'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const { defineField, errors, handleSubmit, meta, resetForm, setFieldError, values } = useForm({
  validationSchema: toTypedSchema(cutReleaseSchema),
  initialValues: { name: '', notes: '' },
  validateOnMount: true,
})
const [name, nameAttrs] = defineField('name', { validateOnModelUpdate: true })
const [notes, notesAttrs] = defineField('notes', { validateOnModelUpdate: true })
const duplicateError = computed(() => values.name && store.versions.some((version) => version.name.toLowerCase() === values.name.toLowerCase()) ? `Version ${values.name} already exists.` : '')
const canSubmit = computed(() => meta.value.valid && !duplicateError.value && !store.cutRun.running)
const steps = [
  { id: 'collect-manifests', label: 'Collect manifests', detail: 'Freeze task membership from the selected release.' },
  { id: 'compute-digests', label: 'Compute digests', detail: 'Verify all 64-character content fingerprints.' },
  { id: 'rank-stability-check', label: 'Rank-stability check', detail: 'Correlation must meet the 0.95 threshold.' },
  { id: 'seal', label: 'Seal', detail: 'Write the immutable in-memory release record.' },
]
const statusFor = (id) => store.cutRun.steps.find((step) => step.id === id)?.status || 'pending'

watch(() => store.dialog, (dialog) => {
  if (dialog === 'cut' && !store.cutRun.running) resetForm({ values: { name: '', notes: '' } })
})

const submit = handleSubmit(async (payload) => {
  if (duplicateError.value) { setFieldError('name', duplicateError.value); return }
  const result = await store.startCut({ name: payload.name, notes: payload.notes })
  if (!result.success) setFieldError('name', result.message)
})

function onOpenChange(open) {
  if (!open) store.closeDialog()
}
</script>

<template>
  <DialogRoot :open="store.dialog === 'cut'" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content cut-dialog" @escape-key-down="store.cutRun.running && $event.preventDefault()" @pointer-down-outside="store.cutRun.running && $event.preventDefault()">
        <div class="dialog-header">
          <div class="dialog-icon"><LockKeyIcon :size="20" /></div>
          <div><DialogTitle class="dialog-title">Cut a sealed release</DialogTitle><DialogDescription class="dialog-description">Create an immutable version from the currently selected task manifest.</DialogDescription></div>
          <DialogClose v-if="!store.cutRun.running" class="icon-button dialog-close" aria-label="Close cut release"><XIcon :size="18" /></DialogClose>
        </div>

        <form v-if="!store.cutRun.request" class="dialog-body form-stack" novalidate @submit="submit">
          <div class="field-grid">
            <label class="field-label" for="version-name">Version name <span>required</span></label>
            <input id="version-name" v-model="name" v-bind="nameAttrs" class="text-input mono-input" placeholder="2.1.0" autocomplete="off" :aria-invalid="Boolean(errors.name || duplicateError)" aria-describedby="version-name-help version-name-error" />
            <div id="version-name-help" class="field-help">Semantic version · MAJOR.MINOR.PATCH</div>
            <p v-if="errors.name || duplicateError" id="version-name-error" class="field-error" role="alert">{{ errors.name || duplicateError }}</p>
          </div>
          <div class="field-grid">
            <div class="label-row"><label class="field-label" for="release-notes">Notes <span>optional</span></label><small :class="{ over: notes.length > 500 }">{{ notes.length }}/500</small></div>
            <textarea id="release-notes" v-model="notes" v-bind="notesAttrs" class="text-input textarea" rows="4" placeholder="What changed in this cut?" :aria-invalid="Boolean(errors.notes)" aria-describedby="notes-error" />
            <p v-if="errors.notes" id="notes-error" class="field-error" role="alert">{{ errors.notes }}</p>
          </div>
          <div class="immutability-note"><LockKeyIcon :size="17" weight="fill" /><p><strong>Sealed means immutable.</strong> The resulting manifest cannot be edited or deleted during this session.</p></div>
          <div class="dialog-actions"><button class="button secondary" type="button" @click="store.closeDialog">Cancel</button><button class="button primary" type="submit" :disabled="!canSubmit"><LockKeyIcon :size="16" />Begin cut</button></div>
        </form>

        <div v-else class="dialog-body cut-progress" aria-live="polite">
          <div class="cut-request"><span>Cutting</span><strong>v{{ store.cutRun.request.name }}</strong><small>{{ store.selectedVersion?.taskCount }} manifest tasks</small></div>
          <ol class="step-list">
            <li v-for="(step, index) in steps" :key="step.id" class="step-item" :class="statusFor(step.id)">
              <span class="step-number">{{ index + 1 }}</span>
              <div class="step-copy"><strong>{{ step.label }}</strong><small>{{ step.detail }}</small>
                <div v-if="step.id === 'rank-stability-check' && store.cutRun.correlation !== null" class="correlation-readout" :class="{ failed: statusFor(step.id) === 'failed', passed: statusFor(step.id) === 'complete' }">
                  <span>ρ {{ store.cutRun.correlation.toFixed(3) }}</span><span class="threshold-mark">threshold ≥ {{ store.cutRun.threshold.toFixed(2) }}</span>
                </div>
                <p v-if="step.id === 'rank-stability-check' && store.cutRun.error" class="rank-error" role="alert">{{ store.cutRun.error }}</p>
              </div>
              <Transition name="badge-crossfade" mode="out-in">
                <span :key="statusFor(step.id)" class="step-badge" :class="statusFor(step.id)">
                  <CircleNotchIcon v-if="statusFor(step.id) === 'running'" :size="14" class="spinner" />
                  <CheckIcon v-else-if="statusFor(step.id) === 'complete'" :size="14" weight="bold" />
                  <XCircleIcon v-else-if="statusFor(step.id) === 'failed'" :size="14" weight="fill" />
                  {{ statusFor(step.id) }}
                </span>
              </Transition>
            </li>
          </ol>
          <div v-if="statusFor('rank-stability-check') === 'failed'" class="dialog-actions"><span class="blocked-label">Seal blocked until the check passes.</span><button class="button danger" type="button" @click="store.retryRankCheck"><ArrowClockwiseIcon :size="16" />Retry check</button></div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
