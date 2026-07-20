<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { NButton, NInput, NSelect } from 'naive-ui'
import { FeedbackEntrySchema, REVIEWERS, FEEDBACK_VERDICTS } from '../contracts'
import { useAuditStore } from '../store'
const props=defineProps({ task:Object })
const store=useAuditStore()
const options=a=>a.map(x=>({label:x,value:x}))
function submit(values,actions){const result=store.addFeedback(props.task.slug,values);if(result.ok)actions.resetForm();else result.issues?.forEach(i=>actions.setFieldError(i.path.join('.'),i.message))}
</script>
<template>
  <Form v-slot="{ meta }" :validation-schema="toTypedSchema(FeedbackEntrySchema)" :initial-values="{reviewer:null,verdict:null,findings:''}" @submit="submit">
    <div class="grid gap-3 sm:grid-cols-2">
      <div><label class="field-label">Reviewer</label><Field v-slot="{value,handleChange,handleBlur}" name="reviewer"><NSelect :value="value" placeholder="Choose reviewer" :options="options(REVIEWERS)" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="reviewer"/></div>
      <div><label class="field-label">Feedback verdict</label><Field v-slot="{value,handleChange,handleBlur}" name="verdict"><NSelect :value="value" placeholder="Choose feedback verdict" :options="options(FEEDBACK_VERDICTS)" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="verdict"/></div>
    </div>
    <div class="mt-3"><label class="field-label">Findings</label><Field v-slot="{value,handleChange,handleBlur}" name="findings"><NInput type="textarea" :value="value" placeholder="Describe specific, actionable audit findings" :autosize="{minRows:3,maxRows:6}" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="findings"/></div>
    <NButton class="mt-3" attr-type="submit" type="primary" :disabled="!meta.valid">Add entry</NButton>
  </Form>
</template>
