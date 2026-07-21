<template>
  <Transition name="overlay">
    <div
      v-if="store.cartOpen"
      ref="rootRef"
      class="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      <div class="absolute inset-0 bg-ink/45" @click="store.cartOpen = false" aria-hidden="true"></div>

      <div class="absolute inset-y-0 right-0 w-full max-w-md bg-cream border-l border-rule shadow-2xl flex flex-col">
        <div class="px-5 py-4 border-b border-rule flex items-start justify-between gap-3">
          <div>
            <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink-soft">In memory only</p>
            <h2 id="cart-title" class="font-plate text-2xl leading-tight">Cart</h2>
          </div>
          <button
            type="button"
            data-autofocus
            class="min-w-11 min-h-11 -mr-2 inline-flex items-center justify-center font-mono text-sm hover:text-oxblood transition-colors"
            @click="store.cartOpen = false"
          >
            Close<span aria-hidden="true" class="ml-1 text-lg leading-none">×</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <!-- CartAdd form -->
          <form class="space-y-3" @submit.prevent="onAdd" novalidate>
            <h3 class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft border-b border-rule pb-1.5">Add a palette</h3>
            <div>
              <label for="cart-palette-name" class="block font-serif italic text-sm text-ink-soft mb-1">Palette name</label>
              <input
                id="cart-palette-name"
                v-model="form.paletteName"
                type="text"
                list="cart-palette-names"
                autocomplete="off"
                class="w-full min-h-11 border bg-parchment px-3 font-sans text-sm"
                :class="errors.paletteName ? 'border-error' : 'border-rule'"
                :aria-invalid="errors.paletteName ? 'true' : 'false'"
                aria-describedby="cart-name-error"
                placeholder="Must match a library palette exactly"
                @input="revalidateIfTouched"
              />
              <datalist id="cart-palette-names">
                <option v-for="p in store.palettes" :key="p.id" :value="p.name" />
              </datalist>
              <p v-if="errors.paletteName" id="cart-name-error" class="error-note" role="alert">{{ errors.paletteName }}</p>
            </div>
            <div>
              <label for="cart-quantity" class="block font-serif italic text-sm text-ink-soft mb-1">Quantity (1 to 5)</label>
              <input
                id="cart-quantity"
                v-model.number="form.quantity"
                type="number"
                min="1"
                max="5"
                step="1"
                class="w-full min-h-11 border bg-parchment px-3 font-mono text-sm"
                :class="errors.quantity ? 'border-error' : 'border-rule'"
                :aria-invalid="errors.quantity ? 'true' : 'false'"
                aria-describedby="cart-quantity-error"
                @input="revalidateIfTouched"
              />
              <p v-if="errors.quantity" id="cart-quantity-error" class="error-note" role="alert">{{ errors.quantity }}</p>
            </div>
            <button
              type="submit"
              class="min-h-11 px-5 bg-oxblood text-cream font-mono text-[11px] tracking-[0.16em] uppercase transition-colors hover:bg-ink"
            >
              Add to Cart
            </button>
            <p v-if="addedNote" class="font-mono text-[11px] text-moss" role="status">{{ addedNote }}</p>
          </form>

          <!-- Line items -->
          <section aria-label="Cart line items">
            <h3 class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft border-b border-rule pb-1.5 mb-3">
              Line items ({{ store.cartItems.length }})
            </h3>
            <p v-if="store.cartItems.length === 0" class="font-serif italic text-ink-soft py-6 text-center border border-dashed border-rule">
              Your cart is empty — add a palette above. It never checks out; this drawer is an in-memory sketchbook.
            </p>
            <ul v-else class="divide-y divide-rule">
              <li v-for="item in store.cartItems" :key="item.paletteName" class="py-3.5 flex items-center gap-3">
                <span class="flex-1 min-w-0">
                  <span class="block font-sans font-semibold truncate">{{ item.paletteName }}</span>
                  <span class="block font-mono text-[11px] text-ink-soft mt-0.5">Qty {{ item.quantity }}</span>
                </span>
                <button
                  type="button"
                  class="min-w-11 min-h-11 font-mono text-[11px] tracking-[0.12em] uppercase text-error/80 hover:text-error transition-colors"
                  :aria-label="`Remove ${item.paletteName} from cart`"
                  @click="store.removeFromCart(item.paletteName)"
                >
                  Remove
                </button>
              </li>
            </ul>
          </section>

          <p class="font-serif italic text-xs text-ink-soft border-t border-rule pt-4">
            No checkout, no payment — the cart is a place to hold palettes while you browse.
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { buildCartSchema } from '../paletteSchema';
import { useDialog } from '../composables/useDialog';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.cartOpen);
useDialog(open, rootRef, { onClose: () => (store.cartOpen = false) });

const form = reactive({ paletteName: '', quantity: 1 });
const errors = reactive({ paletteName: '', quantity: '' });
const touched = ref(false);
const addedNote = ref('');

const schema = computed(() => buildCartSchema(store.palettes.map((p) => p.name)));

function validate() {
  const result = schema.value.safeParse({ paletteName: form.paletteName, quantity: form.quantity });
  errors.paletteName = '';
  errors.quantity = '';
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === 'paletteName' && !errors.paletteName) errors.paletteName = issue.message;
      if (field === 'quantity' && !errors.quantity) errors.quantity = issue.message;
    }
  }
  return result.success;
}

function revalidateIfTouched() {
  addedNote.value = '';
  if (touched.value) validate();
}

function onAdd() {
  touched.value = true;
  if (!validate()) return;
  store.addToCart({ paletteName: form.paletteName, quantity: form.quantity });
  addedNote.value = `Added “${form.paletteName}” × ${form.quantity}.`;
  store.announce(`Added ${form.paletteName} to the cart, quantity ${form.quantity}`);
  form.paletteName = '';
  form.quantity = 1;
  touched.value = false;
  errors.paletteName = '';
  errors.quantity = '';
}

// Prefill from "Add to Cart" buttons in Browse / Detail.
watch(
  () => store.cartPrefill,
  (name) => {
    if (name && store.cartOpen) {
      form.paletteName = name;
      form.quantity = 1;
      touched.value = false;
      errors.paletteName = '';
      errors.quantity = '';
      addedNote.value = '';
      store.cartPrefill = '';
    }
  },
);

watch(
  () => store.cartOpen,
  (value) => {
    if (value && store.cartPrefill) {
      form.paletteName = store.cartPrefill;
      form.quantity = 1;
      touched.value = false;
      errors.paletteName = '';
      errors.quantity = '';
      store.cartPrefill = '';
    }
  },
);
</script>

<style scoped>
.error-note {
  margin-top: 0.4rem;
  color: var(--color-error);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}
</style>
