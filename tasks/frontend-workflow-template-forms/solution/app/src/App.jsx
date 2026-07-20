import { useEffect, useRef } from 'react'
import { Button, Select, SelectItem, Tag, ToastNotification } from '@carbon/react'
import {
  Book,
  ChevronRight,
  Education,
  IbmGranite,
  Template,
} from '@carbon/icons-react'
import { TECHNIQUES, techniqueById } from './domain'
import { useStudioStore } from './store'
import TechniqueForm from './components/TechniqueForm'
import PreviewPanel from './components/PreviewPanel'
import LibraryView from './components/LibraryView'
import SaveModal from './components/SaveModal'
import ImportModal from './components/ImportModal'
import { registerWebMCP } from './webmcp'

function StatusChip({ status }) {
  if (status === 'neutral') return null
  const labels = { 'in-progress': 'In progress', generated: 'Generated', saved: 'Saved' }
  const types = { 'in-progress': 'warm-gray', generated: 'blue', saved: 'green' }
  return <Tag size="sm" type={types[status]} key={status} className={`status-chip status-${status}`}>{labels[status]}</Tag>
}

function Sidebar() {
  const activeTechnique = useStudioStore((state) => state.activeTechnique)
  const statuses = useStudioStore((state) => state.statuses)
  const selectTechnique = useStudioStore((state) => state.selectTechnique)

  return (
    <aside className="technique-sidebar" aria-label="Prompting techniques">
      <div className="sidebar-label"><span>Techniques</span><Tag size="sm" type="cool-gray">7</Tag></div>
      <nav className="technique-nav">
        {TECHNIQUES.map((technique, index) => {
          const active = activeTechnique === technique.id
          return (
            <Button
              type="button"
              kind="ghost"
              size="sm"
              key={technique.id}
              className={`technique-item ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => selectTechnique(technique.id)}
            >
              <span className="technique-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="technique-name">{technique.name}</span>
              <StatusChip status={statuses[technique.id]} />
              {active && <ChevronRight className="active-chevron" size={16} aria-hidden="true" />}
            </Button>
          )
        })}
      </nav>
      <div className="sidebar-note">
        <Education size={20} aria-hidden="true" />
        <p><strong>Technique matters</strong><span>Choose the structure that best fits your task.</span></p>
      </div>
    </aside>
  )
}

function MobileTechniqueSelect() {
  const technique = useStudioStore((state) => state.activeTechnique)
  const selectTechnique = useStudioStore((state) => state.selectTechnique)
  return (
    <div className="mobile-technique">
      <Select id="mobile-technique-select" labelText="Prompting technique" value={technique} onChange={(event) => selectTechnique(event.target.value)}>
        {TECHNIQUES.map((item) => <SelectItem key={item.id} value={item.id} text={item.name} />)}
      </Select>
    </div>
  )
}

function AppHeader() {
  const activeView = useStudioStore((state) => state.activeView)
  const libraryCount = useStudioStore((state) => state.library.length)
  const setView = useStudioStore((state) => state.setView)
  return (
    <header className="app-header">
      <button type="button" className="brand" onClick={() => setView('forms')} aria-label="Template Forms home">
        <span className="brand-mark"><IbmGranite size={20} aria-hidden="true" /></span>
        <span><strong>Template</strong> Forms</span>
      </button>
      <nav className="view-nav" aria-label="Primary navigation">
        <Button type="button" kind="ghost" size="md" renderIcon={Template} className={activeView === 'forms' ? 'nav-active' : ''} onClick={() => setView('forms')}>Studio</Button>
        <Button type="button" kind="ghost" size="md" renderIcon={Book} className={activeView === 'library' ? 'nav-active' : ''} onClick={() => setView('library')}>
          Library <span className="nav-count">{libraryCount}</span>
        </Button>
      </nav>
    </header>
  )
}

function FormsView() {
  const technique = useStudioStore((state) => state.activeTechnique)
  const hydrationVersion = useStudioStore((state) => state.hydrationVersion)
  const saveButtonRef = useRef(null)
  const info = techniqueById[technique]
  const position = TECHNIQUES.findIndex((item) => item.id === technique) + 1

  return (
    <div className="studio-layout">
      <Sidebar />
      <main className="studio-main" id="main-content">
        <MobileTechniqueSelect />
        <div className="technique-hero">
          <div>
            <span className="eyebrow">Technique {String(position).padStart(2, '0')} / 07</span>
            <h1>{info.name}</h1>
            <p>{info.description}</p>
          </div>
          <div className="hero-glyph" aria-hidden="true">{info.short}</div>
        </div>
        <div className="form-panel form-fade" key={`${technique}-${hydrationVersion}`}>
          <TechniqueForm technique={technique} />
        </div>
        <PreviewPanel saveButtonRef={saveButtonRef} />
        <SaveModal launcherButtonRef={saveButtonRef} />
      </main>
    </div>
  )
}

function ToastRegion() {
  const toast = useStudioStore((state) => state.toast)
  const clearToast = useStudioStore((state) => state.clearToast)
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(clearToast, 4200)
    return () => clearTimeout(timer)
  }, [clearToast, toast])
  if (!toast) return null
  return (
    <div className="toast-region" role="region" aria-label="Notifications">
      <ToastNotification
        kind={toast.kind}
        title={toast.title}
        subtitle={toast.subtitle}
        timeout={0}
        onClose={clearToast}
        lowContrast
      />
    </div>
  )
}

export default function App() {
  const activeView = useStudioStore((state) => state.activeView)
  useEffect(() => {
    registerWebMCP()
  }, [])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppHeader />
      {activeView === 'forms' ? <FormsView /> : <LibraryView />}
      <ToastRegion />
    </div>
  )
}
