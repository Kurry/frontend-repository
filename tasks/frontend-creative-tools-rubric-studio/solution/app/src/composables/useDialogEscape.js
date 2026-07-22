import { nextTick, watch, onBeforeUnmount } from 'vue'

export function useDialogEscape(props, emit) {
  let opener = null

  function onEscape(event) {
    if (event.key !== 'Escape' || !props.open) return
    const overlayOpen = Array.from(document.querySelectorAll('.p-select-overlay, .p-autocomplete-overlay'))
      .some((overlay) => overlay.getClientRects().length > 0 && getComputedStyle(overlay).visibility !== 'hidden')
    if (overlayOpen) return
    event.preventDefault()
    event.stopImmediatePropagation()
    emit('close')
  }

  watch(() => props.open, async (open, wasOpen) => {
    if (open) {
      opener = document.activeElement
      document.addEventListener('keydown', onEscape, true)
    } else {
      document.removeEventListener('keydown', onEscape, true)
      if (wasOpen) {
        await nextTick()
        if (opener?.isConnected) opener.focus()
        opener = null
      }
    }
  })

  onBeforeUnmount(() => document.removeEventListener('keydown', onEscape, true))
}
