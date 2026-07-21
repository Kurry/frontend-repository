import React, { useEffect, useId, useRef } from 'react'
import { Checkmark, Close, WarningAlt } from '@carbon/icons-react'
import { useStore } from './store'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ---------------- Buttons ---------------- */
export function Btn({ kind = 'primary', size, icon: Icon, children, className, iconOnly, ...rest }) {
  return (
    <button
      type="button"
      className={cx('btn', `btn-${kind}`, size === 'sm' && 'btn-sm', iconOnly && 'btn-icon', className)}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 16} aria-hidden="true" />}
      {iconOnly ? <span className="sr-only">{rest['aria-label'] || rest.title}</span> : children}
    </button>
  )
}

/* ---------------- Checkbox ---------------- */
export function Chk({ label, checked, onChange, indeterminate, id, hideLabel, className, describedBy }) {
  const auto = useId()
  const inputId = id || `chk-${auto}`
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = Boolean(indeterminate) }, [indeterminate])
  return (
    <label htmlFor={inputId} className={cx('chk', className)}>
      <input ref={ref} id={inputId} type="checkbox" checked={Boolean(checked)} aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.checked)} />
      <span className="chk-box" aria-hidden="true">
        {checked ? <Checkmark size={12} /> : indeterminate ? <span style={{ width: 10, height: 2, background: '#fff', borderRadius: 1 }} /> : null}
      </span>
      <span className={hideLabel ? 'sr-only' : 'text-[13px]'}>{label}</span>
    </label>
  )
}

/* ---------------- Toggle switch ---------------- */
export function Switch({ label, checked, onChange, id }) {
  const auto = useId()
  const inputId = id || `tgl-${auto}`
  return (
    <label htmlFor={inputId} className="tgl">
      <input id={inputId} type="checkbox" role="switch" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="tgl-track" aria-hidden="true"><span className="tgl-thumb" /></span>
      <span className="text-[13px] font-semibold t-2">{label}</span>
    </label>
  )
}

/* ---------------- Tag ---------------- */
export function Tag({ tone = 'gray', icon: Icon, children, className, ...rest }) {
  return <span className={cx('tag', `tag-${tone}`, className)} {...rest}>{Icon && <Icon size={11} aria-hidden="true" />}{children}</span>
}

/* ---------------- Form fields ---------------- */
function FieldWrap({ id, label, error, hint, required, children }) {
  const errId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}{required && <span aria-hidden="true" style={{ color: 'var(--danger)' }}>*</span>}</label>
      {children({ 'aria-invalid': error ? true : undefined, 'aria-describedby': [errId, hintId].filter(Boolean).join(' ') || undefined })}
      {error && <p className="error-text" id={errId} role="alert"><WarningAlt size={13} aria-hidden="true" style={{ flex: 'none', marginTop: 1 }} />{error}</p>}
      {hint && !error && <p className="hint-text" id={hintId}>{hint}</p>}
    </div>
  )
}

export function TextField({ id, label, error, hint, required, className, ...rest }) {
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} required={required}>
      {(a11y) => <input id={id} className={cx('input', className)} {...a11y} {...rest} />}
    </FieldWrap>
  )
}

export function TextAreaField({ id, label, error, hint, required, className, ...rest }) {
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} required={required}>
      {(a11y) => <textarea id={id} className={cx('input', className)} {...a11y} {...rest} />}
    </FieldWrap>
  )
}

export function SelectField({ id, label, error, hint, required, children, className, ...rest }) {
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} required={required}>
      {(a11y) => <select id={id} className={cx('input', className)} {...a11y} {...rest}>{children}</select>}
    </FieldWrap>
  )
}

/* ---------------- Overlay stack (Escape + focus trap) ----------------
 * Every open overlay registers itself; only the TOP overlay responds to
 * Escape, so stacked surfaces (merge dialog over the duplicates panel)
 * dismiss one layer at a time and focus returns to the opener. */
const overlayStack = []
export function useOverlayBehavior(ref, onClose, { initialFocus = true } = {}) {
  const returnFocus = useRef(null)
  useEffect(() => {
    returnFocus.current = document.activeElement
    const entry = { onClose }
    overlayStack.push(entry)
    if (initialFocus) {
      const node = ref.current?.querySelector(
        'input:not([type="hidden"]), select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      ;(node || ref.current)?.focus?.()
    }
    const onKey = (e) => {
      const top = overlayStack[overlayStack.length - 1]
      if (top !== entry) return
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose() }
      else if (e.key === 'Tab') {
        const nodes = [...(ref.current?.querySelectorAll(
          'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])'
        ) || [])].filter((n) => !n.disabled && n.offsetParent !== null)
        if (!nodes.length) return
        const first = nodes[0], last = nodes[nodes.length - 1]
        if (e.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      const i = overlayStack.indexOf(entry)
      if (i >= 0) overlayStack.splice(i, 1)
      if (returnFocus.current?.focus && document.contains(returnFocus.current)) returnFocus.current.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------- Modal shell ---------------- */
export function ModalShell({ title, subtitle, onClose, wide = false, children, footer }) {
  const ref = useRef(null)
  useOverlayBehavior(ref, onClose)
  return (
    <div className="modal-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section ref={ref} tabIndex={-1} className={cx('modal-card', wide && '!w-[min(860px,100%)]')} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bd surface px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-xl font-bold t-primary">{title}</h2>
            {subtitle && <p className="mt-1 text-sm t-2">{subtitle}</p>}
          </div>
          <Btn kind="ghost" size="sm" icon={Close} iconOnly aria-label="Close dialog" onClick={onClose} />
        </header>
        {children}
        {footer && <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bd surface px-5 py-4">{footer}</footer>}
      </section>
    </div>
  )
}

/* ---------------- Side panel / drawer shell ---------------- */
export function PanelShell({ title, subtitle, onClose, wide = false, children }) {
  const ref = useRef(null)
  const close = onClose || (() => useStore.getState().setUi({ panel: null }))
  useOverlayBehavior(ref, close)
  return (
    <div className="panel-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside ref={ref} tabIndex={-1} className={cx('panel-sheet', wide && '!w-[min(780px,100vw)]')} role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b bd surface px-5 py-4">
          <div className="min-w-0">
            <h2 id="panel-title" className="text-xl font-bold t-primary">{title}</h2>
            {subtitle && <p className="mt-1 text-sm t-2">{subtitle}</p>}
          </div>
          <Btn kind="ghost" size="sm" icon={Close} iconOnly aria-label="Close panel" onClick={close} />
        </header>
        {children}
      </aside>
    </div>
  )
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ icon: Icon, title, body, actions, tone }) {
  return (
    <div className="grid min-h-[340px] place-items-center p-8 text-center">
      <div className="reveal-item max-w-md">
        {Icon && <div className={cx('mx-auto grid h-16 w-16 place-items-center rounded-2xl', tone === 'ok' ? 'surface-2' : 'surface-2')} style={{ color: 'var(--brand)' }}><Icon size={30} /></div>}
        <h3 className="mt-4 text-lg font-bold t-primary">{title}</h3>
        <p className="mt-1 text-sm t-2">{body}</p>
        {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------------- Animated number (gauge / counts) ---------------- */
export function useAnimatedNumber(value, duration = 450) {
  const [display, setDisplay] = React.useState(value)
  const prev = useRef(value)
  const frame = useRef(null)
  useEffect(() => {
    const from = prev.current, to = value
    if (from === to) return
    prev.current = to
    const start = performance.now()
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) { setDisplay(to); return }
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])
  return display
}
