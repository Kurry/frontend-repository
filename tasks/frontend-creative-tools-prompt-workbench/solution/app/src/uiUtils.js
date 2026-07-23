import { useEffect, useRef } from 'react'

export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform)
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'

export function iconOnly(label) { return { hasIconOnly: true, iconDescription: label, 'aria-label': label, title: label, tooltipPosition: 'bottom' } }

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    const copied = document.execCommand('copy')
    textArea.remove()
    if (!copied) throw new Error('Clipboard copy was unavailable')
  }
}

// Strip double-brace tokens for display-only surfaces so template syntax never
// leaks into chrome that is not actively being edited.
export const displayText = (text) => text.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, '$1')

export function useModalEscapeReturn(open, close) {
  const closeRef = useRef(close)
  const priorFocusRef = useRef(null)
  closeRef.current = close
  useEffect(() => {
    if (!open) return
    priorFocusRef.current = document.activeElement
    const escape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      closeRef.current()
    }
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('keydown', escape, true)
      window.setTimeout(() => priorFocusRef.current?.focus?.(), 0)
    }
  }, [open])
}
