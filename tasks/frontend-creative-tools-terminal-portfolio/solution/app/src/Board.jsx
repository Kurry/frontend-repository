import { useState } from 'preact/hooks';
import { projects, filters, sort, mode } from './store.js';
import { ProjectForm, ConfigStudio } from './forms.jsx';
import ExportCenter from './ExportCenter.jsx';

export default function Board() {
  const [editingProject, setEditingProject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (mode.value === 'config') {
    return (
      <div className="h-full overflow-y-auto relative p-4">
        <button className="btn btn-sm btn-ghost mb-4" onClick={() => mode.value = 'board'}>&larr; Back to Board</button>
        <ConfigStudio />
      </div>
    );
  }

  if (mode.value === 'export') {
    return <ExportCenter />;
  }

  const handleCreate = (newProject) => {
    projects.value = [...projects.value, newProject];
    setIsCreating(false);
  };

  const handleUpdate = (updatedProject) => {
    projects.value = projects.value.map(p => p.slug === updatedProject.slug ? updatedProject : p);
    setEditingProject(null);
  };

  const handleDelete = (slug) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      projects.value = projects.value.filter(p => p.slug !== slug);
    }
  };

  const handleExport = () => {
    mode.value = 'export';
  };

  const visibleProjects = projects.value
    .filter(p => {
      if (filters.value.status && p.status !== filters.value.status) return false;
      if (filters.value.tag && !p.tags.includes(filters.value.tag)) return false;
      if (filters.value.featured !== null && p.featured !== filters.value.featured) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort.value === 'name-asc') return a.name.localeCompare(b.name);
      if (sort.value === 'name-desc') return b.name.localeCompare(a.name);
      return 0; // Default order
    });

  return (
    <div className="h-full flex flex-col relative text-text-main">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Projects Board</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={() => setIsCreating(true)}>New Project</button>
          <button className="btn btn-sm btn-outline" onClick={() => mode.value = 'config'}>Config Studio</button>
          <button className="btn btn-sm btn-outline" onClick={handleExport}>Export</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 bg-base-200 p-2 rounded-lg">
        <div className="text-sm self-center mr-2 font-bold opacity-70">Filters:</div>
        {['shipped', 'wip', 'archived'].map(s => (
          <button
            key={s}
            className={`btn btn-xs ${filters.value.status === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => filters.value = { ...filters.value, status: filters.value.status === s ? null : s }}
            aria-label={`Filter by status ${s}`}
          >
            {s}
          </button>
        ))}
        <div className="divider divider-horizontal mx-0"></div>
        <button
          className={`btn btn-xs ${filters.value.featured === true ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => filters.value = { ...filters.value, featured: filters.value.featured === true ? null : true }}
          aria-label="Filter featured"
        >
          Featured
        </button>

        <div className="divider divider-horizontal mx-0"></div>
        <select
          className="select select-xs select-ghost w-auto"
          value={sort.value || ''}
          onChange={(e) => sort.value = e.target.value || null}
          aria-label="Sort projects"
        >
          <option value="">Sort: Default</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>

      {isCreating && (
        <div className="mb-6">
          <ProjectForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      {editingProject && (
        <div className="mb-6">
          <ProjectForm project={editingProject} onSubmit={handleUpdate} onCancel={() => setEditingProject(null)} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {visibleProjects.length === 0 ? (
          <div className="text-center py-10 opacity-50 italic">
            No projects found matching the current filters.
            {projects.value.length === 0 && " The collection is empty. Add a new project."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visibleProjects.map(p => (
              <div key={p.slug} className="card bg-base-200 shadow-sm border border-border hover:border-primary transition-colors">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="card-title text-lg m-0">{p.name} {p.featured && <span className="text-yellow-500 text-xs ml-1" title="Featured">★</span>}</h3>
                    <div className="flex gap-1">
                      <button className="btn btn-xs btn-square btn-ghost" onClick={() => setEditingProject(p)} aria-label={`Edit ${p.name}`}>✎</button>
                      <button className="btn btn-xs btn-square btn-ghost text-error" onClick={() => handleDelete(p.slug)} aria-label={`Delete ${p.name}`}>✕</button>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs opacity-70 mb-2">
                    <span>{p.year}</span>
                    <span>&bull;</span>
                    <span>{p.type}</span>
                    <span>&bull;</span>
                    <span className={`uppercase font-bold ${p.status === 'shipped' ? 'text-success' : p.status === 'wip' ? 'text-warning' : ''}`}>{p.status}</span>
                  </div>
                  <p className="text-sm mb-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {p.tags.map(t => (
                      <span key={t} className="badge badge-sm badge-outline cursor-pointer hover:bg-base-300" onClick={() => filters.value = { ...filters.value, tag: filters.value.tag === t ? null : t }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
