<script setup>
import { computed } from 'vue'
import {
  PhTextT, PhSignature, PhTextAlignLeft, PhCalendarBlank, PhHash, PhCheckSquare,
  PhRadioButton, PhCaretDown, PhImageSquare, PhPaperclip, PhPhone, PhGridFour,
  PhSeal, PhUserCircle,
} from '@phosphor-icons/vue'
import AddSubmitterDialog from './AddSubmitterDialog.vue'
import { TYPE_LABELS, useWorkspaceStore } from '../store'

const store = useWorkspaceStore()

const icons = {
  text: PhTextT,
  signature: PhSignature,
  initials: PhTextAlignLeft,
  date: PhCalendarBlank,
  number: PhHash,
  checkbox: PhCheckSquare,
  radio: PhRadioButton,
  select: PhCaretDown,
  image: PhImageSquare,
  file: PhPaperclip,
  phone: PhPhone,
  cells: PhGridFour,
  stamp: PhSeal,
}

const fieldTypes = computed(() => Object.keys(TYPE_LABELS).map((type) => ({
  type,
  label: TYPE_LABELS[type],
  icon: icons[type],
})))
</script>

<template>
  <aside class="left-rail" aria-label="Template tools">
    <section class="rail-section rail-templates">
      <h2 class="eyebrow">Templates</h2>
      <div class="rail-list" role="list">
        <button
          v-for="template in store.templates"
          :key="template.id"
          type="button"
          class="template-row"
          :class="{ active: template.id === store.activeTemplateId }"
          :aria-current="template.id === store.activeTemplateId ? 'true' : undefined"
          @click="store.openTemplate(template.id)"
        >
          <span>{{ template.name }}</span>
          <span class="row-meta">{{ template.fields.length }} {{ template.fields.length === 1 ? 'field' : 'fields' }}</span>
        </button>
      </div>
    </section>

    <section class="rail-section rail-submitters">
      <div class="section-heading">
        <h2 class="eyebrow">Submitters</h2>
        <AddSubmitterDialog />
      </div>
      <div class="rail-list" role="list" aria-label="Submitters">
        <button
          v-for="submitter in store.submitters"
          :key="submitter.id"
          type="button"
          class="submitter-row" :style="{ '--submitter-color': submitter.color }"
          :class="{ active: submitter.id === store.activeSubmitterId }"
          @click="store.selectSubmitter(submitter.id)"
        >
          <span class="submitter-main">
            <span class="submitter-swatch" :style="{ backgroundColor: submitter.color }" />
            <span>{{ submitter.name }}</span>
          </span>
          <span v-if="submitter.id === store.activeSubmitterId" class="active-label">Active</span>
          <span v-else class="row-meta">{{ store.fieldCounts[submitter.name] }} on page</span>
        </button>
      </div>
    </section>

    <section class="rail-section rail-fields">
      <h2 class="eyebrow">Fields</h2>
      <p class="section-copy">Add a field to the active submitter, then place it on the document.</p>
      <div class="palette-grid">
        <button
          v-for="item in fieldTypes"
          :key="item.type"
          type="button"
          class="palette-button"
          :aria-label="`Add ${item.label} field for ${store.activeSubmitter?.name}`"
          @click="store.addField(item.type)"
        >
          <span class="palette-icon"><component :is="item.icon" :size="15" /></span>
          {{ item.label }}
        </button>
      </div>
      <div class="active-party-note">
        <PhUserCircle :size="16" />
        New fields go to <strong>{{ store.activeSubmitter?.name }}</strong>
      </div>
    </section>
  </aside>
</template>
