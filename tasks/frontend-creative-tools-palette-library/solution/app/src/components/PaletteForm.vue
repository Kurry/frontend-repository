<template>
  <form
    class="max-w-2xl space-y-7"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- Name -->
    <div>
      <label :for="`${idPrefix}-name`" class="block font-mono text-xs tracking-[0.18em] uppercase text-ink-soft mb-1.5">Name</label>
      <input
        :id="`${idPrefix}-name`"
        v-model="name"
        type="text"
        autocomplete="off"
        class="field w-full"
        :class="{ 'field-error': errors.name }"
        :aria-invalid="errors.name ? 'true' : 'false'"
        :aria-describedby="errors.name ? `${idPrefix}-name-error` : undefined"
        placeholder="e.g. Cove Coastal"
      />
      <p v-if="errors.name" :id="`${idPrefix}-name-error`" class="error-note" role="alert">{{ errors.name }}</p>
    </div>

    <!-- Period -->
    <div>
      <label :for="`${idPrefix}-period`" class="block font-mono text-xs tracking-[0.18em] uppercase text-ink-soft mb-1.5">Period</label>
      <select
        :id="`${idPrefix}-period`"
        v-model="period"
        class="field w-full min-h-11"
        :class="{ 'field-error': errors.period }"
        :aria-invalid="errors.period ? 'true' : 'false'"
        :aria-describedby="errors.period ? `${idPrefix}-period-error` : undefined"
      >
        <option value="" disabled>Choose a period</option>
        <option v-for="p in periods" :key="p" :value="p">{{ p }}</option>
      </select>
      <p v-if="errors.period" :id="`${idPrefix}-period-error`" class="error-note" role="alert">{{ errors.period }}</p>
    </div>

    <!-- Swatches -->
    <fieldset>
      <legend class="font-mono text-xs tracking-[0.18em] uppercase text-ink-soft mb-1.5">
        Swatches (3 to 8 unique #RRGGBB)
      </legend>
      <p v-if="mode === 'edit'" class="font-serif italic text-sm text-ink-soft mb-3">
        Tick swatches to multi-select them for the batch H/S/L shift below.
      </p>
      <ul class="space-y-3">
        <li v-for="(swatch, idx) in swatches" :key="idx" class="flex flex-wrap items-start gap-3 px-2 py-1.5 -mx-2 transition-colors duration-200 hover:bg-parchment">
          <label
            v-if="mode === 'edit'"
            class="mt-2 flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-ink-soft cursor-pointer select-none"
          >
            <input
              type="checkbox"
              class="w-4 h-4 accent-oxblood"
              :checked="store.batchSelected.includes(idx)"
              :aria-label="`Select swatch ${idx + 1} for batch editing`"
              @change="toggleSelected(idx)"
            />
            Sel
          </label>

          <input
            type="color"
            :value="validHex(swatch) ? swatch : '#888888'"
            class="w-12 h-12 p-0 border border-rule cursor-pointer bg-parchment"
            :aria-label="`Swatch ${idx + 1} color picker`"
            @input="setSwatch(idx, $event.target.value.toUpperCase())"
          />

          <div class="flex-1 min-w-36">
            <label class="sr-only" :for="`${idPrefix}-hex-${idx}`">Swatch {{ idx + 1 }} hex value</label>
            <input
              :id="`${idPrefix}-hex-${idx}`"
              type="text"
              :value="swatch"
              maxlength="7"
              spellcheck="false"
              class="field w-full font-mono uppercase"
              :aria-describedby="`${idPrefix}-hex-cue-${idx}`"
              @input="setSwatch(idx, $event.target.value)"
              @paste="onPasteHex(idx, $event)"
              @keydown="onNudgeHex(idx, $event)"
            />
            <p :id="`${idPrefix}-hex-cue-${idx}`" class="mt-1 font-serif italic text-xs text-ink-soft">
              ≈ {{ nearestName(swatch) }}
              <span class="not-italic font-mono text-[10px] text-ink-soft/70 ml-1">(↑↓ lightness · ←→ hue · paste a hex)</span>
            </p>
          </div>

          <div class="flex items-center gap-2 mt-1">
            <span
              class="w-9 h-9 rounded-full border border-ink/25 swatch-surface"
              :style="{ backgroundColor: store.displayHex(previewSwatch(idx)) }"
              :aria-hidden="true"
            ></span>
            <button
              type="button"
              class="min-w-11 min-h-11 font-mono text-lg text-ink-soft transition-colors hover:text-error"
              :disabled="swatches.length <= 3"
              :aria-label="`Remove swatch ${idx + 1}`"
              @click="removeSwatch(idx)"
            >
              ×
            </button>
          </div>
        </li>
      </ul>

      <div class="flex flex-wrap items-center gap-3 mt-3">
        <button
          v-if="swatches.length < 8"
          type="button"
          class="min-h-11 px-4 border border-dashed border-ink-soft font-mono text-xs tracking-[0.14em] transition-colors hover:border-ink hover:text-oxblood"
          @click="addSwatch"
        >
          + Add Swatch
        </button>
        <p v-if="errors.swatches" class="error-note" role="alert">{{ errors.swatches }}</p>
      </div>
    </fieldset>

    <!-- Batch H/S/L tray (edit mode, multi-select) -->
    <div
      v-if="mode === 'edit' && store.batchSelected.length > 0"
      class="border border-ink/30 bg-parchment p-4"
      aria-label="Batch edit tray"
    >
      <p class="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-soft mb-3">
        Batch shift · {{ store.batchSelected.length }} swatch{{ store.batchSelected.length > 1 ? 'es' : '' }} selected
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="axis in axes" :key="axis.key">
          <label :for="`${idPrefix}-shift-${axis.key}`" class="flex justify-between font-mono text-xs text-ink-soft mb-1">
            <span>{{ axis.label }}</span>
            <span class="text-ink font-bold">{{ store.batchShift[axis.key] > 0 ? '+' : '' }}{{ store.batchShift[axis.key] }}</span>
          </label>
          <input
            :id="`${idPrefix}-shift-${axis.key}`"
            v-model.number="store.batchShift[axis.key]"
            type="range"
            :min="axis.min"
            :max="axis.max"
            step="1"
            class="w-full accent-oxblood"
          />
        </div>
      </div>
      <p v-if="shiftError" class="error-note mt-3" role="alert">{{ shiftError }}</p>
      <div class="flex gap-2 mt-4">
        <button
          type="button"
          class="min-h-11 px-4 bg-ink text-cream font-mono text-xs tracking-[0.14em] hover:bg-oxblood transition-colors"
          @click="applyShift"
        >
          Apply Shift
        </button>
        <button
          type="button"
          class="min-h-11 px-4 border border-ink font-mono text-xs tracking-[0.14em] hover:bg-ink hover:text-cream transition-colors"
          @click="cancelShift"
        >
          Cancel
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-rule">
      <button
        type="submit"
        :disabled="submitting"
        :aria-disabled="submitting"
        class="min-h-11 px-6 bg-oxblood text-cream font-mono text-xs tracking-[0.18em] uppercase transition-colors hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {{ mode === 'create' ? 'Create Palette' : 'Apply Changes' }}
      </button>
      <p class="font-mono text-[11px] text-ink-soft" aria-live="polite">{{ formStatus }}</p>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { usePaletteStore } from '../stores/palette';
import { paletteSchema, PALETTE_PERIODS, HEX_RE } from '../paletteSchema';
import { shiftHex, normalizeHexToHex } from '../colorUtils';
import { oaColorName } from '../lib/oaColorNames.js';

const props = defineProps({
  mode: { type: String, default: 'create' }, // create | edit
  palette: { type: Object, default: null },
  resetToken: { type: Number, default: 0 },
});

const emit = defineEmits(['saved']);
const store = usePaletteStore();
const periods = PALETTE_PERIODS;
const idPrefix = props.mode === 'create' ? 'create' : 'edit';

const axes = [
  { key: 'h', label: 'Hue (°)', min: -180, max: 180 },
  { key: 's', label: 'Saturation', min: -100, max: 100 },
  { key: 'l', label: 'Lightness', min: -100, max: 100 },
];

const initialValues = () =>
  props.mode === 'edit' && props.palette
    ? {
        name: props.palette.name,
        period: props.palette.period,
        swatches: [...props.palette.swatches],
        favorite: props.palette.favorite ?? false,
      }
    : {
        name: '',
        period: '',
        swatches: ['#211A12', '#B79E4B', '#7C2D26'],
        favorite: false,
      };

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(paletteSchema),
  initialValues: initialValues(),
});

