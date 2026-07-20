<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700">
    <h3 class="text-lg font-bold mb-4">{{ stop ? 'Edit Stop' : 'Add Stop' }}</h3>
    <form @submit="onSubmit">
      <div class="space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium mb-1">Title <span class="text-red-500">*</span></label>
          <input
            v-model="title"
            v-bind="titleAttrs"
            type="text"
            class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
            :class="errors.title ? 'border-red-500' : 'border-slate-300'"
          />
          <span class="text-xs text-red-500" v-if="errors.title">{{ errors.title }}</span>
        </div>

        <!-- Day and Category Row -->
        <div class="flex gap-4">
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

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Category <span class="text-red-500">*</span></label>
            <select
              v-model="category"
              v-bind="categoryAttrs"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.category ? 'border-red-500' : 'border-slate-300'"
            >
              <option value="">Select a category</option>
              <option value="sightseeing">Sightseeing</option>
              <option value="dining">Dining</option>
              <option value="lodging">Lodging</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
            <span class="text-xs text-red-500" v-if="errors.category">{{ errors.category }}</span>
          </div>
        </div>

        <!-- Times -->
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Start Time (HH:MM)</label>
            <input
              v-model="startTime"
              v-bind="startTimeAttrs"
              type="time"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.startTime ? 'border-red-500' : 'border-slate-300'"
            />
            <span class="text-xs text-red-500" v-if="errors.startTime">{{ errors.startTime }}</span>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">End Time (HH:MM)</label>
            <input
              v-model="endTime"
              v-bind="endTimeAttrs"
              type="time"
              class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
              :class="errors.endTime ? 'border-red-500' : 'border-slate-300'"
            />
            <span class="text-xs text-red-500" v-if="errors.endTime">{{ errors.endTime }}</span>
          </div>
        </div>

        <!-- Location -->
        <div>
          <label class="block text-sm font-medium mb-1">Location</label>
          <input
            v-model="location"
            v-bind="locationAttrs"
            type="text"
            class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600"
            :class="errors.location ? 'border-red-500' : 'border-slate-300'"
            maxlength="120"
          />
          <span class="text-xs text-red-500" v-if="errors.location">{{ errors.location }}</span>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium mb-1">Notes</label>
          <textarea
            v-model="notes"
            v-bind="notesAttrs"
            class="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 h-24 resize-none"
            :class="errors.notes ? 'border-red-500' : 'border-slate-300'"
            maxlength="400"
          ></textarea>
          <span class="text-xs text-red-500" v-if="errors.notes">{{ errors.notes }}</span>
        </div>

      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button type="button" @click="$emit('cancel')" class="px-4 py-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600">Cancel</button>
        <button type="submit" :disabled="!meta.valid && meta.touched" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50">
          {{ stop ? 'Save' : 'Add' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { computed } from 'vue'

const props = defineProps<{
  stop?: any
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

const stopSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(80, { message: 'Title is too long' }),
  day: z.enum(['2025-07-05', '2025-07-06', '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11'], { required_error: 'Day is required' }),
  category: z.enum(['sightseeing', 'dining', 'lodging', 'transport', 'other'], { required_error: 'Category is required' }),
  location: z.string().max(120).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Must be HH:MM' }).optional().nullable().or(z.literal('')),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Must be HH:MM' }).optional().nullable().or(z.literal(''))
}).refine((data) => {
  if (data.endTime && !data.startTime) {
    return false
  }
  return true
}, {
  message: 'End time requires a start time',
  path: ['endTime']
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime
  }
  return true
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

const { handleSubmit, errors, defineField, meta } = useForm({
  validationSchema: toTypedSchema(stopSchema),
  initialValues: props.stop || {
    title: '',
    day: tripDates[0],
    category: 'sightseeing',
    location: '',
    notes: '',
    startTime: '',
    endTime: ''
  }
})

const [title, titleAttrs] = defineField('title')
const [day, dayAttrs] = defineField('day')
const [category, categoryAttrs] = defineField('category')
const [location, locationAttrs] = defineField('location')
const [notes, notesAttrs] = defineField('notes')
const [startTime, startTimeAttrs] = defineField('startTime')
const [endTime, endTimeAttrs] = defineField('endTime')

const onSubmit = handleSubmit((values) => {
  const submitValues = { ...values }
  if (!submitValues.startTime) delete submitValues.startTime
  if (!submitValues.endTime) delete submitValues.endTime
  if (!submitValues.location) delete submitValues.location
  if (!submitValues.notes) delete submitValues.notes

  emit('submit', submitValues)
})
</script>
