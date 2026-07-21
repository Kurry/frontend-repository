const openers = new Map()

export function captureDialogOpener(dialog) {
  if (typeof document === 'undefined') return
  let opener = document.activeElement
  if (dialog !== 'palette' && openers.has('palette') && opener instanceof HTMLElement && opener.closest('[role="dialog"]')) {
    opener = openers.get('palette') || document.getElementById('btn-palette')
  }
  openers.set(dialog, opener)
}

export function restoreDialogOpener(event, dialog) {
  event.preventDefault()
  const opener = openers.get(dialog)
  openers.delete(dialog)
  if (dialog === 'palette') {
    const anotherOpenDialog = [...document.querySelectorAll('[role="dialog"][data-state="open"]')]
      .some((element) => element !== event.currentTarget)
    if (anotherOpenDialog) return
  }
  if (opener instanceof HTMLElement && opener.isConnected && opener !== document.body && opener.getClientRects().length) {
    opener.focus()
    return
  }
  const fallbackIds = { export: 'btn-export', import: 'btn-import', palette: 'btn-palette', note: 'btn-annotate' }
  document.getElementById(fallbackIds[dialog])?.focus()
}
