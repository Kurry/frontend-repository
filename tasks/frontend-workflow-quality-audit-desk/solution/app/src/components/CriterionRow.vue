<script setup>
import { ref, computed } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { NButton, NInput } from 'naive-ui'
import { PhCaretDown as CaretDown } from '@phosphor-icons/vue'
import { CriterionFailVerdictSchema, GUIDANCE } from '../contracts'
import { useAuditStore } from '../store'

const props=defineProps({ task:Object, criterion:String })
const store=useAuditStore()
const failing=ref(false)
const open=computed({get:()=>!!store.disclosure[props.criterion],set:v=>store.disclosure[props.criterion]=v})
const current=computed(()=>props.task.criteria[props.criterion])
function pass(){failing.value=false;store.saveCriterion(props.task.slug,props.criterion,'pass')}
function saved(_,actions){const res=store.saveCriterion(props.task.slug,props.criterion,'fail',_.rationale);if(res.ok){failing.value=false;store.notify('Criterion verdict saved');actions.resetForm()}else actions.setFieldError('rationale',res.error)}
</script>

<template>
  <div class="border-b border-[#e5e8e1] py-3 last:border-0">
    <div class="flex flex-wrap items-center gap-2">
      <button class="min-w-0 flex-1 text-left text-[13px] font-bold" type="button" :aria-expanded="open" @click="open=!open">
        <span class="flex items-center gap-2"><CaretDown :class="['shrink-0 transition-transform',open&&'rotate-180']" :size="15"/> <span class="break-all">{{ criterion }}</span></span>
      </button>
      <span v-if="current.verdict" :class="['check-pill',current.verdict==='pass'?'check-pass':'check-fail']" @click="current.verdict==='fail'&&(failing=!failing)">{{ current.verdict }}</span>
      <NButton size="tiny" :disabled="!task.firstRunCompleted" :type="current.verdict==='pass'?'primary':'default'" @click="pass">Pass</NButton>
      <NButton size="tiny" :disabled="!task.firstRunCompleted" :type="current.verdict==='fail'?'error':'default'" @click="failing=true">Fail</NButton>
    </div>
    <Transition name="expand"><p v-if="open" class="ml-6 mt-2 text-xs leading-5 text-muted">{{ GUIDANCE[criterion] }}</p></Transition>
    <p v-if="current.verdict==='fail' && !failing" class="ml-6 mt-2 rounded-lg bg-[#fff5f1] p-2 text-xs text-[#84392c]">{{ current.rationale }}</p>
    <Form v-if="failing" v-slot="{ meta }" :validation-schema="toTypedSchema(CriterionFailVerdictSchema)" :initial-values="{criterion,verdict:'fail',rationale:current.rationale||''}" class="ml-6 mt-3" @submit="saved">
      <Field name="criterion" type="hidden"/><Field name="verdict" type="hidden"/>
      <label class="field-label" :for="`rationale-${criterion}`">Fail rationale</label>
      <Field v-slot="{ value, handleChange, handleBlur }" name="rationale">
        <NInput :id="`rationale-${criterion}`" type="textarea" :value="value" placeholder="Explain why this criterion fails" :autosize="{minRows:2,maxRows:4}" @update:value="handleChange" @blur="handleBlur" />
      </Field>
      <ErrorMessage name="rationale" class="error-text"/>
      <div class="mt-2 flex gap-2"><NButton size="small" attr-type="submit" type="primary" :disabled="!meta.valid">Save fail verdict</NButton><NButton size="small" @click="failing=false">Cancel</NButton></div>
    </Form>
  </div>
</template>