const { value: name } = useField('name');
const { value: period } = useField('period');
const { value: swatches } = useField('swatches');

const submitting = ref(false);
const formStatus = ref('');
const shiftError = ref('');

// When a harmony apply or import rewrites the palette underneath an open editor, re-sync the draft.
watch(
  () => props.palette?.id,
  () => {
    if (props.mode === 'edit' && props.palette) {
      resetForm({ values: initialValues() });
      store.batchSelected = [];
      store.batchShift = { h: 0, s: 0, l: 0 };
      shiftError.value = '';
    }
  },
);

watch(
  () => props.resetToken,
  () => {
    if (props.mode === 'edit' && props.palette) {
      resetForm({ values: initialValues() });
      store.batchSelected = [];
      store.batchShift = { h: 0, s: 0, l: 0 };
      shiftError.value = '';
    }
  },
);

function validHex(hex) {
  return HEX_RE.test(hex || '');
}

function nearestName(hex) {
  if (!validHex(hex)) return 'enter a valid #RRGGBB hex';
  return oaColorName(hex).name;
}

function setSwatch(idx, value) {
  swatches.value[idx] = value;
}

function onPasteHex(idx, event) {
  const text = (event.clipboardData || window.clipboardData)?.getData('text')?.trim();
  if (!text) return;
  const match = text.match(/#?[0-9a-fA-F]{6}\b|#?[0-9a-fA-F]{3}\b/);
  if (match) {
    event.preventDefault();
    setSwatch(idx, normalizeHexToHex(match[0]));
  }
}

/** Keyboard nudge on a focused hex field: ↑↓ lightness, ←→ hue (Shift = bigger steps). */
function onNudgeHex(idx, event) {
  const key = event.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
  const current = swatches.value[idx];
  if (!validHex(current)) return;
  event.preventDefault();
  const big = event.shiftKey ? 3 : 1;
  if (key === 'ArrowUp') setSwatch(idx, shiftHex(current, 0, 0, 4 * big));
  else if (key === 'ArrowDown') setSwatch(idx, shiftHex(current, 0, 0, -4 * big));
  else if (key === 'ArrowRight') setSwatch(idx, shiftHex(current, 6 * big, 0, 0));
  else setSwatch(idx, shiftHex(current, -6 * big, 0, 0));
}

function addSwatch() {
  if (swatches.value.length < 8) swatches.value.push('#5C5240');
}

function removeSwatch(idx) {
  if (swatches.value.length > 3) {
    swatches.value.splice(idx, 1);
    store.batchSelected = store.batchSelected
      .filter((i) => i !== idx)
      .map((i) => (i > idx ? i - 1 : i));
  }
}

function toggleSelected(idx) {
  const set = new Set(store.batchSelected);
  if (set.has(idx)) set.delete(idx);
  else set.add(idx);
  store.batchSelected = [...set].sort((a, b) => a - b);
  shiftError.value = '';
}

/** Live batch preview: selected draft swatches shifted, others untouched. */
function previewSwatch(idx) {
  const hex = swatches.value[idx];
  if (!validHex(hex)) return '#888888';
  if (props.mode !== 'edit' || !store.batchSelected.includes(idx)) return hex;
  const { h, s, l } = store.batchShift;
  if (h === 0 && s === 0 && l === 0) return hex;
  return shiftHex(hex, h, s, l);
}

function applyShift() {
  shiftError.value = '';
  // Shift from the live draft (not the committed palette) so unsaved hex edits
  // are honored and the commit matches exactly what the tray previewed.
  const draft = [...swatches.value];
  const shifted = draft.map((hex, i) =>
    store.batchSelected.includes(i) && validHex(hex)
      ? shiftHex(hex, store.batchShift.h, store.batchShift.s, store.batchShift.l)
      : hex,
  );
  if (new Set(shifted.map((s) => String(s).toLowerCase())).size !== shifted.length) {
    shiftError.value =
      'Swatches must stay unique — this shift collapses two selected swatches into the same hex. Nothing was changed.';
    return;
  }
  if (!shifted.every((s) => validHex(s))) {
    shiftError.value = 'Swatches must remain valid #RRGGBB values.';
    return;
  }
  const result = store.applyBatchShift(props.palette.id, store.batchSelected, { ...store.batchShift }, draft);
  if (!result.ok) {
    shiftError.value = result.error;
    return;
  }
  swatches.value = [...shifted];
  store.batchSelected = [];
  store.batchShift = { h: 0, s: 0, l: 0 };
  store.announce(`Applied H/S/L shift to ${props.palette.name}`);
}

function cancelShift() {
  store.batchShift = { h: 0, s: 0, l: 0 };
  store.batchSelected = [];
  shiftError.value = '';
}

// Guard: rapid double-activation creates exactly one palette.
const onSubmit = handleSubmit((values) => {
  if (submitting.value) return;
  submitting.value = true;
  formStatus.value = '';
  try {
    if (props.mode === 'create') {
      const created = store.addPalette({
        name: values.name,
        period: values.period,
        swatches: [...values.swatches],
        favorite: false,
      });
      store.announce(`Created palette ${created.name}`);
      resetForm({
        values: { name: '', period: '', swatches: ['#211A12', '#B79E4B', '#7C2D26'], favorite: false },
      });
      formStatus.value = `“${created.name}” added to the library.`;
      emit('saved', created);
    } else if (props.palette) {
      store.updatePalette(props.palette.id, {
        name: values.name,
        period: values.period,
        swatches: [...values.swatches],
      });
      store.announce(`Updated palette ${values.name}`);
      formStatus.value = 'Changes applied.';
      emit('saved');
    }
  } finally {
    setTimeout(() => {
      submitting.value = false;
    }, 500);
  }
});
</script>

<style scoped>
.field {
  min-height: 2.75rem;
  border: 1px solid var(--color-rule);
  background: var(--color-parchment);
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}
.field:hover {
  border-color: var(--color-ink-soft);
}
.field-error {
  border-color: var(--color-error);
}
.error-note {
  margin-top: 0.4rem;
  color: var(--color-error);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
}
</style>
