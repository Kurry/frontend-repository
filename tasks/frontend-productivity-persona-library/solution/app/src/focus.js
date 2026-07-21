const focusReturnStack = []

export function captureFocus() {
  const el = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (el) focusReturnStack.push(el)
}

export function restoreFocus() {
  const el = focusReturnStack.pop()
  if (el?.isConnected) el.focus()
}

export function clearFocusCapture() {
  focusReturnStack.length = 0
}
