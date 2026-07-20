let focusReturnElement = null

export function captureFocus() {
  focusReturnElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
}

export function restoreFocus() {
  if (focusReturnElement?.isConnected) focusReturnElement.focus()
  focusReturnElement = null
}
