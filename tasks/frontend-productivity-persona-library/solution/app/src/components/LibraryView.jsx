import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Modal, TextInput } from '@carbon/react'
import { Add, Archive, Close, Merge, TagEdit, TrashCan, Undo } from '@carbon/icons-react'
import { captureFocus } from '../focus'
import { useAppStore, visiblePersonas } from '../store'
import { bulkTagSchema } from '../schema'
import PersonaCard from './PersonaCard'

function FacetRail() {
  const personas = useAppStore((s) => s.personas)
  const filters = useAppStore((s) => s.filters)
  const filtersOpen = useAppStore((s) => s.ui.filtersOpen)
  const setFilters = useAppStore((s) => s.setFilters)
  const q = filters.search.trim().toLowerCase()
  const candidates = personas.filter((p) => p.archived === filters.archived && (!q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)) && (filters.role === 'All roles' || p.role === filters.role))
  const counts = candidates.reduce((acc, p) => {
    p.tags.forEach((tag) => { acc[tag] = (acc[tag] || 0) + 1 })
    return acc
  }, {})
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const visibleCount = filters.tag ? candidates.filter((persona) => persona.tags.includes(filters.tag)).length : candidates.length

  return (
    <aside className={`facet-rail ${filtersOpen ? 'open' : ''}`} aria-label="Tag facets">
      <div className="facet-title"><div><span>DISCOVER</span><p className="facet-heading" id="facet-tags-heading">Tags</p></div><Button className="facet-close" kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription="Close filters" onClick={() => useAppStore.getState().setUI({ filtersOpen: false })} /></div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      <li><button className={!filters.tag ? 'facet-entry active' : 'facet-entry'} onClick={() => setFilters({ tag: null })}><span>All tags</span><b>{visibleCount}</b></button></li>
      {entries.map(([tag, count]) => (
        <li key={tag}><button className={filters.tag === tag ? 'facet-entry active' : 'facet-entry'} aria-pressed={filters.tag === tag} onClick={() => setFilters({ tag: filters.tag === tag ? null : tag })}><span>{tag}</span><b>{count}</b></button></li>
      ))}
      </ul>
    </aside>
  )
}

function BulkTray() {
  const selectedIds = useAppStore((s) => s.selectedIds)
  const bulkTags = useAppStore((s) => s.bulkTags)
  const bulkArchive = useAppStore((s) => s.bulkArchive)
  const deletePersonas = useAppStore((s) => s.deletePersonas)
  const clearSelection = useAppStore((s) => s.clearSelection)
  const toast = useAppStore((s) => s.toast)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors }, reset } = useForm({ resolver: zodResolver(bulkTagSchema), defaultValues: { tag: '' }, mode: 'onChange' })
  if (!selectedIds.length) return null

  const applyTag = (remove = false) => handleSubmit(({ tag }) => {
    bulkTags(selectedIds, tag, remove)
    toast(`${remove ? 'Removed' : 'Added'} “${tag}” ${remove ? 'from' : 'to'} ${selectedIds.length} personas`)
    reset()
  })()

  return (
    <>
      <div className="bulk-tray" aria-label="Bulk actions">
        <div className="bulk-count"><strong>{selectedIds.length}</strong><span>selected</span></div>
        <div className="bulk-tag-form">
          <TextInput id="bulk-tag" labelText="Bulk tag" hideLabel placeholder="Tag name" {...register('tag')} invalid={Boolean(errors.tag)} invalidText={errors.tag?.message} />
          <Button size="sm" kind="tertiary" renderIcon={Add} onClick={() => applyTag(false)}>Add tag</Button>
          <Button size="sm" kind="ghost" renderIcon={TagEdit} onClick={() => applyTag(true)}>Remove tag</Button>
        </div>
        <Button size="sm" kind="ghost" renderIcon={Archive} onClick={() => { bulkArchive(selectedIds, true); toast(`Archived ${selectedIds.length} personas`) }}>Archive</Button>
        <Button size="sm" kind="ghost" renderIcon={Undo} onClick={() => { bulkArchive(selectedIds, false); toast(`Unarchived ${selectedIds.length} personas`) }}>Unarchive</Button>
        <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} onClick={() => setConfirmDelete(true)}>Delete</Button>
        <Button size="sm" kind="ghost" hasIconOnly renderIcon={Close} iconDescription="Clear selection" onClick={clearSelection} />
      </div>
      <Modal open={confirmDelete} danger modalHeading={`Delete ${selectedIds.length} persona${selectedIds.length === 1 ? '' : 's'}?`} primaryButtonText={`Delete ${selectedIds.length}`} secondaryButtonText="Cancel" onRequestClose={() => setConfirmDelete(false)} onRequestSubmit={() => { deletePersonas(selectedIds); setConfirmDelete(false); toast(`Deleted ${selectedIds.length} personas`) }}>
        <p>This action removes the selected personas from the library, comparison, and Test Bench. You can undo it from the toolbar.</p>
      </Modal>
    </>
  )
}

export default function LibraryView() {
  const personas = useAppStore((s) => s.personas)
  const filters = useAppStore((s) => s.filters)
  const visible = useMemo(() => visiblePersonas({ personas, filters }), [personas, filters])
  const clearFilters = useAppStore((s) => s.clearFilters)
  const openEditor = useAppStore((s) => s.openEditor)
  const setUI = useAppStore((s) => s.setUI)
  const filterNames = useMemo(() => [filters.search && `search “${filters.search}”`, filters.role !== 'All roles' && filters.role, filters.tag && `tag “${filters.tag}”`, filters.archived && 'archived'].filter(Boolean), [filters])

  return (
    <main className="library-view view-shell" id="main-content">
      <section className="library-main">
        <header className="view-heading">
          <div><p className="eyebrow">PERSONA COLLECTION</p><h1>{filters.archived ? 'Archived Personas' : 'Your Persona Library'}</h1><p>{visible.length} of {personas.filter((p) => p.archived === filters.archived).length} personas · shared traits, prompts, and iterations</p></div>
          <div className="heading-actions"><Button kind="tertiary" renderIcon={Merge} onClick={() => { captureFocus(); setUI({ composeOpen: true }) }}>Compose</Button><Button renderIcon={Add} onClick={() => openEditor(null)}>New Persona</Button></div>
        </header>
        {visible.length ? (
          <>
            <h2 className="grid-section-title">Persona Cards</h2>
            <div className="persona-grid">{visible.map((persona, index) => <PersonaCard key={persona.id} index={index} persona={persona} />)}</div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-orbit"><span /></div>
            <h2>{personas.length ? 'No Personas Match These Filters' : 'Your Library Is Ready for Its First Persona'}</h2>
            <p>{personas.length ? `Active filters: ${filterNames.join(', ') || 'none'}.` : 'Create or import a persona to begin building your team.'}</p>
            {personas.length ? <Button kind="tertiary" onClick={clearFilters}>Clear filters</Button> : <Button renderIcon={Add} onClick={() => openEditor(null)}>Create persona</Button>}
          </div>
        )}
      </section>
      <FacetRail />
      <BulkTray />
    </main>
  )
}
