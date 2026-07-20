<script setup>
import { watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { PhFileArrowUp as FileArrowUpIcon, PhFlask as FlaskIcon, PhUploadSimple as UploadSimpleIcon, PhX as XIcon } from '@phosphor-icons/vue'
import { validatePackText, describeZodError } from '../lib/contracts'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const importSchema = z.object({
  releasePack: z.string().min(1, 'Release pack JSON is required.').superRefine((raw, ctx) => {
    const result = validatePackText(raw)
    if (!result.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message })
  }),
})
const { defineField, errors, handleSubmit, meta, resetForm, setFieldError, setFieldValue, validateField } = useForm({ validationSchema: toTypedSchema(importSchema), initialValues: { releasePack: '' }, validateOnMount: true })
const [releasePack, releasePackAttrs] = defineField('releasePack', { validateOnModelUpdate: true })

watch(() => store.dialog, (dialog) => { if (dialog === 'import') resetForm({ values: { releasePack: '' } }) })

async function chooseSample() {
  setFieldValue('releasePack', JSON.stringify(store.importSample, null, 2))
  await validateField('releasePack')
}

async function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  setFieldValue('releasePack', await file.text())
  await validateField('releasePack')
}

const submit = handleSubmit((payload) => {
  const validated = validatePackText(payload.releasePack)
  if (!validated.success) return
  const result = store.applyImport(validated.data)
  if (!result.success) setFieldError('releasePack', `Release pack JSON field ${describeZodError(result.error)}`)
})
</script>

<template>
  <DialogRoot :open="store.dialog === 'import'" @update:open="!$event && store.closeDialog()">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content import-dialog">
        <div class="dialog-header"><div class="dialog-icon"><UploadSimpleIcon :size="20" /></div><div><DialogTitle class="dialog-title">Import release pack</DialogTitle><DialogDescription class="dialog-description">Validate and replace the current session with a conforming release package.</DialogDescription></div><DialogClose class="icon-button dialog-close" aria-label="Close import"><XIcon :size="18" /></DialogClose></div>
        <form class="dialog-body form-stack" novalidate @submit="submit">
          <div class="import-options">
            <label class="file-picker" for="pack-file"><FileArrowUpIcon :size="22" /><span><strong>Choose a JSON file</strong><small>.json files up to your browser limit</small></span><input id="pack-file" type="file" accept=".json,application/json" @change="onFile" /></label>
            <button class="sample-picker" type="button" @click="chooseSample"><FlaskIcon :size="22" /><span><strong>Use seeded sample pack</strong><small>3 valid versions · cycle 7</small></span></button>
          </div>
          <div class="or-divider"><span>or paste raw JSON</span></div>
          <div class="field-grid"><label class="field-label" for="pack-json">Release pack JSON <span>required</span></label><textarea id="pack-json" v-model="releasePack" v-bind="releasePackAttrs" class="text-input code-input" rows="12" spellcheck="false" placeholder="{&#10;  &quot;schemaVersion&quot;: &quot;larkspur-release-pack/v1&quot;,&#10;  …&#10;}" :aria-invalid="Boolean(errors.releasePack)" aria-describedby="pack-json-error" /><p v-if="errors.releasePack" id="pack-json-error" class="field-error import-error" role="alert">{{ errors.releasePack }}</p></div>
          <div class="import-warning">A valid import replaces versions, rotation, and timeline in this session. Invalid documents never mutate state.</div>
          <div class="dialog-actions"><button class="button secondary" type="button" @click="store.closeDialog">Cancel</button><button class="button primary" type="submit" :disabled="!meta.valid"><UploadSimpleIcon :size="16" />Confirm import</button></div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
