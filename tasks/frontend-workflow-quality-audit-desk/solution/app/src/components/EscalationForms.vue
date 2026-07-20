<script setup>
import { ref } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { NButton, NInput, NSelect, NModal } from 'naive-ui'
import { EscalationSchema, ResolutionSchema, ESCALATION_CATEGORIES } from '../contracts'
import { useAuditStore } from '../store'
const props=defineProps({ task:Object })
const store=useAuditStore()
const escalationOpen=ref(false)
const options=ESCALATION_CATEGORIES.map(x=>({label:x,value:x}))
function escalate(values,actions){const r=store.escalate(props.task.slug,values);if(!r.ok)r.issues?.forEach(i=>actions.setFieldError(i.path.join('.'),i.message));else escalationOpen.value=false}
function resolve(values,actions){const r=store.resolve(props.task.slug,values);if(!r.ok)r.issues?.forEach(i=>actions.setFieldError(i.path.join('.'),i.message))}
</script>
<template>
  <div v-if="task.stage==='held'" class="rounded-xl border border-[#efd79f] bg-[#fff9eb] p-4">
    <h3 class="font-extrabold">Held task actions</h3><p class="mb-3 mt-1 text-xs text-muted">Escalate the blocker or apply deterministic simulated fixes.</p>
    <div class="flex flex-wrap gap-2"><NButton type="error" @click="escalationOpen=true">Escalate task</NButton><NButton @click="store.applyFixes(task.slug)">Apply simulated fixes</NButton></div>
  </div>
  <NModal v-model:show="escalationOpen" preset="card" title="Escalate task" :style="{width:'min(560px,calc(100vw - 24px))'}" :mask-closable="false" :close-on-esc="true">
    <p class="mb-4 text-sm text-muted">Capture the blocking category and a specific summary.</p>
    <Form :validation-schema="toTypedSchema(EscalationSchema)" :initial-values="{category:null,summary:''}" @submit="escalate">
      <label class="field-label">Escalation category</label><Field v-slot="{value,handleChange,handleBlur}" name="category"><NSelect :value="value" placeholder="Choose escalation category" :options="options" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="category"/>
      <label class="field-label mt-3">Escalation summary</label><Field v-slot="{value,handleChange,handleBlur}" name="summary"><NInput type="textarea" :value="value" placeholder="Describe the blocking audit issue" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="summary"/>
      <div class="mt-4 flex justify-end gap-2"><NButton @click="escalationOpen=false">Cancel</NButton><NButton type="error" attr-type="submit">Escalate task</NButton></div>
    </Form>
  </NModal>
  <div v-if="task.stage==='escalated'" class="rounded-xl border border-[#edc5bb] bg-[#fff5f1] p-4">
    <h3 class="font-extrabold">Resolve escalation</h3><p class="mb-3 mt-1 text-xs text-muted">{{ task.escalation?.category }} · {{ task.escalation?.summary }}</p>
    <Form v-slot="{meta,resetForm}" :validation-schema="toTypedSchema(ResolutionSchema)" :initial-values="{note:''}" @submit="resolve">
      <label class="field-label">Resolution note</label><Field v-slot="{value,handleChange,handleBlur}" name="note"><NInput type="textarea" :value="value" placeholder="Describe how the escalation was resolved" @update:value="handleChange" @blur="handleBlur"/></Field><ErrorMessage class="error-text" name="note"/>
      <div class="mt-3 flex gap-2"><NButton type="primary" attr-type="submit">Resolve task</NButton><NButton @click="resetForm()">Cancel</NButton></div>
    </Form>
  </div>
  <div v-if="task.stage==='resolved' && task.resolution" class="rounded-xl border border-[#b8d9d5] bg-[#eff9f7] p-4"><h3 class="font-extrabold">Resolution</h3><p class="mt-1 text-sm">{{ task.resolution.note }}</p></div>
</template>
