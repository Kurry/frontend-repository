<template>
  <div v-if="isVisible" class="fixed inset-0 z-[110] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" @click="close" aria-hidden="true"></div>
    <div class="bg-white rounded shadow-xl overflow-hidden max-w-md w-full z-10 p-6 relative" v-motion-fade>
      <button @click="close" class="absolute top-4 right-4 text-gray-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-black rounded">
        <span class="sr-only">Close</span>
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="!submitted">
        <h2 id="modal-title" class="text-xl font-serif mb-4">Join our newsletter</h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label for="subEmail" class="block text-sm font-sans font-medium mb-1">Email</label>
            <input
              id="subEmail"
              v-model="email"
              type="email"
              placeholder="name@example.com"
              class="w-full border rounded px-3 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-black"
              :class="{'border-red-500': errors.email, 'border-gray-300': !errors.email}"
            />
            <p v-if="errors.email" class="text-red-500 text-xs mt-1" role="alert">{{ errors.email }}</p>
          </div>
          <div>
            <label for="subName" class="block text-sm font-sans font-medium mb-1">Name</label>
            <input
              id="subName"
              v-model="name"
              type="text"
              placeholder="First Name"
              class="w-full border rounded px-3 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-black"
              :class="{'border-red-500': errors.name, 'border-gray-300': !errors.name}"
            />
            <p v-if="errors.name" class="text-red-500 text-xs mt-1" role="alert">{{ errors.name }}</p>
          </div>
          <button type="submit" :disabled="!meta.valid" class="w-full bg-black text-white py-2 rounded font-sans text-sm disabled:opacity-50 hover:bg-gray-800 transition-colors">
            Subscribe
          </button>
        </form>
      </div>

      <div v-else class="py-8 text-center" aria-live="polite">
        <p class="font-serif text-lg">You're on the list.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
const isVisible = ref(false);
const submitted = ref(false);
let timer;

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Valid email is required'),
    name: z.string().optional()
  })
);

const { handleSubmit, errors, meta } = useForm({
  validationSchema: schema,
  initialValues: { email: '', name: '' }
});

const { value: email } = useField('email');
const { value: name } = useField('name');

function close() {
  isVisible.value = false;
  store.popupDismissed = true;
}

const onSubmit = handleSubmit((values) => {
  submitted.value = true;
  store.popupDismissed = true;
  setTimeout(() => {
    isVisible.value = false;
  }, 3000);
});

function handleScroll() {
  if (store.popupDismissed) return;
  const scrolled = window.scrollY / Math.max(1, (document.body.scrollHeight - window.innerHeight));
  if (scrolled > 0.5) {
    isVisible.value = true;
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(timer);
  }
}

onMounted(() => {
  if (store.popupDismissed) return;
  timer = setTimeout(() => {
    if (!store.popupDismissed) {
      isVisible.value = true;
      window.removeEventListener('scroll', handleScroll);
    }
  }, 45000);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  clearTimeout(timer);
});
</script>
