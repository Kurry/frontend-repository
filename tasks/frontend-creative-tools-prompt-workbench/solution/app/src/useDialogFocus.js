import { useEffect } from 'react'

const focusable = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export function useDialogFocus(open, ref, onClose) {
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const timer = window.setTimeout(() => ref.current?.querySelector(focusable)?.focus(), 20)
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const nodes = [...ref.current.querySelectorAll(focusable)]
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', handleKey)
      previous?.focus?.()
    }
  }, [open, ref, onClose])
}

