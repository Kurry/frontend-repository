import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Select, SelectItem, Tag, ToastNotification, ContentSwitcher, Switch } from '@carbon/react'
import {
  Asleep,
  Book,
  ChevronRight,
  Education,
  IbmGranite,
  Light,
  Microphone,
  Template,
} from '@carbon/icons-react'
import { TECHNIQUES, techniqueById } from './domain'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useStudioStore } from './store'
import TechniqueForm from './components/TechniqueForm'
import PreviewPanel from './components/PreviewPanel'
import LibraryView from './components/LibraryView'
import SaveModal from './components/SaveModal'
import ImportModal from './components/ImportModal'
import { registerWebMCP } from './webmcp'

function StatusChip({ status }) {
  const labels = { 'in-progress': 'In progress', generated: 'Generated', saved: 'Saved' }
  const types = { 'in-progress': 'warm-gray', generated: 'blue', saved: 'green' }
  const reduce = useReducedMotion()
  return (
    <AnimatePresence mode="wait">
      {status !== 'neutral' && (
        <motion.span
          key={status}
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.8 }}
          transition={{ duration: reduce ? 0 : 0.09 }}
          className={`status-chip status-${status}`}
          style={{ display: 'flex' }}
        >
          <Tag size="sm" type={types[status]}>{labels[status]}</Tag>
        </motion.span>
      )}
    </AnimatePresence>
  )
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
      <TechniquePulse />
      <div className="sidebar-note">
        <Education size={20} aria-hidden="true" />
        <p><strong>Technique matters</strong><span>Choose the structure that best fits your task.</span></p>
      </div>
    </aside>
  )
}

