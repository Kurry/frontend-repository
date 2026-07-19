import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

export const toasts = ref<Toast[]>([])

let toastCounter = 0

export function showToast(message: string, type: Toast['type'] = 'success') {
  toastCounter += 1
  const id = `toast-${toastCounter}`
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }, 4000)
}
