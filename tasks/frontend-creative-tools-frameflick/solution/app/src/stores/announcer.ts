import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Single polite live region for the whole workspace: validation rejections,
 * save confirmations, and export feedback are announced here in addition to
 * their visible inline messages.
 */
export const useAnnouncer = defineStore('announcer', () => {
  const message = ref('')
  let clearTimer: ReturnType<typeof setTimeout> | null = null
  let setTimer: ReturnType<typeof setTimeout> | null = null

  function announce(text: string) {
    if (clearTimer) clearTimeout(clearTimer)
    if (setTimer) clearTimeout(setTimer)
    // Clear first so an identical message re-announces on the next tick.
    message.value = ''
    setTimer = setTimeout(() => {
      message.value = text
      clearTimer = setTimeout(() => { message.value = '' }, 4000)
    }, 40)
  }

  return { message, announce }
})
