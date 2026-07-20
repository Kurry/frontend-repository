<script setup>
import { computed, nextTick, watch } from 'vue'
import { Field, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NButton, NCard, NInput, NModal } from 'naive-ui'
import IconCheckCircle from '~icons/lucide/circle-check-big'
import { useQcStore } from '../store'
const store = useQcStore()
const submission = computed(() => store.activeSubmission)
const schema = z.object({}) // No fields required for approve, just a submission
const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema: toTypedSchema(schema), validateOnMount: true })
const submit = handleSubmit(async () => { if (store.approve(submission.value.id)) { store.dialogs.approve = false; await nextTick(() => resetForm()) } })
</script>
<template>
  <NModal v-model:show="store.dialogs.approve" :mask-closable="true" class="review-modal" transform-origin="center" @esc="store.dialogs.approve = false">
    <NCard role="dialog" aria-modal="true" aria-labelledby="approve-title" class="modal-card">
      <div class="modal-heading"><span class="modal-icon approve-icon"><IconCheckCircle /></span><div><p class="eyebrow">Release gate</p><h2 id="approve-title">Approve submission</h2><p>This will approve the submission and release its payout.</p></div></div>
      <form class="review-form" novalidate @submit.prevent="submit">
        <div class="modal-actions"><NButton @click="store.dialogs.approve = false">Cancel</NButton><NButton attr-type="submit" type="primary" :disabled="isSubmitting" :loading="isSubmitting"><IconCheckCircle /> Confirm approval</NButton></div>
      </form>
    </NCard>
  </NModal>
</template>
