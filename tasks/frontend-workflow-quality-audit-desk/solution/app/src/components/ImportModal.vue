<script setup>
import { ref } from 'vue'
import { z } from 'zod'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { NButton, NInput, NModal } from 'naive-ui'
import { AuditPackageSchema, firstZodError } from '../contracts'
import { useAuditStore } from '../store'
const store=useAuditStore()
const fileError=ref('')
const textSchema=z.object({packageJson:z.string().min(1,'Audit Package JSON is required').superRefine((value,ctx)=>{let parsed;try{parsed=JSON.parse(value)}catch{ctx.addIssue({code:z.ZodIssueCode.custom,message:'Audit Package JSON is malformed'});return}const valid=AuditPackageSchema.safeParse(parsed);if(!valid.success)ctx.addIssue({code:z.ZodIssueCode.custom,message:firstZodError(valid.error)})})})
function submit(values,actions){const result=store.importPackage(values.packageJson);if(!result.ok)actions.setFieldError('packageJson',result.error)}
function filePicked(ev,setValue){fileError.value='';const file=ev.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setValue(String(reader.result));reader.onerror=()=>fileError.value='Audit Package JSON file could not be read';reader.readAsText(file)}
</script>
<template>
  <NModal v-model:show="store.importOpen" preset="card" title="Import package" :style="{width:'min(680px,calc(100vw - 24px))'}" :mask-closable="false">
    <p class="mb-4 text-sm text-muted">Paste or pick a contract-valid Audit Package JSON file. Invalid input leaves the desk unchanged.</p>
    <Form v-slot="{meta,setFieldValue}" :validation-schema="toTypedSchema(textSchema)" :initial-values="{packageJson:''}" @submit="submit">
      <label class="field-label" for="package-file">Pick JSON file</label><input id="package-file" class="mb-3 block w-full rounded-lg border border-line p-2 text-sm" type="file" accept="application/json,.json" @change="filePicked($event,v=>setFieldValue('packageJson',v,true))"/><p v-if="fileError" class="error-text">{{ fileError }}</p>
      <label class="field-label" for="package-json">Audit Package JSON</label>
      <Field v-slot="{value,handleChange,handleBlur}" name="packageJson"><NInput id="package-json" type="textarea" :value="value" placeholder="Paste Audit Package JSON" :autosize="{minRows:10,maxRows:18}" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="packageJson"/>
      <div class="mt-4 flex justify-end gap-2"><NButton @click="store.importOpen=false">Cancel</NButton><NButton type="primary" attr-type="submit">Import package</NButton></div>
    </Form>
  </NModal>
</template>
