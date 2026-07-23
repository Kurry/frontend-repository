import { useState, useRef, useLayoutEffect, useEffect } from 'preact/hooks';
import {
  projects, filters, sort, selected,
  createProject, updateProject, deleteProject, duplicateProject,
  toggleFeatured, batchFeatured, batchDelete, STATUSES,
} from './store.js';
import { ProjectForm } from './forms.jsx';
import gsap from 'gsap';

const statusIcon = { shipped: 'tabler--circle-check', wip: 'tabler--loader-2', archived: 'tabler--archive' };
const statusLabel = { shipped: 'Shipped', wip: 'Work in Progress', archived: 'Archived' };

export default function Board() {
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState(null); // project being edited
  const [confirmDelete, setConfirmDelete] = useState(null); // slug pending confirm
  const [batchConfirm, setBatchConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const [leaving, setLeaving] = useState(new Set());
  const seen = useRef(new Set());
  const gridRef = useRef(null);
  const reduce = useRef(false);
  useEffect(() => { reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false; }, []);

  const allTags = Array.from(new Set(projects.value.flatMap((p) => p.tags))).sort();

  const visible = projects.value
    .filter((p) => {
      if (filters.value.status && p.status !== filters.value.status) return false;
      if (filters.value.tag && !p.tags.includes(filters.value.tag)) return false;
      if (filters.value.featured !== null && p.featured !== filters.value.featured) return false;
      return true;
    })
    .filter((p) => !leaving.has(p.slug))
    .sort((a, b) => {
      if (sort.value === 'name-asc') return a.name.localeCompare(b.name);
      if (sort.value === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  // Enter animation for newly mounted cards.
  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.board-card');
    const fresh = [];
    cards.forEach((el) => {
      const slug = el.getAttribute('data-slug');
      if (!seen.current.has(slug)) { seen.current.add(slug); fresh.push(el); }
    });
    if (fresh.length && !reduce.current) {
      gsap.fromTo(fresh, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, stagger: 0.04, ease: 'power2.out' });
    }
  }, [visible.map((p) => p.slug).join('|'), isCreating, editing]);

  const onCreate = (data) => {
    const res = createProject(data);
    if (res.ok) { setIsCreating(false); setNotice(`Created "${res.value.name}". It now appears on the board, in /work, and in the export preview.`); }
    return res;
  };
  const onUpdate = (data) => {
    const originalSlug = editing ? editing.slug : data.slug;
    const res = updateProject(originalSlug, data);
    if (res.ok) { setEditing(null); setNotice(`Updated "${res.value.name}" across the board, /work, detail, autocomplete, and exports.`); }
    return res;
  };

  const doDelete = (slug) => {
    const name = projects.value.find((p) => p.slug === slug)?.name || slug;
    const el = gridRef.current?.querySelector(`.board-card[data-slug="${slug}"]`);
    const finish = () => {
      deleteProject(slug);
      setConfirmDelete(null);
      setNotice(`Deleted "${name}". Undo restores it everywhere, including the export preview.`);
    };
    if (el && !reduce.current) {
      setLeaving((s) => new Set(s).add(slug));
      gsap.to(el, { opacity: 0, x: -16, height: 0, marginTop: 0, marginBottom: 0, duration: 0.28, ease: 'power2.in', onComplete: () => { setLeaving((s) => { const n = new Set(s); n.delete(slug); return n; }); finish(); } });
    } else finish();
  };

  const onDuplicate = (slug) => {
    const res = duplicateProject(slug);
    if (res.ok) setNotice(`Duplicated as "${res.value.name}" with a unique slug.`);
  };

  const toggleSel = (slug) => setSelected((s) => s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.value.includes(p.slug));
  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelected((s) => s.filter((x) => !visible.some((p) => p.slug === x)));
    else setSelected((s) => Array.from(new Set([...s, ...visible.map((p) => p.slug)])));
  };

  const onBatchFeatured = () => {
    const res = batchFeatured(selected.value);
    if (res.ok) { setNotice(res.message || `Toggled featured on ${selected.value.length} selected project(s).`); }
    else setNotice(res.message || '');
  };
  const onBatchDelete = () => {
    const res = batchDelete(selected.value);
    if (res.ok) { setNotice(`Deleted ${res.count} selected project(s). Undo restores them.`); setBatchConfirm(false); setSelected([]); }
    else setNotice(res.message || '');
  };

  const clearFilters = () => { filters.value = { status: null, tag: null, featured: null }; };
  const hasFilter = filters.value.status || filters.value.tag || filters.value.featured !== null;

  return (
    <div className="board surface-fade">
      <div className="board-head">
        <h2 className="surface-h">Projects Board</h2>
        <div className="board-head-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setIsCreating(true); setEditing(null); }}><span className="icon-[tabler--plus] size-4" /> New Project</button>
        </div>
      </div>

      <div aria-live="polite" className="form-live">{notice}</div>

      <div className="board-controls">
        <div className="control-group" role="group" aria-label="Filter by status">
          <span className="control-label">Status</span>
          {STATUSES.map((s) => (
            <button key={s} type="button" className={`filter-chip ${filters.value.status === s ? 'is-on' : ''}`} aria-pressed={filters.value.status === s} onClick={() => { filters.value = { ...filters.value, status: filters.value.status === s ? null : s }; }}>{statusLabel[s]}</button>
          ))}
          <button type="button" className={`filter-chip ${filters.value.featured === true ? 'is-on' : ''}`} aria-pressed={filters.value.featured === true} onClick={() => { filters.value = { ...filters.value, featured: filters.value.featured === true ? null : true }; }}><span className="icon-[tabler--star-filled] size-3" /> Featured</button>
        </div>

        <div className="control-group" role="group" aria-label="Filter by tag">
          <span className="control-label">Tag</span>
          <select className="select select-sm" value={filters.value.tag || ''} onChange={(e) => { filters.value = { ...filters.value, tag: e.target.value || null }; }} aria-label="Filter by tag">
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="control-group">
          <span className="control-label">Sort</span>
          <select className="select select-sm" value={sort.value || ''} onChange={(e) => { sort.value = e.target.value || null; }} aria-label="Sort projects by name">
            <option value="">Default order</option>
            <option value="name-asc">Name A to Z</option>
            <option value="name-desc">Name Z to A</option>
          </select>
          {hasFilter && <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}><span className="icon-[tabler--x] size-4" /> Clear filters</button>}
        </div>
      </div>

      <div className="batch-bar">
        <label className="select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} aria-label="Select all visible projects" />
          <span>Select all</span>
        </label>
        <span className="sel-count">{selected.value.length} selected</span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={selected.value.length === 0} onClick={onBatchFeatured}><span className="icon-[tabler--star] size-4" /> Batch featured</button>
        {batchConfirm
          ? <span className="confirm-inline"><span className="confirm-q">Delete {selected.value.length} selected?</span><button type="button" className="btn btn-sm btn-danger" onClick={onBatchDelete}>Confirm delete</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setBatchConfirm(false)}>Cancel</button></span>
          : <button type="button" className="btn btn-ghost btn-sm danger-text" disabled={selected.value.length === 0} onClick={() => setBatchConfirm(true)}><span className="icon-[tabler--trash] size-4" /> Batch delete</button>}
      </div>

      {isCreating && (
        <div className="inline-form"><ProjectForm onSubmit={onCreate} onCancel={() => setIsCreating(false)} /></div>
      )}
      {editing && (
        <div className="inline-form"><ProjectForm project={editing} onSubmit={onUpdate} onCancel={() => setEditing(null)} submitLabel="Save Changes" /></div>
      )}

      {visible.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="icon-[tabler--inbox] size-8 empty-icon" aria-hidden="true" />
          <h3 className="empty-h">{projects.value.length === 0 ? 'No projects yet' : 'No projects match these filters'}</h3>
          <p className="empty-p">{projects.value.length === 0 ? 'Your portfolio is empty. Create your first case study to populate the board, the /work listing, and the Portfolio JSON export.' : 'Try a different status or tag, or clear the filters to see the full collection again.'}</p>
          {projects.value.length === 0 && <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)}><span className="icon-[tabler--plus] size-4" /> New Project</button>}
          {hasFilter && projects.value.length > 0 && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>}
        </div>
      ) : (
        <div className="board-grid" ref={gridRef}>
          {visible.map((p) => (
            <article key={p.slug} data-slug={p.slug} className={`board-card ${leaving.has(p.slug) ? 'is-leaving' : ''}`}>
              <div className="card-top">
                <label className="card-check">
                  <input type="checkbox" checked={selected.value.includes(p.slug)} onChange={() => toggleSel(p.slug)} aria-label={`Select ${p.name}`} />
                </label>
                <h3 className="card-title">{p.name}{p.featured && <span className="icon-[tabler--star-filled] featured-star" title="Featured" aria-label="Featured" />}</h3>
              </div>
              <div className="card-meta">
                <span className="status-badge" data-status={p.status}><span className={`icon-[${statusIcon[p.status]}] size-3`} aria-hidden="true" />{statusLabel[p.status]}</span>
                <span className="card-year">{p.year}</span>
                {p.type && <span className="card-type">{p.type}</span>}
              </div>
              <p className="card-summary">{p.summary}</p>
              <div className="card-tags">
                {p.tags.map((t) => (
                  <button key={t} type="button" className="tag-chip clickable" aria-pressed={filters.value.tag === t} onClick={() => { filters.value = { ...filters.value, tag: filters.value.tag === t ? null : t }; }}>{t}</button>
                ))}
              </div>
              <div className="card-actions">
                <button type="button" className={`icon-btn ${p.featured ? 'featured-on' : ''}`} onClick={() => { const r = toggleFeatured(p.slug); setNotice(r.ok ? `${p.name} ${r.featured ? 'pinned as featured' : 'unpinned'}.` : (r.message || '')); }} aria-pressed={p.featured} aria-label={p.featured ? `Unfeature ${p.name}` : `Feature ${p.name}`} title="Toggle featured">
                  <span className={`icon-[${p.featured ? 'tabler--star-filled' : 'tabler--star'}] size-4`} />
                </button>
                <button type="button" className="icon-btn" onClick={() => { setEditing(p); setIsCreating(false); }} aria-label={`Edit ${p.name}`} title="Edit"><span className="icon-[tabler--pencil] size-4" /></button>
                <button type="button" className="icon-btn" onClick={() => onDuplicate(p.slug)} aria-label={`Duplicate ${p.name}`} title="Duplicate"><span className="icon-[tabler--copy] size-4" /></button>
                {confirmDelete === p.slug
                  ? <span className="confirm-inline"><span className="confirm-q">Delete?</span><button type="button" className="btn btn-sm btn-danger" onClick={() => doDelete(p.slug)}>Confirm</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button></span>
                  : <button type="button" className="icon-btn danger" onClick={() => setConfirmDelete(p.slug)} aria-label={`Delete ${p.name}`} title="Delete"><span className="icon-[tabler--trash] size-4" /></button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function setSelected(next) { selected.value = typeof next === 'function' ? next(selected.value) : next; }
