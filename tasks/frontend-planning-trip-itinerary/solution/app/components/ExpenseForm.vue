<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700">
    <h3 class="text-lg font-bold mb-4">{{ expense ? 'Edit Expense' : 'Add Expense' }}</h3>
    <form @submit="onSubmit">
      <div class="space-y-4">
        <!-- Description & Amount Row -->
        <div class="flex gap-4">
          <div class="flex-2">
            <label class="block text-sm font-medium mb-1">Description <span class="text-red-500">*</span></label>
            <input
              v-model="description"
              v-bind="descriptionAttrs"
              type="text"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.description ? 'border-red-500' : 'border-slate-300'"
              maxlength="120"
            />
            <span class="text-xs text-red-500" v-if="errors.description">{{ errors.description }}</span>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Amount <span class="text-red-500">*</span></label>
            <input
              v-model.number="amount"
              v-bind="amountAttrs"
              type="number"
              step="0.01"
              min="0.01"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.amount ? 'border-red-500' : 'border-slate-300'"
            />
            <span class="text-xs text-red-500" v-if="errors.amount">{{ errors.amount }}</span>
          </div>
        </div>

        <!-- Currency & Day Row -->
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Currency <span class="text-red-500">*</span></label>
            <select
              v-model="currency"
              v-bind="currencyAttrs"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.currency ? 'border-red-500' : 'border-slate-300'"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
            </select>
            <span class="text-xs text-red-500" v-if="errors.currency">{{ errors.currency }}</span>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Day <span class="text-red-500">*</span></label>
            <select
              v-model="day"
              v-bind="dayAttrs"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.day ? 'border-red-500' : 'border-slate-300'"
            >
              <option value="">Select a day</option>
              <option v-for="d in tripDates" :key="d" :value="d">{{ d }}</option>
            </select>
            <span class="text-xs text-red-500" v-if="errors.day">{{ errors.day }}</span>
          </div>
        </div>

        <!-- Category & Payer Row -->
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Category <span class="text-red-500">*</span></label>
            <select
              v-model="category"
              v-bind="categoryAttrs"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.category ? 'border-red-500' : 'border-slate-300'"
            >
              <option value="Lodging">Lodging</option>
              <option value="Food">Food</option>
              <option value="Transit">Transit</option>
              <option value="Activities">Activities</option>
            </select>
            <span class="text-xs text-red-500" v-if="errors.category">{{ errors.category }}</span>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Paid By <span class="text-red-500">*</span></label>
            <select
              v-model="payer"
              v-bind="payerAttrs"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.payer ? 'border-red-500' : 'border-slate-300'"
            >
              <option value="Ava">Ava</option>
              <option value="Ben">Ben</option>
              <option value="Chloe">Chloe</option>
              <option value="Dan">Dan</option>
            </select>
            <span class="text-xs text-red-500" v-if="errors.payer">{{ errors.payer }}</span>
          </div>
        </div>

        <!-- Split Mode -->
        <div>
          <label class="block text-sm font-medium mb-1">Split Mode <span class="text-red-500">*</span></label>
          <select
            v-model="splitMode"
            v-bind="splitModeAttrs"
            class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
            :class="errors.splitMode ? 'border-red-500' : 'border-slate-300'"
          >
            <option value="per-capita">Equal (Per Capita)</option>
            <option value="weighted">Weighted</option>
          </select>
          <span class="text-xs text-red-500" v-if="errors.splitMode">{{ errors.splitMode }}</span>
        </div>

        <!-- Weights -->
        <div v-if="splitMode === 'weighted'" class="bg-slate-50 dark:bg-slate-700 p-3 rounded">
          <label class="block text-sm font-medium mb-2">Weights <span class="text-red-500">*</span></label>
          <div class="flex gap-2">
            <div v-for="person in ['Ava', 'Ben', 'Chloe', 'Dan']" :key="person" class="flex-1">
              <label class="block text-xs mb-1">{{ person }}</label>
              <input
                v-model.number="weights[person]"
                type="number"
                step="0.01"
                min="0"
                class="w-full p-1.5 text-sm border rounded dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
          </div>
          <span class="text-xs text-red-500 mt-1 block" v-if="errors.weights">{{ errors.weights }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button type="button" @click="$emit('cancel')" class="px-4 py-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600">Cancel</button>
        <button type="submit" :disabled="!meta.valid" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50">
          {{ expense ? 'Save' : 'Add' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { watch } from 'vue'

const props = defineProps<{
  expense?: any
}>()

const emit = defineEmits(['submit', 'cancel'])

const tripDates = [
  '2025-07-05',
  '2025-07-06',
  '2025-07-07',
  '2025-07-08',
  '2025-07-09',
  '2025-07-10',
  '2025-07-11'
]

const expenseSchema = z.object({
  description: z.string().trim().min(1, { message: 'Description is required' }).max(120, { message: 'Description is too long' }),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF'], { required_error: 'Currency is required' }),
  day: z.enum(['2025-07-05', '2025-07-06', '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11'], { required_error: 'Day is required' }),
  category: z.enum(['Lodging', 'Food', 'Transit', 'Activities'], { required_error: 'Category is required' }),
  payer: z.enum(['Ava', 'Ben', 'Chloe', 'Dan'], { required_error: 'Payer is required' }),
  splitMode: z.enum(['per-capita', 'weighted'], { required_error: 'Split mode is required' }),
  weights: z.object({
    Ava: z.number().min(0).optional(),
    Ben: z.number().min(0).optional(),
    Chloe: z.number().min(0).optional(),
    Dan: z.number().min(0).optional()
  }).optional()
}).refine(data => {
  if (data.splitMode === 'weighted') {
    if (!data.weights) return false
    const w = data.weights as any
    const sum = (w.Ava || 0) + (w.Ben || 0) + (w.Chloe || 0) + (w.Dan || 0)
    if (sum <= 0) return false
    if (w.Ava < 0 || w.Ben < 0 || w.Chloe < 0 || w.Dan < 0) return false
    return true
  }
  return true
}, {
  message: 'Invalid weights',
  path: ['weights']
})

const { handleSubmit, errors, defineField, meta } = useForm({
  validationSchema: toTypedSchema(expenseSchema),
  initialValues: props.expense || {
    description: '',
    amount: 0,
    currency: 'EUR',
    day: tripDates[0],
    category: 'Food',
    payer: 'Ava',
    splitMode: 'per-capita',
    weights: { Ava: 1, Ben: 1, Chloe: 1, Dan: 1 }
  }
})

const [description, descriptionAttrs] = defineField('description')
const [amount, amountAttrs] = defineField('amount')
const [currency, currencyAttrs] = defineField('currency')
const [day, dayAttrs] = defineField('day')
const [category, categoryAttrs] = defineField('category')
const [payer, payerAttrs] = defineField('payer')
const [splitMode, splitModeAttrs] = defineField('splitMode')
const [weights, weightsAttrs] = defineField('weights')

const onSubmit = handleSubmit((values) => {
  const submitValues = { ...values }
  if (submitValues.splitMode === 'per-capita') {
    delete submitValues.weights
  }
  emit('submit', submitValues)
})
</script>
