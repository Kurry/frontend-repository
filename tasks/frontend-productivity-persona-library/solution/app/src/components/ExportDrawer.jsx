import React, { useEffect, useMemo, useRef } from 'react'
import { Button, CodeSnippet } from '@carbon/react'
import { Checkmark, Close, Copy, Download } from '@carbon/icons-react'
import { TRAITS, toPayload, useAppStore, visiblePersonas } from '../store'

function reportFor(first, second) {
  if (!first || !second) return 'Comparison report\n\nChoose two personas in Compare to generate a complete report.'
  const lines = TRAITS.map((trait) => {
    const a = first.traits[trait]
    const b = second.traits[trait]
    const delta = b - a
    const leader = a === b ? 'Tie' : a > b ? first.name : second.name
    return `${trait}: ${first.name} ${a} | ${second.name} ${b} | delta ${delta > 0 ? '+' : ''}${delta} | leader: ${leader}`
  })
  return `Persona comparison report\nGenerated: ${new Date().toISOString()}\n\n${first.name} (${first.role}, ${first.tone})\nvs.\n${second.name} (${second.role}, ${second.tone})\n\nTrait comparison\n${lines.join('\n')}\n\nSummary\n${first.name} contributes ${first.tags.join(', ')}. ${second.name} contributes ${second.tags.join(', ')}. Trait leaders are calculated directly from the current shared persona records.`
}

export default function ExportDrawer() {
  const open = useAppStore((s) => s.ui.exportOpen)
  const tab = useAppStore((s) => s.ui.exportTab)
  const setUI = useAppStore((s) => s.setUI)
  const personas = useAppStore((s) => s.personas)
  const filters = useAppStore((s) => s.filters)
  const visible = useMemo(() => visiblePersonas({ personas, filters }), [personas, filters])
  const slots = useAppStore((s) => s.comparisonSlots)
  const toast = useAppStore((s) => s.toast)
  const closeRef = useRef(null)
  const drawerRef = useRef(null)
  const previousFocus = useRef(null)
  const first = personas.find((p) => p.id === slots[0])
  const second = personas.find((p) => p.id === slots[1])
  const pack = useMemo(() => JSON.stringify({ schemaVersion: 1, personas: visible.map(toPayload), generatedAt: new Date().toISOString() }, null, 2), [visible, open])
  const report = useMemo(() => reportFor(first, second), [first, second, open])
  const text = tab === 'pack' ? pack : report

  useEffect(() => {
    if (!open) return undefined
    previousFocus.current = document.activeElement
    closeRef.current?.focus()
    const key = (e) => {
      if (e.key === 'Escape') setUI({ exportOpen: false })
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = [...drawerRef.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((node) => !node.disabled)
        if (!focusable.length) return
        if (e.shiftKey && document.activeElement === focusable[0]) { e.preventDefault(); focusable.at(-1).focus() }
        else if (!e.shiftKey && document.activeElement === focusable.at(-1)) { e.preventDefault(); focusable[0].focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); previousFocus.current?.focus?.() }
  }, [open])

  if (!open) return null
  const copy = async () => {
    await navigator.clipboard?.writeText(text)
    toast(`${tab === 'pack' ? 'Persona pack JSON' : 'Comparison report'} copied`)
  }
  const download = () => {
    const blob = new Blob([text], { type: tab === 'pack' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = tab === 'pack' ? 'persona-pack.json' : 'persona-comparison.txt'
    anchor.click()
    URL.revokeObjectURL(url)
    toast('Export downloaded')
  }
  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setUI({ exportOpen: false }) }}>
      <aside ref={drawerRef} className="side-drawer export-drawer" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header><div><p className="eyebrow">LIVE ARTIFACT</p><h2 id="export-title">Export workspace</h2></div><Button ref={closeRef} kind="ghost" hasIconOnly renderIcon={Close} iconDescription="Close export drawer" onClick={() => setUI({ exportOpen: false })} /></header>
        <div className="export-tabs" role="tablist"><button role="tab" aria-selected={tab === 'pack'} className={tab === 'pack' ? 'active' : ''} onClick={() => setUI({ exportTab: 'pack' })}>Persona pack</button><button role="tab" aria-selected={tab === 'report'} className={tab === 'report' ? 'active' : ''} onClick={() => setUI({ exportTab: 'report' })}>Comparison report</button></div>
        <div className="export-meta"><span>{tab === 'pack' ? `${visible.length} filtered personas` : `${first && second ? '2 personas compared' : 'Comparison incomplete'}`}</span><span className="valid-indicator"><Checkmark /> Live state</span></div>
        <pre className="export-code" aria-label="Visible export text">{text}</pre>
        <div className="drawer-actions"><Button kind="secondary" renderIcon={Download} onClick={download}>Download</Button><Button renderIcon={Copy} onClick={copy}>Copy</Button></div>
      </aside>
    </div>
  )
}

export { reportFor }
