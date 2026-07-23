import { onBeforeUnmount, watch } from 'vue'

const FOCUSABLE = [
  'a[href]', 'button:not(:disabled)', 'textarea:not(:disabled)',
  'input:not(:disabled)', 'select:not(:disabled)', '[tabindex]:not([tabindex="-1"])',
].join(', ')

// Keeps Tab cycling inside the topmost visible PrimeVue dialog while `isOpen`
// is true, so the criterion form, Export center, and Import surface each trap
// focus while open. PrimeVue's Dialog already restores focus to the opener on
// hide and closes on Escape (unless a component opts out for overlay-aware
// Escape handling), so this composable only supplies the Tab trap.
export function useFocusTrap(isOpen) {
  function onKeyDown(event) {
    if (event.key !== 'Tab') return
    const visible = Array.from(document.querySelectorAll('.p-dialog'))
      .filter((dialog) => dialog.offsetParent !== null || dialog.getClientRects().length > 0)
    const root = visible[visible.length - 1]
    if (!root) return
    const items = Array.from(root.querySelectorAll(FOCUSABLE))
      .filter((el) => el.getClientRects().length > 0)
    if (!items.length) {
      event.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (!root.contains(active)) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }
  watch(isOpen, (open) => {
    if (open) document.addEventListener('keydown', onKeyDown, true)
    else document.removeEventListener('keydown', onKeyDown, true)
  }, { immediate: true })
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown, true))
}
