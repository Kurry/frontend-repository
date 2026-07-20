<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { NButton, NInput } from 'naive-ui'
import { FeedbackEntrySchema, REVIEWERS, FEEDBACK_VERDICTS } from '../contracts'
import { useAuditStore } from '../store'
const props=defineProps({ task:Object })
const store=useAuditStore()
function submit(values,actions){const result=store.addFeedback(props.task.slug,values);if(result.ok)actions.resetForm();else result.issues?.forEach(i=>actions.setFieldError(i.path.join('.'),i.message))}
</script>
<template>
  <Form v-slot="{ meta }" :validation-schema="toTypedSchema(FeedbackEntrySchema)" :initial-values="{reviewer:'',verdict:'',findings:''}" @submit="submit">
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="field-label" for="feedback-reviewer">Reviewer</label>
        <Field v-slot="{value,handleChange,handleBlur}" name="reviewer">
          <select id="feedback-reviewer" class="native-select" :value="value||''" @change="handleChange($event.target.value)" @blur="handleBlur">
            <option value="" disabled>Choose reviewer</option>
            <option v-for="r in REVIEWERS" :key="r" :value="r">{{ r }}</option>
          </select>
        </Field>
        <ErrorMessage class="error-text" name="reviewer"/>
      </div>
      <div>
        <label class="field-label" for="feedback-verdict">Feedback verdict</label>
        <Field v-slot="{value,handleChange,handleBlur}" name="verdict">
          <select id="feedback-verdict" class="native-select" :value="value||''" @change="handleChange($event.target.value)" @blur="handleBlur">
            <option value="" disabled>Choose feedback verdict</option>
            <option v-for="v in FEEDBACK_VERDICTS" :key="v" :value="v">{{ v }}</option>
          </select>
        </Field>
        <ErrorMessage class="error-text" name="verdict"/>
      </div>
    </div>
    <div class="mt-3"><label class="field-label" for="feedback-findings">Findings</label><Field v-slot="{value,handleChange,handleBlur}" name="findings"><NInput id="feedback-findings" type="textarea" :value="value" placeholder="Describe specific, actionable audit findings" :autosize="{minRows:3,maxRows:6}" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="findings"/></div>
    <NButton class="mt-3" attr-type="submit" type="primary" :disabled="!meta.valid">Add entry</NButton>
  </Form>
</template>