function TechniquePulse() {
  const statuses = useStudioStore((state) => state.statuses)
  const bars = useMemo(() => TECHNIQUES.map((technique) => {
    const status = statuses[technique.id]
    const weight = status === 'saved' ? 1 : status === 'generated' ? 0.72 : status === 'in-progress' ? 0.42 : 0.12
    return { id: technique.id, short: technique.short, weight, label: technique.name }
  }), [statuses])

  return (
    <div className="technique-pulse" aria-label="Technique activity chart">
      <div className="technique-pulse__label">Session activity</div>
      <div className="technique-pulse__bars" role="img" aria-label="Relative activity across prompting techniques">
        {bars.map((bar) => (
          <div key={bar.id} className="technique-pulse__bar" title={`${bar.label}: ${Math.round(bar.weight * 100)}%`}>
            <span style={{ height: `${Math.max(8, bar.weight * 44)}px` }} />
            <small>{bar.short}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function MobileTechniqueSelect() {
  const technique = useStudioStore((state) => state.activeTechnique)
  const selectTechnique = useStudioStore((state) => state.selectTechnique)
  const touchStart = useRef(null)

  function onTouchStart(event) {
    touchStart.current = event.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(event) {
    if (touchStart.current == null) return
    const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
    touchStart.current = null
    if (Math.abs(delta) < 48) return
    const index = TECHNIQUES.findIndex((item) => item.id === technique)
    const next = delta < 0
      ? TECHNIQUES[Math.min(TECHNIQUES.length - 1, index + 1)]
      : TECHNIQUES[Math.max(0, index - 1)]
    if (next) selectTechnique(next.id)
  }

  return (
    <div className="mobile-technique" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Select id="mobile-technique-select" labelText="Prompting technique" value={technique} onChange={(event) => selectTechnique(event.target.value)}>
        {TECHNIQUES.map((item) => <SelectItem key={item.id} value={item.id} text={item.name} />)}
      </Select>
      <p className="mobile-swipe-hint">Swipe left or right to change technique</p>
    </div>
  )
}

function AppHeader() {
  const activeView = useStudioStore((state) => state.activeView)
  const libraryCount = useStudioStore((state) => state.library.length)
  const theme = useStudioStore((state) => state.theme)
  const density = useStudioStore((state) => state.density)
  const voiceListening = useStudioStore((state) => state.voiceListening)
  const setView = useStudioStore((state) => state.setView)
  const setTheme = useStudioStore((state) => state.setTheme)
  const setDensity = useStudioStore((state) => state.setDensity)
  const setVoiceListening = useStudioStore((state) => state.setVoiceListening)
  const showToast = useStudioStore((state) => state.showToast)

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast('info', 'Voice input', 'Speech recognition is unavailable in this browser. Use the dictation hint to paste spoken notes.')
      setVoiceListening(false)
      return
    }
    if (voiceListening) {
      setVoiceListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onstart = () => setVoiceListening(true)
    recognition.onend = () => setVoiceListening(false)
    recognition.onerror = () => setVoiceListening(false)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim()
      if (!transcript) return
      const applied = window.__templateFormVoiceTranscript?.(transcript)
      showToast(
        applied ? 'success' : 'error',
        applied ? 'Voice captured' : 'Voice input unavailable',
        applied ? 'Transcript appended to the active technique form.' : 'Return to an active technique form and try again.',
      )
    }
    recognition.start()
  }

  return (
    <header className="app-header">
      <button type="button" className="brand" onClick={() => setView('forms')} aria-label="Template Forms home">
        <span className="brand-mark" aria-hidden="true"><IbmGranite size={20} /></span>
        <span><strong>Template</strong> Forms</span>
      </button>
      <nav className="view-nav" aria-label="Primary navigation">
        <Button type="button" kind="ghost" size="md" renderIcon={(props) => <Template {...props} aria-hidden="true" />} className={activeView === 'forms' ? 'nav-active' : ''} onClick={() => setView('forms')}>Studio</Button>
        <Button type="button" kind="ghost" size="md" renderIcon={(props) => <Book {...props} aria-hidden="true" />} className={activeView === 'library' ? 'nav-active' : ''} onClick={() => setView('library')}>
          Library <span className="nav-count">{libraryCount}</span>
        </Button>
        <Button
          type="button"
          kind="ghost"
          size="md"
          className="theme-toggle"
          renderIcon={(props) => (theme === 'dark' ? <Light {...props} aria-hidden="true" /> : <Asleep {...props} aria-hidden="true" />)}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
        <Button
          type="button"
          kind="ghost"
          size="md"
          onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
          aria-label={density === 'comfortable' ? 'Switch to compact density' : 'Switch to comfortable density'}
        >
          {density === 'comfortable' ? 'Compact' : 'Comfort'}
        </Button>
        <Button
          type="button"
          kind="ghost"
          size="md"
          className={voiceListening ? 'nav-active' : ''}
          renderIcon={(props) => <Microphone {...props} aria-hidden="true" />}
          onClick={toggleVoice}
          aria-pressed={voiceListening}
          aria-label={voiceListening ? 'Stop voice input' : 'Start voice input'}
        >
          {voiceListening ? 'Listening' : 'Voice'}
        </Button>
      </nav>
    </header>
  )
}

function FormsView() {
  const technique = useStudioStore((state) => state.activeTechnique)
  const saveButtonRef = useRef(null)
  const info = techniqueById[technique]
  const position = TECHNIQUES.findIndex((item) => item.id === technique) + 1
  const reduce = useReducedMotion()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 28])

  return (
    <div className="studio-layout">
      <Sidebar />
      <main className="studio-main" id="main-content">
        <MobileTechniqueSelect />
        <div className="technique-hero" ref={heroRef}>
          <motion.div className="hero-parallax" style={{ y: parallaxY }} aria-hidden="true" />
          <div>
            <span className="eyebrow">Technique {String(position).padStart(2, '0')} / 07</span>
            <h1>{info.name}</h1>
            <p>{info.description}</p>
          </div>
          <motion.div
            key={technique}
            className="hero-glyph"
            aria-hidden="true"
            initial={reduce ? false : { rotate: -8, scale: 0.92, opacity: 0.4 }}
            animate={{ rotate: 4, scale: 1, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.09 }}
          >
            {info.short}
          </motion.div>
        </div>
        <div className={`form-panel ${reduce ? '' : 'form-fade'}`}>
          {TECHNIQUES.map((item) => (
            <TechniqueForm key={item.id} technique={item.id} active={technique === item.id} />
          ))}
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
    <div className="toast-region" role="status" aria-live="polite" aria-label="Notifications">
      <ToastNotification
        kind={toast.kind}
        title={toast.title}
        subtitle={toast.subtitle}
        timeout={0}
        onClose={() => { clearToast(); return false }}
        lowContrast
      />
    </div>
  )
}

function OnboardingCoach() {
  const hasSeenOnboarding = useStudioStore((state) => state.hasSeenOnboarding)
  const onboardingStep = useStudioStore((state) => state.onboardingStep)
  const setChrome = useStudioStore((state) => state.setChrome)
  const [open, setOpen] = useState(!hasSeenOnboarding)
  const steps = [
    {
      heading: 'Welcome to Template Forms',
      copy: 'A guided studio for seven prompting techniques. Pick a structure, fill the schema fields, and generate a deterministic prompt you can reuse.',
    },
    {
      heading: 'Craft in Studio',
      copy: 'Each technique keeps its own draft while you explore. Generate a preview, copy it, or save the prompt into your in-memory library.',
    },
    {
      heading: 'Reuse from Library',
      copy: 'Open any saved prompt to restore its exact fields, export template-library.json, or import a conforming document to replace the session library.',
    },
  ]
  const step = steps[onboardingStep] || steps[0]
  const isLast = onboardingStep >= steps.length - 1

  if (hasSeenOnboarding && !open) {
    return (
      <button type="button" className="tour-reopen" onClick={() => { setOpen(true); setChrome({ onboardingStep: 0 }) }}>
        Guided tour
      </button>
    )
  }

  if (!open && hasSeenOnboarding) return null

  return (
    <aside className="onboarding-coach" aria-label="Guided onboarding">
      <div className="onboarding-coach__body">
        <span className="eyebrow">Studio tour · {onboardingStep + 1}/3</span>
        <p className="onboarding-coach__heading">{step.heading}</p>
        <p>{step.copy}</p>
        <ContentSwitcher
          size="sm"
          selectedIndex={onboardingStep}
          onChange={({ index }) => setChrome({ onboardingStep: index })}
          aria-label="Onboarding steps"
        >
          <Switch name="welcome" text="1" />
          <Switch name="studio" text="2" />
          <Switch name="library" text="3" />
        </ContentSwitcher>
      </div>
      <div className="onboarding-coach__actions">
        <Button
          type="button"
          kind="ghost"
          size="sm"
          onClick={() => {
            setChrome({ hasSeenOnboarding: true, onboardingStep: 0 })
            setOpen(false)
          }}
        >
          Skip tour
        </Button>
        <Button
          type="button"
          kind="primary"
          size="sm"
          onClick={() => {
            if (isLast) {
              setChrome({ hasSeenOnboarding: true, onboardingStep: 0 })
              setOpen(false)
            } else {
              setChrome({ onboardingStep: onboardingStep + 1 })
            }
          }}
        >
          {isLast ? 'Start building prompts' : 'Continue tour'}
        </Button>
      </div>
    </aside>
  )
}

export default function App() {
  const activeView = useStudioStore((state) => state.activeView)
  const theme = useStudioStore((state) => state.theme)
  const density = useStudioStore((state) => state.density)
  const importLauncherRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    registerWebMCP()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
  }, [density, theme])

  return (
    <div className={`app-shell theme-${theme} density-${density}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppHeader />
      <OnboardingCoach />
      <div className="view-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeView}
            className="view-layer"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: reduce ? 0 : 0.09, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {activeView === 'forms'
              ? <FormsView />
              : <LibraryView importLauncherRef={importLauncherRef} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <ImportModal launcherButtonRef={importLauncherRef} />
      <ToastRegion />
    </div>
  )
}
