<template>
  <Transition name="overlay">
    <div
      v-if="store.subscribeVisible"
      ref="rootRef"
      class="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-title"
    >
      <div class="absolute inset-0 bg-ink/50" @click="dismiss" aria-hidden="true"></div>

      <div class="relative bg-parchment border border-ink shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          data-autofocus
          class="absolute top-3 right-3 min-w-11 min-h-11 inline-flex items-center justify-center font-mono text-sm hover:text-oxblood transition-colors"
          :aria-label="`Close the subscribe popup`"
          @click="dismiss"
        >
          Close<span aria-hidden="true" class="ml-1 text-lg leading-none">×</span>
        </button>

        <div v-if="!submitted">
          <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink-soft mb-2">The O&amp;A dispatch</p>
          <h2 id="subscribe-title" class="font-plate text-2xl mb-2">Join the Newsletter</h2>
          <p class="font-serif italic text-sm text-ink-soft mb-5">
            One letter a month on pigment histories, new palettes, and archive notes. In-memory only — nothing is sent.
          </p>

          <form class="space-y-4" @submit.prevent="onSubmit" novalidate>
            <div>
              <label for="sub-email" class="block font-mono text-xs tracking-[0.18em] uppercase text-ink-soft mb-1.5">Email</label>
              <input
                id="sub-email"
                v-model="email"
                type="email"
                autocomplete="off"
                placeholder="name@example.com"
                class="w-full min-h-11 border bg-cream px-3 font-sans text-sm"
                :class="errors.email ? 'border-error' : 'border-rule'"
                :aria-invalid="errors.email ? 'true' : 'false'"
                aria-describedby="sub-email-error"
              />
              <p v-if="errors.email" id="sub-email-error" class="mt-1.5 font-mono text-[11px] text-error" role="alert">{{ errors.email }}</p>
            </div>
            <button
              type="submit"
              class="w-full min-h-11 bg-oxblood text-cream font-mono text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div v-else class="py-8 text-center" role="status">
          <p class="font-plate text-2xl mb-2">You're on the list.</p>
          <p class="font-serif italic text-sm text-ink-soft">The SubscribeRequest was kept in memory — no network call was made.</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { usePaletteStore } from '../stores/palette';
import { subscribeSchema } from '../paletteSchema';
import { useDialog } from '../composables/useDialog';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.subscribeVisible);
useDialog(open, rootRef, { onClose: dismiss });

const submitted = ref(false);
let idleTimer = null;
let closeTimer = null;

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(subscribeSchema),
  initialValues: { email: '' },
});
const { value: email } = useField('email');

function show() {
  if (store.subscribeDismissed || store.subscribeVisible) return;
  store.subscribeVisible = true;
}

function dismiss() {
  store.subscribeVisible = false;
  store.subscribeDismissed = true; // stays dismissed for the rest of the session
}

const onSubmit = handleSubmit(() => {
  submitted.value = true;
  store.announce('Subscribed — the request was stored in memory only');
  closeTimer = setTimeout(() => {
    store.subscribeVisible = false;
    store.subscribeDismissed = true;
  }, 1600);
});

function resetIdle() {
  if (store.subscribeDismissed || store.subscribeVisible) return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(show, 45000);
}

function onScroll() {
  if (store.subscribeDismissed || store.subscribeVisible) return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total > 0 && window.scrollY / total > 0.5) show();
}

onMounted(() => {
  resetIdle();
  window.addEventListener('pointerdown', resetIdle, { passive: true });
  window.addEventListener('keydown', resetIdle, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  if (idleTimer) clearTimeout(idleTimer);
  if (closeTimer) clearTimeout(closeTimer);
  window.removeEventListener('pointerdown', resetIdle);
  window.removeEventListener('keydown', resetIdle);
  window.removeEventListener('scroll', onScroll);
});
</script>
