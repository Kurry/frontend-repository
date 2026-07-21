export function returnFocusToOpener(openerId: string) {
  window.requestAnimationFrame(() => {
    const opener = document.querySelector<HTMLElement>(`[data-modal-opener="${openerId}"]`)
    opener?.focus()
  })
}
