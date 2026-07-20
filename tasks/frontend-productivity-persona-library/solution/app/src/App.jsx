import React, { useEffect } from 'react'
import { Button, Search, Select, SelectItem, ToastNotification, Toggle } from '@carbon/react'
import { Book, Chemistry, Compare, Download, Filter, Redo, Undo } from '@carbon/icons-react'
import { ROLES, useAppStore } from './store'
import LibraryView from './components/LibraryView'
import TestBenchView from './components/TestBenchView'
import CompareView from './components/CompareView'
import PersonaEditor from './components/PersonaEditor'
import ComposeModal from './components/ComposeModal'
import DetailAndPoll from './components/DetailAndPoll'
import ExportDrawer from './components/ExportDrawer'
import { registerWebMCP } from './webmcp'

function AppToolbar() {
  const activeView = useAppStore((s) => s.activeView)
  const filters = useAppStore((s) => s.filters)
  const undoCount = useAppStore((s) => s.undoStack.length)
  const redoCount = useAppStore((s) => s.redoStack.length)
  const setView = useAppStore((s) => s.setView)
  const setFilters = useAppStore((s) => s.setFilters)
  const setUI = useAppStore((s) => s.setUI)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  return (
    <header className="app-toolbar">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="brand"><span className="brand-mark"><i /><i /><i /></span><div><strong>Persona Foundry</strong><small>AI WRITING WORKSPACE</small></div></div>
      <nav className="view-switcher" aria-label="Workspace views">
        <button className={activeView === 'library' ? 'active' : ''} onClick={() => setView('library')}><Book /><span>Library</span></button>
        <button className={activeView === 'test-bench' ? 'active' : ''} onClick={() => setView('test-bench')}><Chemistry /><span>Test Bench</span></button>
        <button className={activeView === 'compare' ? 'active' : ''} onClick={() => setView('compare')}><Compare /><span>Compare</span></button>
      </nav>
      <div className={`toolbar-filters ${activeView !== 'library' ? 'is-hidden' : ''}`}>
        <Search id="persona-search" size="lg" labelText="Search personas by name or role" placeholder="Search name or role" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} onClear={() => setFilters({ search: '' })} />
        <Select id="role-filter" labelText="Role" hideLabel value={filters.role} onChange={(e) => setFilters({ role: e.target.value })}><SelectItem value="All roles" text="All roles" />{ROLES.map((role) => <SelectItem key={role} value={role} text={role} />)}</Select>
        <Toggle id="archived-toggle" size="sm" labelText="Archived personas" labelA="Active" labelB="Archived" toggled={filters.archived} onToggle={(archived) => setFilters({ archived })} />
      </div>
      <div className="toolbar-actions">
        <Button className="mobile-filter" kind="ghost" size="md" hasIconOnly renderIcon={Filter} iconDescription="Open tag filters" onClick={() => setUI({ filtersOpen: true })} />
        <Button kind="ghost" size="md" hasIconOnly renderIcon={Undo} iconDescription="Undo" disabled={!undoCount} onClick={undo} />
        <Button kind="ghost" size="md" hasIconOnly renderIcon={Redo} iconDescription="Redo" disabled={!redoCount} onClick={redo} />
        <Button kind="tertiary" size="md" renderIcon={Download} onClick={() => setUI({ exportOpen: true })}>Export</Button>
      </div>
    </header>
  )
}

function ToastRegion() {
  const toast = useAppStore((s) => s.ui.toast)
  const clearToast = useAppStore((s) => s.clearToast)
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(clearToast, 3800)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
  if (!toast) return null
  return <div className="toast-region"><ToastNotification key={toast.id} kind="success" timeout={0} lowContrast title={toast.message} caption="Workspace state updated" onCloseButtonClick={clearToast} /></div>
}

export default function App() {
  const activeView = useAppStore((s) => s.activeView)
  const announce = useAppStore((s) => s.announce)
  useEffect(() => registerWebMCP(), [])
  useEffect(() => {
    const key = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) useAppStore.getState().redo()
      else useAppStore.getState().undo()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])
  return (
    <div className="app-shell cds--g100">
      <AppToolbar />
      {activeView === 'library' && <LibraryView />}
      {activeView === 'test-bench' && <TestBenchView />}
      {activeView === 'compare' && <CompareView />}
      <PersonaEditor />
      <ComposeModal />
      <DetailAndPoll />
      <ExportDrawer />
      <ToastRegion />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announce}</div>
    </div>
  )
}
