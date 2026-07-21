let savedFocus = null

export function captureFocus() {
  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) savedFocus = active
}

export function restoreFocus() {
  if (savedFocus instanceof HTMLElement && document.contains(savedFocus)) savedFocus.focus()
  savedFocus = null
}

export function trapFocus(container) {
  if (!(container instanceof HTMLElement)) return () => {}
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  const getFocusable = () => [...container.querySelectorAll(selector)].filter((node) => node instanceof HTMLElement && node.offsetParent !== null)
  const focusFirst = () => {
    const nodes = getFocusable()
    nodes[0]?.focus()
  }
  const onKeyDown = (event) => {
    if (event.key !== 'Tab') return
    const nodes = getFocusable()
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const active = document.activeElement
    if (!(active instanceof Node) || !container.contains(active)) {
      event.preventDefault()
      first.focus()
      return
    }
    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }
  container.addEventListener('keydown', onKeyDown)
  requestAnimationFrame(focusFirst)
  return () => container.removeEventListener('keydown', onKeyDown)
}
