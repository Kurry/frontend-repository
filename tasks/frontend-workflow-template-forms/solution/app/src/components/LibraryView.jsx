import { useMemo, useState, useRef } from 'react'
import { Button, Tag, Modal, Search, Select, SelectItem } from '@carbon/react'
import {
  ArrowsVertical,
  ArrowLeft,
  Copy,
  DocumentExport,
  DocumentImport,
  Download,
  Launch,
  TrashCan,
} from '@carbon/icons-react'
import { makeLibraryDocument, TECHNIQUES, techniqueById } from '../domain'
import { useStudioStore } from '../store'
import { copyText, downloadText } from './PreviewPanel'

function truncateSummary(text, limit = 96) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 1)}…`
}

export default function LibraryView({ importLauncherRef }) {
  const library = useStudioStore((state) => state.library)
  const exportOpen = useStudioStore((state) => state.exportPanelOpen)
  const setChrome = useStudioStore((state) => state.setChrome)
  const setView = useStudioStore((state) => state.setView)
  const openLibraryEntry = useStudioStore((state) => state.openLibraryEntry)
  const deleteLibraryEntry = useStudioStore((state) => state.deleteLibraryEntry)
  const showToast = useStudioStore((state) => state.showToast)
  const [deleting, setDeleting] = useState(null)
  const sortOrder = useStudioStore((state) => state.sortOrder)
  const toggleSortOrder = useStudioStore((state) => state.toggleSortOrder)
  const libraryQuery = useStudioStore((state) => state.libraryQuery)
  const setLibraryQuery = useStudioStore((state) => state.setLibraryQuery)
  const libraryTechniqueFilter = useStudioStore((state) => state.libraryTechniqueFilter)
  const setLibraryTechniqueFilter = useStudioStore((state) => state.setLibraryTechniqueFilter)
  const document = useMemo(() => makeLibraryDocument(library), [library])
  const jsonText = useMemo(() => JSON.stringify(document, null, 2), [document])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const deleteLauncher = useRef(null)
  const deleteInFlight = useRef(false)
  const libraryActionFallback = useRef(null)
  const rowOpenButtons = useRef(new Map())

  const sortedLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase()
    return [...library]
      .map((item, originalIndex) => ({ ...item, originalIndex, sourceRecord: item }))
      .filter((item) => {
        if (libraryTechniqueFilter !== 'all' && item.technique !== libraryTechniqueFilter) return false
        if (!query) return true
        return `${item.title} ${item.promptText} ${item.technique}`.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        if (sortOrder === 'manual') return a.originalIndex - b.originalIndex
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      })
  }, [library, libraryQuery, libraryTechniqueFilter, sortOrder])

  function confirmRemove(record, title, event) {
    deleteLauncher.current = event.currentTarget
    deleteInFlight.current = false
    setConfirmDelete({ record, title })
  }

  function commitRemove() {
    if (!confirmDelete || deleteInFlight.current) return
    deleteInFlight.current = true
    const { record, title } = confirmDelete
    const index = library.indexOf(record)
    if (index < 0) {
      setConfirmDelete(null)
      showToast('error', 'Prompt not deleted', 'The library changed before deletion could be confirmed.')
      requestAnimationFrame(() => {
        if (deleteLauncher.current?.isConnected) deleteLauncher.current.focus()
        else libraryActionFallback.current?.focus()
      })
      return
    }
    const visibleIndex = sortedLibrary.findIndex((item) => item.sourceRecord === record)
    const remainingRows = sortedLibrary.filter((item) => item.sourceRecord !== record)
    const successor = remainingRows[Math.min(visibleIndex, remainingRows.length - 1)]?.sourceRecord
    setDeleting(index)
    deleteLibraryEntry(index)
    setDeleting(null)
    setConfirmDelete(null)
    showToast('success', 'Prompt deleted', `“${title}” was removed from the library.`)
    requestAnimationFrame(() => {
      if (successor) rowOpenButtons.current.get(successor)?.focus()
      else libraryActionFallback.current?.focus()
    })
  }

  async function copyExport() {
    await copyText(jsonText)
    showToast('success', 'Library JSON copied', `${library.length} prompts copied from the current session.`)
  }

  return (
    <main className="library-view" id="main-content">
      <div className="library-hero">
        <div>
          <span className="eyebrow">Reusable prompt collection</span>
          <h1>Prompt library</h1>
          <p>Every saved prompt keeps its exact fields, references, and assembled prompt text together.</p>
        </div>
        <div className="library-actions">
          <Button
            ref={(node) => {
              if (importLauncherRef) importLauncherRef.current = node
              libraryActionFallback.current = node
            }}
            type="button"
            kind="tertiary"
            renderIcon={(props) => <DocumentImport {...props} aria-hidden="true" />}
            onClick={() => setChrome({ importModalOpen: true })}
          >
            Import JSON
          </Button>
          <Button type="button" kind="primary" renderIcon={(props) => <DocumentExport {...props} aria-hidden="true" />} onClick={() => setChrome({ exportPanelOpen: !exportOpen })}>Export library</Button>
        </div>
      </div>

      <div className="library-summary">
        <div><strong>{library.length}</strong><span>saved {library.length === 1 ? 'prompt' : 'prompts'}</span></div>
        <div className="summary-rule" />
        <p>Stored in memory for this session · Reload to restore the 5 seeded prompts.</p>
        <div className="summary-rule" />
        <Button
          type="button"
          kind="tertiary"
          size="sm"
          className="sort-control"
          renderIcon={(props) => <ArrowsVertical {...props} aria-hidden="true" />}
          onClick={toggleSortOrder}
          aria-label={sortOrder === 'manual' ? 'Sort prompts ascending by title' : sortOrder === 'asc' ? 'Sort prompts descending by title' : 'Restore manual library order'}
        >
          Sort {sortOrder === 'manual' ? 'Manual' : sortOrder === 'asc' ? 'A–Z' : 'Z–A'}
        </Button>
      </div>

      <div className="library-toolbar">
        <Search
          id="library-search"
          labelText="Search prompts"
          placeholder="Search prompts by title"
          value={libraryQuery}
          onChange={(event) => setLibraryQuery(event.target?.value ?? event.value ?? '')}
          size="md"
        />
        <Select
          id="library-technique-filter"
          labelText="Filter by technique"
          value={libraryTechniqueFilter}
          onChange={(event) => setLibraryTechniqueFilter(event.target.value)}
        >
          <SelectItem value="all" text="All techniques" />
          {TECHNIQUES.map((technique) => (
            <SelectItem key={technique.id} value={technique.id} text={technique.name} />
          ))}
        </Select>
      </div>

      {exportOpen && (
        <section className="export-panel" aria-label="Export library">
          <div className="export-panel__heading">
            <div><span className="eyebrow">Current session artifact</span><h2>template-library.json</h2></div>
            <div className="export-actions">
              <Button type="button" kind="ghost" size="sm" renderIcon={(props) => <Copy {...props} aria-hidden="true" />} onClick={copyExport}>Copy</Button>
              <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Download {...props} aria-hidden="true" />} onClick={() => downloadText('template-library.json', jsonText, 'application/json')}>Download JSON</Button>
            </div>
          </div>
          <pre tabIndex={0}>{jsonText}</pre>
        </section>
      )}

      {sortedLibrary.length > 0 ? (
        <section className="library-list" aria-label="Saved prompts">
          <div className="list-head"><span>Prompt</span><span>Technique</span><span>Saved</span><span>Actions</span></div>
          {sortedLibrary.map((record) => {
            const index = record.originalIndex
            const summary = truncateSummary(record.fields.taskDescription || record.fields.goal || `A ${techniqueById[record.technique].name} prompt`)
            return (
              <article className={`library-row ${deleting === index ? 'is-deleting' : ''}`} key={`${record.title}-${index}`}>
                <button
                  ref={(node) => {
                    if (node) rowOpenButtons.current.set(record.sourceRecord, node)
                    else rowOpenButtons.current.delete(record.sourceRecord)
                  }}
                  type="button"
                  className="row-open"
                  onClick={() => openLibraryEntry(index)}
                  aria-label={`Open ${record.title}`}
                >
                  <span className="row-icon" aria-hidden="true">{techniqueById[record.technique].short}</span>
                  <span className="row-copy"><strong>{record.title}</strong><small>{summary}</small></span>
                </button>
                <div className="row-technique"><Tag type="cool-gray">{techniqueById[record.technique].name}</Tag></div>
                <div className="row-time"><strong>Saved</strong><span>this session</span></div>
                <div className="row-actions">
                  <Button
                    type="button"
                    kind="ghost"
                    size="md"
                    hasIconOnly
                    renderIcon={(props) => <Launch {...props} aria-hidden="true" focusable="false" />}
                    iconDescription={`Open ${record.title}`}
                    aria-label={`Open ${record.title}`}
                    onClick={() => openLibraryEntry(index)}
                  />
                  <Button
                    type="button"
                    kind="danger--ghost"
                    size="md"
                    hasIconOnly
                    renderIcon={(props) => <TrashCan {...props} aria-hidden="true" focusable="false" />}
                    iconDescription={`Delete ${record.title}`}
                    aria-label={`Delete ${record.title}`}
                    onClick={(e) => confirmRemove(record.sourceRecord, record.title, e)}
                  />
                </div>
              </article>
            )
          })}
        </section>
      ) : library.length > 0 ? (
        <section className="library-empty">
          <div className="empty-orbit" aria-hidden="true"><span>0</span></div>
          <h2>No prompts match the current filters</h2>
          <p>Adjust search or technique filters to see saved prompts from this session.</p>
          <Button type="button" kind="secondary" onClick={() => { setLibraryQuery(''); setLibraryTechniqueFilter('all') }}>Clear filters</Button>
        </section>
      ) : (
        <section className="library-empty">
          <div className="empty-orbit" aria-hidden="true"><span>0</span></div>
          <h2>Your library is ready for its first prompt</h2>
          <p>Build and generate a prompt, then save it here for future use.</p>
          <Button type="button" kind="primary" renderIcon={(props) => <ArrowLeft {...props} aria-hidden="true" />} onClick={() => setView('forms')}>Return to forms</Button>
        </section>
      )}

      {confirmDelete ? (
        <Modal
          open
          danger
          modalHeading="Delete prompt"
          primaryButtonText="Delete prompt"
          secondaryButtonText="Cancel"
          onRequestSubmit={commitRemove}
          onRequestClose={() => {
            deleteInFlight.current = false
            setConfirmDelete(null)
            requestAnimationFrame(() => {
              if (deleteLauncher.current?.isConnected) deleteLauncher.current.focus()
              else libraryActionFallback.current?.focus()
            })
          }}
          onSecondarySubmit={() => {
            deleteInFlight.current = false
            setConfirmDelete(null)
            requestAnimationFrame(() => {
              if (deleteLauncher.current?.isConnected) deleteLauncher.current.focus()
              else libraryActionFallback.current?.focus()
            })
          }}
          className="scale-modal"
        >
          <p className="modal-copy">Are you sure you want to delete this prompt? This action cannot be undone.</p>
        </Modal>
      ) : null}
    </main>
  )
}
